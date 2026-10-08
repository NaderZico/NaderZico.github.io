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

    // Intersection Observer for fade-in animations
    const fadeElements = document.querySelectorAll('.fade-in');

    // Cards inside a section rise in one after another once it appears
    // (skipped for reduced motion; the cards are never hidden without this script)
    const STAGGER = '.skill-card, .timeline-item, .cert-card, .sys-card, .project-card, .highlight-item, .edu-featured-card';
    const staggered = new Map();
    if (!reduceMotion && 'IntersectionObserver' in window) {
        fadeElements.forEach(section => {
            const items = [...section.querySelectorAll(STAGGER)];
            items.forEach((el, i) => {
                el.classList.add('reveal-item');
                el.style.setProperty('--i', Math.min(i, 8));
            });
            if (items.length) staggered.set(section, items);
        });
    }

    if ('IntersectionObserver' in window) {
        // Reveal as soon as any part is on screen, so tall sections never stay hidden
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                    const items = staggered.get(entry.target);
                    if (items) {
                        // Hand the cards back to their normal hover styles once they have landed
                        setTimeout(() => items.forEach(el => el.classList.remove('reveal-item')), 1200);
                    }
                }
            });
        }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0 });

        fadeElements.forEach(el => {
            observer.observe(el);
        });
    } else {
        fadeElements.forEach(el => el.classList.add('visible'));
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

    // Anchor links scroll smoothly through CSS (scroll-behavior), which also
    // keeps the URL hash and keyboard focus working and respects reduced motion.
});
