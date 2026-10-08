document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Section fade-in as each section comes into view
    const fadeElements = document.querySelectorAll('.fade-in');
    if ('IntersectionObserver' in window) {
        // Reveal as soon as any part is on screen, so tall sections never stay hidden
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0 });

        fadeElements.forEach(el => {
            observer.observe(el);
        });
    } else {
        fadeElements.forEach(el => el.classList.add('visible'));
    }

    // Cards rise as each one enters the screen, in sequence when several arrive together.
    // Watching every card (not its section) keeps this consistent at any window size.
    // Skipped for reduced motion; cards are never hidden without this script.
    const CARDS = '.skill-card, .timeline-item, .cert-card, .sys-card, .project-card, .highlight-item, .edu-featured-card, .feature-card, .projects-more';
    if (!reduceMotion && 'IntersectionObserver' in window) {
        const cards = [...document.querySelectorAll(CARDS)];
        cards.forEach(el => el.classList.add('reveal-item'));
        const cardObserver = new IntersectionObserver(entries => {
            const arriving = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
            arriving.forEach((entry, i) => {
                const el = entry.target;
                el.style.setProperty('--delay', Math.min(i, 6) * 80 + 'ms');
                el.classList.add('in');
                cardObserver.unobserve(el);
                // Hand the card back to its normal hover styles once it has landed
                setTimeout(() => {
                    el.classList.remove('reveal-item', 'in');
                    el.style.removeProperty('--delay');
                }, 1200 + i * 80);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        cards.forEach(el => cardObserver.observe(el));
    }

    // Count-up numbers (the final value is in the HTML, so it also shows without scripts)
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
        const countUp = el => {
            const target = Number(el.dataset.count);
            const suffix = el.dataset.suffix || '';
            const duration = 900;
            const start = performance.now();
            const tick = now => {
                const t = Math.min((now - start) / duration, 1);
                el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };
        const countObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    countUp(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });
        counters.forEach(el => {
            el.textContent = '0' + (el.dataset.suffix || '');
            countObserver.observe(el);
        });
    }

    // Highlight the nav link of the section in view (same-page links only)
    const spyLinks = [...document.querySelectorAll('.nav-links a[href^="#"]:not(.btn-primary)')];
    if (spyLinks.length && 'IntersectionObserver' in window) {
        const linkFor = id => spyLinks.find(a => a.getAttribute('href') === '#' + id);
        const spy = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                spyLinks.forEach(a => a.removeAttribute('aria-current'));
                const link = linkFor(entry.target.id);
                if (link) link.setAttribute('aria-current', 'location');
            });
        }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
        document.querySelectorAll('main section[id]').forEach(section => spy.observe(section));
    }

    // Mobile navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
        // Escape closes the open menu and returns focus to its button
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('open')) {
                navLinks.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
            }
        });
    }

    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const root = document.documentElement;
            const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', next);
            try {
                localStorage.setItem('theme', next);
            } catch (e) {}
            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.setAttribute('content', next === 'light' ? '#f4f6fa' : '#05080f');
        });
    }

    // Screenshot viewer: click a project screenshot to read it at full size
    const lightbox = document.getElementById('lightbox');
    if (lightbox && typeof lightbox.showModal === 'function') {
        const lightboxImg = lightbox.querySelector('img');
        document.querySelectorAll('.shot').forEach(button => {
            button.addEventListener('click', () => {
                const img = button.querySelector('img');
                lightboxImg.src = img.currentSrc || img.src;
                lightboxImg.alt = img.alt;
                lightbox.showModal();
            });
        });
        // Clicking the backdrop or the close button closes it; Escape works natively
        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) lightbox.close();
        });
    }

    // In-page links glide to their section. This is done here, not with CSS alone, because some
    // browsers (Brave among them) turn off CSS smooth scrolling along with their own setting.
    // Reduced motion keeps the browser's instant jump.
    let scrollRun = 0;
    ['wheel', 'touchstart', 'keydown'].forEach(type => {
        // Any manual scroll input takes over from a running glide
        window.addEventListener(type, () => { scrollRun++; }, { passive: true });
    });
    const glideTo = (targetY, done) => {
        const root = document.documentElement;
        const startY = window.scrollY;
        const destY = Math.max(0, Math.min(targetY, root.scrollHeight - window.innerHeight));
        const distance = destY - startY;
        if (Math.abs(distance) < 2) { done(); return; }
        const duration = Math.min(900, 350 + Math.abs(distance) * 0.12);
        const run = ++scrollRun;
        const t0 = performance.now();
        root.style.scrollBehavior = 'auto';
        const step = now => {
            if (run !== scrollRun) { root.style.scrollBehavior = ''; return; }
            const t = Math.min((now - t0) / duration, 1);
            window.scrollTo(0, startY + distance * (1 - Math.pow(1 - t, 3)));
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                root.style.scrollBehavior = '';
                done();
            }
        };
        requestAnimationFrame(step);
    };
    if (!reduceMotion) {
        document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach(link => {
            link.addEventListener('click', (e) => {
                if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                const hash = link.getAttribute('href');
                const target = hash === '#' ? null : document.getElementById(decodeURIComponent(hash.slice(1)));
                if (hash !== '#' && !target) return;
                e.preventDefault();
                const y = target ? target.getBoundingClientRect().top + window.scrollY : 0;
                glideTo(y, () => {
                    history.pushState(null, '', hash === '#' ? location.pathname + location.search : hash);
                    if (target) {
                        target.setAttribute('tabindex', '-1');
                        target.focus({ preventScroll: true });
                    }
                });
            });
        });
    }

    // Anchor links scroll smoothly through CSS (scroll-behavior), which also
    // keeps the URL hash and keyboard focus working and respects reduced motion.
});
