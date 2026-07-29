(() => {
    const preloader = document.querySelector('#enchantedPreloader');
    const progressBar = document.querySelector('#preloaderProgress');
    const progressTrack = preloader?.querySelector('.preloader-progress');
    const progressPercent = document.querySelector('#preloaderPercent');
    const progressCopy = document.querySelector('#preloaderCopy');

    if (!preloader || !progressBar) {
        document.body.classList.remove('is-loading');
        return;
    }

    const loadingPhrases = [
        'Awakening the forest',
        'Gathering moonlight',
        'Waking the fireflies',
        'Opening the enchanted forest',
    ];
    let visualProgress = 0;
    let hasFinished = false;

    const paintProgress = (value) => {
        const safeValue = Math.min(Math.max(Math.round(value), 0), 100);
        progressBar.style.width = `${safeValue}%`;
        progressTrack?.setAttribute('aria-valuenow', String(safeValue));
        if (progressPercent) progressPercent.textContent = `${safeValue}%`;

        if (progressCopy) {
            const phraseIndex = Math.min(
                Math.floor(safeValue / 26),
                loadingPhrases.length - 1
            );
            progressCopy.textContent = loadingPhrases[phraseIndex];
        }
    };

    const loadingInterval = window.setInterval(() => {
        if (visualProgress >= 88 || hasFinished) return;
        visualProgress += Math.max(1, (88 - visualProgress) * 0.075);
        paintProgress(visualProgress);
    }, 90);

    const finishPreloader = () => {
        if (hasFinished) return;
        hasFinished = true;
        window.clearInterval(loadingInterval);
        paintProgress(100);

        window.setTimeout(() => {
            preloader.classList.add('is-complete');
            preloader.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('is-loading');
        }, 360);
    };

    if (document.readyState === 'complete') {
        finishPreloader();
    } else {
        window.addEventListener('load', finishPreloader, { once: true });
    }

    window.setTimeout(finishPreloader, 5200);
})();

window.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const masthead = document.querySelector('.masthead');
    const aboutSection = document.querySelector('.about-section');
    const aboutCard = document.querySelector('.about-card');
    const projectsSection = document.querySelector('.nail-portfolio');
    const projectRevealElements = document.querySelectorAll('.projects-reveal');
    const endingRevealElements = document.querySelectorAll('.ending-reveal');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const navbarShrink = () => {
        const navbar = document.body.querySelector('#mainNav');
        if (!navbar) return;
        navbar.classList.toggle('navbar-shrink', window.scrollY !== 0);
    };

    navbarShrink();

    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav && window.bootstrap) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    }

    const navbarToggler = document.body.querySelector('.navbar-toggler');
    document.querySelectorAll('#navbarResponsive .nav-link').forEach((item) => {
        item.addEventListener('click', () => {
            if (navbarToggler && window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    if (aboutCard) {
        if ('IntersectionObserver' in window && !reduceMotion.matches) {
            const revealAbout = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.18,
                rootMargin: '0px 0px -8% 0px',
            });

            revealAbout.observe(aboutCard);
        } else {
            aboutCard.classList.add('is-visible');
        }
    }

    if (projectRevealElements.length) {
        if ('IntersectionObserver' in window && !reduceMotion.matches) {
            const revealProjects = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -6% 0px',
            });

            projectRevealElements.forEach((element) => revealProjects.observe(element));
        } else {
            projectRevealElements.forEach((element) => element.classList.add('is-visible'));
        }
    }

    if (endingRevealElements.length) {
        if ('IntersectionObserver' in window && !reduceMotion.matches) {
            const revealEnding = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
            }, {
                threshold: 0.12,
                rootMargin: '0px 0px -7% 0px',
            });

            endingRevealElements.forEach((element) => revealEnding.observe(element));
        } else {
            endingRevealElements.forEach((element) => element.classList.add('is-visible'));
        }
    }

    const sparkField = document.querySelector('.spark-field');
    if (sparkField) {
        const sparkCount = window.innerWidth < 768 ? 14 : 24;
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < sparkCount; index += 1) {
            const spark = document.createElement('span');
            const size = 2 + Math.random() * 3.5;

            spark.className = 'forest-spark';
            spark.style.setProperty('--spark-left', `${3 + Math.random() * 94}%`);
            spark.style.setProperty('--spark-top', `${5 + Math.random() * 88}%`);
            spark.style.setProperty('--spark-size', `${size.toFixed(1)}px`);
            spark.style.setProperty('--spark-duration', `${5 + Math.random() * 6}s`);
            spark.style.setProperty('--spark-delay', `${-Math.random() * 10}s`);
            spark.style.setProperty('--spark-drift', `${-24 + Math.random() * 48}px`);
            spark.style.setProperty('--spark-opacity', `${0.4 + Math.random() * 0.55}`);
            fragment.appendChild(spark);
        }

        sparkField.appendChild(fragment);
    }

    if (aboutCard && window.matchMedia('(pointer: fine)').matches && !reduceMotion.matches) {
        aboutCard.addEventListener('pointermove', (event) => {
            const bounds = aboutCard.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width;
            const y = (event.clientY - bounds.top) / bounds.height;

            aboutCard.style.setProperty('--card-glow-x', `${(x * 100).toFixed(1)}%`);
            aboutCard.style.setProperty('--card-glow-y', `${(y * 100).toFixed(1)}%`);
            aboutCard.style.setProperty('--card-tilt-x', `${((0.5 - y) * 2.4).toFixed(2)}deg`);
            aboutCard.style.setProperty('--card-tilt-y', `${((x - 0.5) * 2.8).toFixed(2)}deg`);
        });

        aboutCard.addEventListener('pointerleave', () => {
            aboutCard.style.setProperty('--card-glow-x', '50%');
            aboutCard.style.setProperty('--card-glow-y', '50%');
            aboutCard.style.setProperty('--card-tilt-x', '0deg');
            aboutCard.style.setProperty('--card-tilt-y', '0deg');
        });
    }

    const nailGallery = document.querySelector('#nailGallery');
    const galleryFilters = document.querySelectorAll('.gallery-filter');
    const galleryCards = nailGallery ? Array.from(nailGallery.querySelectorAll('.nail-card')) : [];
    const photoCards = galleryCards.filter((card) => !card.classList.contains('nail-card-callout'));
    const galleryCount = document.querySelector('.gallery-count');

    const setGalleryCount = (filter) => {
        if (!galleryCount) return;

        const visiblePhotos = photoCards.filter((card) => {
            if (filter === 'all') return true;
            return (card.dataset.category || '').split(' ').includes(filter);
        }).length;

        const label = visiblePhotos === 1 ? 'photo space ready' : 'photo spaces ready';
        galleryCount.innerHTML = `<strong>${visiblePhotos}</strong> ${label}`;
    };

    galleryFilters.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedFilter = button.dataset.filter || 'all';

            galleryFilters.forEach((filterButton) => {
                const isSelected = filterButton === button;
                filterButton.classList.toggle('is-active', isSelected);
                filterButton.setAttribute('aria-pressed', String(isSelected));
            });

            if (!nailGallery) return;

            nailGallery.classList.add('is-switching');

            window.setTimeout(() => {
                galleryCards.forEach((card) => {
                    const categories = (card.dataset.category || '').split(' ');
                    const isCallout = card.classList.contains('nail-card-callout');
                    const shouldShow = selectedFilter === 'all' || isCallout || categories.includes(selectedFilter);
                    card.hidden = !shouldShow;
                });

                setGalleryCount(selectedFilter);

                window.requestAnimationFrame(() => {
                    nailGallery.classList.remove('is-switching');
                });
            }, reduceMotion.matches ? 0 : 150);
        });
    });

    setGalleryCount('all');

    const endingFireflies = document.querySelector('.ending-fireflies');
    if (endingFireflies) {
        const fireflyCount = window.innerWidth < 768 ? 18 : 34;
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < fireflyCount; index += 1) {
            const firefly = document.createElement('span');
            const size = 1.5 + Math.random() * 3;

            firefly.className = 'ending-firefly';
            firefly.style.setProperty('--firefly-x', `${2 + Math.random() * 96}%`);
            firefly.style.setProperty('--firefly-y', `${4 + Math.random() * 91}%`);
            firefly.style.setProperty('--firefly-size', `${size.toFixed(1)}px`);
            firefly.style.setProperty('--firefly-speed', `${4.5 + Math.random() * 6}s`);
            firefly.style.setProperty('--firefly-delay', `${-Math.random() * 8}s`);
            firefly.style.setProperty('--firefly-drift', `${-32 + Math.random() * 64}px`);
            firefly.style.setProperty('--firefly-opacity', `${0.45 + Math.random() * 0.5}`);
            fragment.appendChild(firefly);
        }

        endingFireflies.appendChild(fragment);
    }

    const moonletterForm = document.querySelector('#moonletterForm');
    const moonletterEmail = document.querySelector('#moonletterEmail');
    const moonletterStatus = document.querySelector('#moonletterStatus');

    if (moonletterForm && moonletterEmail && moonletterStatus) {
        moonletterEmail.addEventListener('input', () => {
            moonletterEmail.removeAttribute('aria-invalid');
            moonletterStatus.textContent = '';
            moonletterStatus.classList.remove('is-error');
        });

        moonletterForm.addEventListener('submit', (event) => {
            event.preventDefault();

            if (!moonletterEmail.checkValidity()) {
                moonletterEmail.setAttribute('aria-invalid', 'true');
                moonletterStatus.textContent = 'Please enter a valid email address.';
                moonletterStatus.classList.add('is-error');
                moonletterEmail.focus();
                return;
            }

            const submitButton = moonletterForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = 'Sending a little magic <i class="fas fa-sparkles" aria-hidden="true"></i>';
            }

            window.setTimeout(() => {
                moonletterStatus.textContent = 'The moonletter is ready ✦ Connect your mailing-list service before publishing.';
                moonletterStatus.classList.remove('is-error');
                moonletterForm.reset();

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Enter the circle <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>';
                }
            }, reduceMotion.matches ? 0 : 650);
        });
    }

    const bookingForm = document.querySelector('#bookingForm');
    const bookingMessage = document.querySelector('#bookingMessage');
    const messageCount = document.querySelector('#messageCount');
    const bookingStatus = document.querySelector('#bookingStatus');

    if (bookingMessage && messageCount) {
        const updateMessageCount = () => {
            messageCount.textContent = String(bookingMessage.value.length);
        };

        bookingMessage.addEventListener('input', updateMessageCount);
        updateMessageCount();
    }

    if (bookingForm && bookingStatus) {
        const requiredFields = Array.from(bookingForm.querySelectorAll('[required]'));

        requiredFields.forEach((field) => {
            field.addEventListener('input', () => {
                field.removeAttribute('aria-invalid');
                bookingStatus.textContent = '';
                bookingStatus.classList.remove('is-error');
            });

            field.addEventListener('change', () => {
                field.removeAttribute('aria-invalid');
            });
        });

        bookingForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const invalidField = requiredFields.find((field) => !field.checkValidity());
            if (invalidField) {
                requiredFields.forEach((field) => {
                    field.setAttribute('aria-invalid', String(!field.checkValidity()));
                });
                bookingStatus.textContent = 'A few details still need your magic before this can be sent.';
                bookingStatus.classList.add('is-error');
                invalidField.focus();
                return;
            }

            const formData = new FormData(bookingForm);
            const moods = formData.getAll('mood');
            const bookingEmail = bookingForm.dataset.bookingEmail?.trim();
            const subject = `Numen Nails inquiry — ${formData.get('service')}`;
            const body = [
                `Name: ${formData.get('name')}`,
                `Email: ${formData.get('email')}`,
                `Service: ${formData.get('service')}`,
                `Mood: ${moods.length ? moods.join(', ') : 'Not selected'}`,
                '',
                String(formData.get('message') || ''),
            ].join('\n');

            bookingStatus.classList.remove('is-error');

            if (bookingEmail) {
                bookingStatus.textContent = 'Opening your enchanted message…';
                window.location.href = `mailto:${bookingEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            } else {
                bookingStatus.textContent = 'Your vision is ready ✦ Send it through the booking email or Instagram beside this form.';
            }
        });
    }

    const currentYear = document.querySelector('#currentYear');
    if (currentYear) currentYear.textContent = String(new Date().getFullYear());

    if (galleryCards.length && window.matchMedia('(pointer: fine)').matches && !reduceMotion.matches) {
        galleryCards.forEach((card) => {
            const cardInner = card.querySelector('.nail-card-inner');
            if (!cardInner) return;

            card.addEventListener('pointermove', (event) => {
                const bounds = card.getBoundingClientRect();
                const x = (event.clientX - bounds.left) / bounds.width;
                const y = (event.clientY - bounds.top) / bounds.height;

                cardInner.style.setProperty('--nail-tilt-x', `${((0.5 - y) * 1.8).toFixed(2)}deg`);
                cardInner.style.setProperty('--nail-tilt-y', `${((x - 0.5) * 2.2).toFixed(2)}deg`);
            });

            card.addEventListener('pointerleave', () => {
                cardInner.style.setProperty('--nail-tilt-x', '0deg');
                cardInner.style.setProperty('--nail-tilt-y', '0deg');
            });
        });
    }

    const nailModal = document.querySelector('#nailModal');
    const nailModalMedia = document.querySelector('#nailModalMedia');
    const nailModalTitle = document.querySelector('#nailModalTitle');
    const nailModalService = document.querySelector('#nailModalService');
    const nailModalDescription = document.querySelector('#nailModalDescription');
    const nailModalClose = document.querySelector('.nail-modal__close');

    const closeNailModal = () => {
        if (!nailModal) return;

        if (typeof nailModal.close === 'function') {
            nailModal.close();
        } else {
            nailModal.removeAttribute('open');
        }
    };

    document.querySelectorAll('.nail-card__open').forEach((button) => {
        button.addEventListener('click', () => {
            if (!nailModal) return;

            const card = button.closest('.nail-card');
            const sourceMedia = card ? card.querySelector('.nail-card__media') : null;

            if (nailModalMedia && sourceMedia) {
                const mediaClone = sourceMedia.cloneNode(true);
                nailModalMedia.replaceChildren(mediaClone);
            }

            if (nailModalTitle) nailModalTitle.textContent = card?.dataset.title || 'Nail Set';
            if (nailModalService) nailModalService.textContent = card?.dataset.service || 'Custom nail artistry';
            if (nailModalDescription) {
                nailModalDescription.textContent = card?.dataset.description || 'Ask about creating a custom version of this set.';
            }

            if (typeof nailModal.showModal === 'function') {
                nailModal.showModal();
            } else {
                nailModal.setAttribute('open', '');
            }
        });
    });

    if (nailModalClose) {
        nailModalClose.addEventListener('click', closeNailModal);
    }

    if (nailModal) {
        nailModal.addEventListener('click', (event) => {
            if (event.target === nailModal) closeNailModal();
        });

        nailModal.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', closeNailModal);
        });
    }

    let animationFrame = null;

    const updateScene = () => {
        animationFrame = null;
        navbarShrink();

        if (reduceMotion.matches) {
            root.style.setProperty('--hero-scroll', '0');
            root.style.setProperty('--about-scroll', '0');
            root.style.setProperty('--masthead-shift', '0px');
            root.style.setProperty('--hero-content-shift', '0px');
            root.style.setProperty('--hero-content-opacity', '1');
            root.style.setProperty('--about-shift', '0px');
            root.style.setProperty('--about-curve-shift', '0px');
            return;
        }

        const viewportHeight = Math.max(window.innerHeight, 1);
        const heroProgress = Math.min(Math.max(window.scrollY / viewportHeight, 0), 1.15);

        root.style.setProperty('--hero-scroll', heroProgress.toFixed(3));
        root.style.setProperty('--masthead-shift', `${(heroProgress * 28).toFixed(1)}px`);
        root.style.setProperty('--hero-content-shift', `${(heroProgress * -19).toFixed(1)}px`);
        root.style.setProperty('--hero-content-opacity', `${(1 - heroProgress * 0.43).toFixed(3)}`);

        if (aboutSection) {
            const aboutBounds = aboutSection.getBoundingClientRect();
            const aboutProgress = Math.min(
                Math.max((viewportHeight - aboutBounds.top) / (viewportHeight + aboutBounds.height), 0),
                1
            );

            root.style.setProperty('--about-scroll', aboutProgress.toFixed(3));
            root.style.setProperty('--about-shift', `${((aboutProgress - 0.35) * 24).toFixed(1)}px`);
            root.style.setProperty('--about-curve-shift', `${(aboutProgress * -13).toFixed(1)}px`);
        }

        if (projectsSection) {
            const projectBounds = projectsSection.getBoundingClientRect();
            const projectProgress = Math.min(
                Math.max((viewportHeight - projectBounds.top) / (viewportHeight + projectBounds.height), 0),
                1
            );

            root.style.setProperty('--projects-progress', projectProgress.toFixed(3));
        }
    };

    const requestSceneUpdate = () => {
        if (animationFrame === null) {
            animationFrame = window.requestAnimationFrame(updateScene);
        }
    };

    document.addEventListener('scroll', requestSceneUpdate, { passive: true });
    window.addEventListener('resize', requestSceneUpdate, { passive: true });

    if (typeof reduceMotion.addEventListener === 'function') {
        reduceMotion.addEventListener('change', requestSceneUpdate);
    } else if (typeof reduceMotion.addListener === 'function') {
        reduceMotion.addListener(requestSceneUpdate);
    }

    requestSceneUpdate();
});
