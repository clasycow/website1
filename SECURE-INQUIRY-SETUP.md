# Secure inquiry setup

The form is ready for Cloudflare Pages. It will not send email until the private
keys below are added to the host.

## Required services

1. Create a free Cloudflare Turnstile widget for the website domain.
2. Create a Resend account, verify the sending domain, and create an API key.
3. Create an OpenAI API key for image safety screening.
4. In Cloudflare Pages, add a KV binding named `INQUIRY_RATE_LIMIT`.

## Browser configuration

Open `js/config.js` and add the public Turnstile site key:

```js
window.NUMEN_CONFIG = {
    turnstileSiteKey: "YOUR_PUBLIC_TURNSTILE_SITE_KEY"
};
```

## Private server variables

Add these as encrypted environment variables in Cloudflare Pages:

```text
TURNSTILE_SECRET_KEY=...
RESEND_API_KEY=...
OPENAI_API_KEY=...
INQUIRY_TO_EMAIL=the-email-that-should-receive-inquiries@example.com
INQUIRY_FROM_EMAIL=Numen Nails <inquiries@your-verified-domain.com>
```

Never put secret keys in `index.html`, `scripts.js`, `config.js`, or GitHub.

## Protections included

- Cloudflare edge protection and Turnstile bot checks
- Honeypot and minimum-completion-time bot traps
- Four accepted attempts per IP per hour
- Five-photo maximum
- JPG, PNG, and WebP only
- 4 MB maximum per photo and 15 MB total
- File-signature checks instead of trusting filenames
- Server-side unsafe-image screening
- Escaped email output to prevent HTML injection
- Generic errors that do not expose private configuration

No public form can be made literally impossible to attack. Cloudflare's managed
DDoS protection should remain enabled, and usage alerts should be configured
for Resend and OpenAI.
