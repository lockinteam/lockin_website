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
    const modalBackdrop = document.getElementById('modal-backdrop');
    const downloadModal = document.getElementById('download-modal');
    const modalClose = document.querySelector('.modal__close');
    const downloadButtons = document.querySelectorAll('[data-modal="download"]');

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
    // DOWNLOAD MODAL
    // =========================================================================
    
    function openModal() {
        modalBackdrop.classList.add('modal-backdrop--open');
        downloadModal.classList.add('modal--open');
        modalBackdrop.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        
        // Focus the modal for accessibility
        downloadModal.focus();
        
        // Trap focus within modal
        trapFocus(downloadModal);
    }

    function closeModal() {
        modalBackdrop.classList.remove('modal-backdrop--open');
        downloadModal.classList.remove('modal--open');
        modalBackdrop.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    // Open modal on button click
    downloadButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    // Close modal on backdrop click
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }

    // Close modal on close button click
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && downloadModal.classList.contains('modal--open')) {
            closeModal();
        }
    });

    // =========================================================================
    // FOCUS TRAP (Accessibility)
    // =========================================================================
    
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        function handleTabKey(e) {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        }

        element.addEventListener('keydown', handleTabKey);
    }

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
        const elements = document.querySelectorAll('.feature-card, .step, .pricing-card, .hierarchy__level');
        
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
    // DETECT USER PLATFORM FOR DOWNLOAD MODAL
    // =========================================================================
    
    function detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();

        if (/iphone|ipad|ipod/.test(userAgent)) {
            return 'ios';
        } else if (/android/.test(userAgent)) {
            return 'android';
        } else if (/win/.test(platform)) {
            return 'windows';
        } else if (/mac/.test(platform)) {
            return 'macos';
        } else if (/linux/.test(platform)) {
            return 'linux';
        }
        return null;
    }

    function highlightRecommendedDownload() {
        const platform = detectPlatform();
        if (!platform) return;

        const downloadOption = document.getElementById(`download-${platform}`);
        if (downloadOption) {
            // Move recommended option to top
            const parent = downloadOption.parentNode;
            parent.insertBefore(downloadOption, parent.firstChild);
            
            // Add recommended badge
            const badge = document.createElement('span');
            badge.className = 'badge badge--accent';
            badge.style.marginLeft = 'auto';
            badge.style.marginRight = 'var(--space-2)';
            badge.textContent = 'Recommended';
            downloadOption.querySelector('.download-option__info').appendChild(badge);
        }
    }

    // Highlight recommended download when modal opens
    downloadButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Only highlight once
            if (!downloadModal.dataset.highlighted) {
                highlightRecommendedDownload();
                downloadModal.dataset.highlighted = 'true';
            }
        }, { once: true });
    });

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
