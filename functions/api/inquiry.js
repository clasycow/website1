const JSON_HEADERS = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
};

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILES = 5;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const RATE_WINDOW_SECONDS = 60 * 60;
const RATE_LIMIT = 4;

const reply = (status, message) =>
    new Response(JSON.stringify({ ok: status >= 200 && status < 300, message }), {
        status,
        headers: JSON_HEADERS,
    });

const clean = (value, max) =>
    String(value || "")
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);

const escapeHtml = (value) =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const bytesToBase64 = (bytes) => {
    let binary = "";
    const chunk = 0x8000;
    for (let index = 0; index < bytes.length; index += chunk) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
    }
    return btoa(binary);
};

const signatureMatches = (bytes, type) => {
    if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (type === "image/png") {
        return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    }
    if (type === "image/webp") {
        return String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
            String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
    }
    return false;
};

async function verifyTurnstile(request, env, token) {
    if (!env.TURNSTILE_SECRET_KEY) return false;
    const body = new FormData();
    body.append("secret", env.TURNSTILE_SECRET_KEY);
    body.append("response", token);
    body.append("remoteip", request.headers.get("CF-Connecting-IP") || "");
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body,
    });
    const result = await response.json();
    return result.success === true;
}

async function checkRateLimit(env, ip) {
    if (!env.INQUIRY_RATE_LIMIT) return true;
    const bucket = Math.floor(Date.now() / (RATE_WINDOW_SECONDS * 1000));
    const key = `inquiry:${ip}:${bucket}`;
    const current = Number((await env.INQUIRY_RATE_LIMIT.get(key)) || "0");
    if (current >= RATE_LIMIT) return false;
    await env.INQUIRY_RATE_LIMIT.put(key, String(current + 1), {
        expirationTtl: RATE_WINDOW_SECONDS + 60,
    });
    return true;
}

async function imagesAreSafe(env, images) {
    if (!env.OPENAI_API_KEY || images.length === 0) return images.length === 0;
    const input = [{
        type: "text",
        text: "Screen these nail-design reference images for sexual, nude, graphic, violent, or otherwise unsafe visual content.",
    }];
    images.forEach((image) => {
        input.push({
            type: "image_url",
            image_url: { url: `data:${image.type};base64,${image.base64}` },
        });
    });
    const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
            authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({ model: "omni-moderation-latest", input }),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return !result.results?.some((item) => item.flagged);
}

export async function onRequestPost({ request, env }) {
    try {
        const contentLength = Number(request.headers.get("content-length") || "0");
        if (contentLength > MAX_TOTAL_BYTES + 100_000) {
            return reply(413, "Those files are too large. Please choose smaller images.");
        }

        const form = await request.formData();
        if (clean(form.get("website"), 100)) return reply(200, "Your vision was sent.");

        const startedAt = Number(form.get("startedAt"));
        if (!Number.isFinite(startedAt) || Date.now() - startedAt < 3000 || Date.now() - startedAt > 86_400_000) {
            return reply(400, "Please refresh the page and try again.");
        }

        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        if (!(await checkRateLimit(env, ip))) {
            return reply(429, "Too many inquiries were sent from this connection. Please try again later.");
        }

        const captchaToken = clean(form.get("cf-turnstile-response"), 4096);
        if (!(await verifyTurnstile(request, env, captchaToken))) {
            return reply(403, "Please complete the security check and try again.");
        }

        const name = clean(form.get("name"), 80);
        const email = clean(form.get("email"), 160);
        const service = clean(form.get("service"), 100);
        const message = clean(form.get("message"), 700);
        const moods = form.getAll("mood").map((mood) => clean(mood, 40)).filter(Boolean).slice(0, 6);

        if (!name || !service || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return reply(400, "Please check the required details and try again.");
        }

        const files = form.getAll("photos").filter((item) => item instanceof File && item.size > 0);
        if (files.length > MAX_FILES) return reply(400, "Please choose no more than five photos.");

        let totalBytes = 0;
        const images = [];
        for (const file of files) {
            totalBytes += file.size;
            if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_BYTES || totalBytes > MAX_TOTAL_BYTES) {
                return reply(400, "Each photo must be a JPG, PNG, or WebP under 4 MB.");
            }
            const bytes = new Uint8Array(await file.arrayBuffer());
            if (!signatureMatches(bytes, file.type)) return reply(400, "One photo could not be verified as a safe image.");
            images.push({
                filename: clean(file.name, 100) || `reference-${images.length + 1}`,
                type: file.type,
                base64: bytesToBase64(bytes),
            });
        }

        if (!(await imagesAreSafe(env, images))) {
            return reply(400, "One or more photos could not pass the safety screening.");
        }

        if (!env.RESEND_API_KEY || !env.INQUIRY_TO_EMAIL || !env.INQUIRY_FROM_EMAIL) {
            return reply(503, "Inquiry delivery is being configured. Please try again soon.");
        }

        const rows = [
            ["Client", name],
            ["Reply email", email],
            ["Service", service],
            ["Mood", moods.length ? moods.join(", ") : "Not selected"],
            ["Reference photos", String(images.length)],
        ];
        const table = rows.map(([label, value]) =>
            `<tr><th style="padding:9px 14px;text-align:left;color:#71587e">${escapeHtml(label)}</th><td style="padding:9px 14px">${escapeHtml(value)}</td></tr>`
        ).join("");

        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                authorization: `Bearer ${env.RESEND_API_KEY}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                from: env.INQUIRY_FROM_EMAIL,
                to: [env.INQUIRY_TO_EMAIL],
                reply_to: email,
                subject: `New Numen Nails vision — ${service}`,
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#2f2436">
                        <div style="padding:28px;background:#30213d;color:#fff;border-radius:18px 18px 0 0">
                            <div style="font-size:13px;letter-spacing:2px;color:#e7c98f">NUMEN NAILS INQUIRY</div>
                            <h1 style="margin:8px 0 0">A new vision arrived ✦</h1>
                        </div>
                        <table style="width:100%;border-collapse:collapse;background:#faf6fb">${table}</table>
                        <div style="padding:22px 28px;background:#fff;border-radius:0 0 18px 18px">
                            <h2 style="color:#71587e">Their vision</h2>
                            <p style="white-space:pre-wrap;line-height:1.7">${escapeHtml(message)}</p>
                            <p style="font-size:12px;color:#746b78">Reply directly to this email to answer ${escapeHtml(name)}.</p>
                        </div>
                    </div>`,
                text: `New Numen Nails inquiry\n\nName: ${name}\nEmail: ${email}\nService: ${service}\nMood: ${moods.join(", ") || "Not selected"}\nPhotos: ${images.length}\n\nTheir vision:\n${message}`,
                attachments: images.map(({ filename, base64 }) => ({ filename, content: base64 })),
            }),
        });

        if (!emailResponse.ok) return reply(502, "Your vision could not be delivered right now. Please try again.");
        return reply(200, "Your vision has been sent ✦ I’ll be in touch within 1–2 business days.");
    } catch {
        return reply(500, "Something interrupted the magic. Please try again.");
    }
}

export async function onRequest() {
    return reply(405, "Method not allowed.");
}
