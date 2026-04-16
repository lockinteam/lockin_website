/* ==========================================================================
   MAIN JAVASCRIPT - Lockin.tech
   Navigation, modals, animations, and interactivity
   ========================================================================== */

(function() {
    'use strict';

    // =========================================================================
    // DOM ELEMENTS
    // =========================================================================
    
    const header = document.getElementById('header');
    const navToggle = document.querySelector('.nav__toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu__link');

    // =========================================================================
    // HEADER SCROLL EFFECT
    // =========================================================================
    
    let headerHeight = 80; // Default header height - avoid reading offsetHeight during scroll
    
    function handleHeaderScroll() {
        if (window.scrollY > 50) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }
    }

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    
    // Run on load in case page is already scrolled
    handleHeaderScroll();
    
    // Cache header height once on load (after layout is complete)
    requestAnimationFrame(() => {
        headerHeight = header.offsetHeight;
    });

    // =========================================================================
    // MOBILE MENU
    // =========================================================================
    
    function openMobileMenu() {
        navToggle.classList.add('nav__toggle--active');
        navToggle.setAttribute('aria-expanded', 'true');
        mobileMenu.classList.add('mobile-menu--open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        document.body.classList.add('menu-open');
    }

    function closeMobileMenu() {
        navToggle.classList.remove('nav__toggle--active');
        navToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('mobile-menu--open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('menu-open');
    }

    function toggleMobileMenu() {
        const isOpen = mobileMenu.classList.contains('mobile-menu--open');
        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu when clicking a link
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Close mobile menu on resize if open
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            closeMobileMenu();
        }
    });

    // =========================================================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // =========================================================================
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // Skip if it's just "#"
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                // Close mobile menu if open
                closeMobileMenu();
                
                // Calculate offset for fixed header (use cached height)
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // =========================================================================
    // INTERSECTION OBSERVER FOR ANIMATIONS
    // =========================================================================
    
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.feature-card, .step, .pricing-card, .hierarchy__level, .launch-card, .prize-slot');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
            observer.observe(el);
        });
    };

    // Only animate on larger screens for better performance
    if (window.innerWidth >= 768) {
        animateOnScroll();
    }

    // =========================================================================
    // ACTIVE NAV LINK ON SCROLL
    // =========================================================================
    
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link');

    function highlightNavOnScroll() {
        const scrollPos = window.scrollY + headerHeight + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('nav__link--active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('nav__link--active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightNavOnScroll, { passive: true });

    // =========================================================================
    // UPDATE COPYRIGHT YEAR
    // =========================================================================
    
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // =========================================================================
    // WEB LAUNCH EVENT COUNTDOWN
    // =========================================================================

    function initializeLaunchCountdown() {
        const countdownRoot = document.getElementById('launch-countdown');
        const deadlineNote = document.getElementById('launch-deadline-note');
        if (!countdownRoot) return;

        const daysEl = document.getElementById('countdown-days');
        const hoursEl = document.getElementById('countdown-hours');
        const minutesEl = document.getElementById('countdown-minutes');
        const secondsEl = document.getElementById('countdown-seconds');

        if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

        const endDateRaw = countdownRoot.getAttribute('data-end-date');
        const endDate = new Date(endDateRaw || '2026-04-21T23:59:59+02:00');
        if (Number.isNaN(endDate.getTime())) return;

        function padNumber(value) {
            return String(value).padStart(2, '0');
        }

        function renderTime() {
            const now = new Date();
            const distance = endDate.getTime() - now.getTime();

            if (distance <= 0) {
                daysEl.textContent = '00';
                hoursEl.textContent = '00';
                minutesEl.textContent = '00';
                secondsEl.textContent = '00';
                if (deadlineNote) {
                    deadlineNote.textContent = 'This event has ended. Highest-tier web access is no longer available.';
                }
                return false;
            }

            const secondsTotal = Math.floor(distance / 1000);
            const days = Math.floor(secondsTotal / 86400);
            const hours = Math.floor((secondsTotal % 86400) / 3600);
            const minutes = Math.floor((secondsTotal % 3600) / 60);
            const seconds = secondsTotal % 60;

            daysEl.textContent = padNumber(days);
            hoursEl.textContent = padNumber(hours);
            minutesEl.textContent = padNumber(minutes);
            secondsEl.textContent = padNumber(seconds);
            return true;
        }

        const shouldContinue = renderTime();
        if (!shouldContinue) return;

        const timer = setInterval(() => {
            const keepRunning = renderTime();
            if (!keepRunning) {
                clearInterval(timer);
            }
        }, 1000);
    }

    initializeLaunchCountdown();

    // =========================================================================
    // PREFERS REDUCED MOTION
    // =========================================================================
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        // Disable animations for users who prefer reduced motion
        document.documentElement.style.setProperty('--duration-75', '0ms');
        document.documentElement.style.setProperty('--duration-100', '0ms');
        document.documentElement.style.setProperty('--duration-150', '0ms');
        document.documentElement.style.setProperty('--duration-200', '0ms');
        document.documentElement.style.setProperty('--duration-300', '0ms');
        document.documentElement.style.setProperty('--duration-500', '0ms');
        document.documentElement.style.setProperty('--duration-700', '0ms');
    }

})();

    // =========================================================================
    // DYNAMIC APP LINKS (OS DETECTION) & DOWNLOAD MODAL
    // =========================================================================

    const downloadModal = document.getElementById('download-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalCloseBtn = document.querySelector('.modal__close');
    const downloadButtons = document.querySelectorAll('[data-modal="download"]');

    function openModal() {
        if (!downloadModal || !modalBackdrop) return;
        modalBackdrop.classList.add('modal-backdrop--open');
        downloadModal.classList.add('modal--open');
        modalBackdrop.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        
        const focusableElements = downloadModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length) focusableElements[0].focus();
    }

    function closeModal() {
        if (!downloadModal || !modalBackdrop) return;
        modalBackdrop.classList.remove('modal-backdrop--open');
        downloadModal.classList.remove('modal--open');
        modalBackdrop.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    downloadButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && downloadModal && downloadModal.classList.contains('modal--open')) {
            closeModal();
        }
    });

    function setDynamicAppLinks() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        const isAndroid = /android/i.test(userAgent);
        
        const mainLaunchBtns = document.querySelectorAll('.main-launch-btn');
        
        if (isIOS || isAndroid) {
            const targetUrl = isIOS 
                ? 'https://apps.apple.com/us/app/lockin-revise-gcse-a-level/id6761141519'
                : 'https://play.google.com/store/apps/details?id=tech.lockin.app&pcampaignid=web_share';
            
            const buttonText = isIOS ? 'Download on App Store' : 'Get it on Google Play';
            
            mainLaunchBtns.forEach(btn => {
                btn.href = targetUrl;
                // Preserve structure while replacing text
                if (btn.textContent.includes('Launch') || btn.textContent.includes('App') || btn.textContent.includes('Web')) {
                    btn.textContent = buttonText;
                }
            });
        }
    }

    setDynamicAppLinks();

