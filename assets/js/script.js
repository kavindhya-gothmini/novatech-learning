
/* =========================================================
   NOVATECH LEARNING
   Learn. Build. Grow.
   Premium Technology Tutor Portfolio - Main JavaScript
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =====================================================
       1. GLOBAL SETTINGS
       ===================================================== */

    const navbar = document.querySelector(".navbar");

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const isDesktop = window.matchMedia(
        "(min-width: 992px)"
    ).matches;

    /*
     * Use instant scrolling when reduced motion is preferred.
     */
    const scrollBehavior = prefersReducedMotion
        ? "auto"
        : "smooth";


    /* =====================================================
       2. PAGE LOADER
       ===================================================== */

    const loader = document.querySelector(".page-loader");

    if (loader) {
        const hideLoader = () => {
            if (!loader.isConnected) return;

            loader.classList.add("loaded");

            window.setTimeout(() => {
                if (loader.isConnected) {
                    loader.remove();
                }
            }, prefersReducedMotion ? 0 : 600);
        };

        if (document.readyState === "complete") {
            window.setTimeout(hideLoader, 100);
        } else {
            window.addEventListener("load", hideLoader, {
                once: true
            });
        }
    }


    /* =====================================================
       3. NAVBAR SCROLL EFFECT
       ===================================================== */

    const handleNavbarScroll = () => {
        if (!navbar) return;

        navbar.classList.toggle(
            "scrolled",
            window.scrollY > 40
        );
    };

    handleNavbarScroll();

    window.addEventListener("scroll", handleNavbarScroll, {
        passive: true
    });


    /* =====================================================
       4. MOBILE NAVIGATION HELPERS
       ===================================================== */

    const mobileMenu = document.querySelector(
        ".navbar-collapse"
    );

    const navbarToggler = document.querySelector(
        ".navbar-toggler"
    );

    const closeMobileMenu = () => {
        if (
            mobileMenu &&
            mobileMenu.classList.contains("show") &&
            navbarToggler
        ) {
            /*
             * Bootstrap handles the collapse transition.
             */
            navbarToggler.click();
        }
    };


    /* =====================================================
       5. SMOOTH SCROLLING
       ===================================================== */

    const internalLinks = document.querySelectorAll(
        'a[href^="#"]:not([href="#"])'
    );

    internalLinks.forEach(link => {
        link.addEventListener("click", event => {
            const targetId = link.getAttribute("href");

            if (!targetId) return;

            let target;

            try {
                target = document.querySelector(targetId);
            } catch {
                return;
            }

            /*
             * Allow normal browser behavior if the target
             * does not exist on this page.
             */
            if (!target) {
                closeMobileMenu();
                return;
            }

            event.preventDefault();

            const navbarHeight = navbar
                ? navbar.offsetHeight
                : 0;

            const targetPosition =
                target.getBoundingClientRect().top +
                window.scrollY -
                navbarHeight -
                12;

            window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: scrollBehavior
            });

            /*
             * Update the URL fragment without an abrupt jump.
             */
            if (history.replaceState) {
                history.replaceState(null, "", targetId);
            }

            closeMobileMenu();
        });
    });


    /* =====================================================
       6. ACTIVE NAVIGATION LINK
       ===================================================== */

    const sections = Array.from(
        document.querySelectorAll("section[id]")
    );

    const navLinks = document.querySelectorAll(
        ".navbar-nav .nav-link"
    );

    const updateActiveNavigation = () => {
        if (!sections.length || !navLinks.length) return;

        const scrollPosition =
            window.scrollY +
            (navbar ? navbar.offsetHeight : 0) +
            120;

        let currentSection = "";

        sections.forEach(section => {
            if (section.offsetTop <= scrollPosition) {
                currentSection = section.id;
            }
        });

        /*
         * At the bottom of the page, activate the last section.
         */
        const nearPageBottom =
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 5;

        if (nearPageBottom && sections.length) {
            currentSection = sections[sections.length - 1].id;
        }

        navLinks.forEach(link => {
            const href = link.getAttribute("href");

            link.classList.remove("active");

            if (href === `#${currentSection}`) {
                link.classList.add("active");
            }
        });
    };

    updateActiveNavigation();

    window.addEventListener(
        "scroll",
        updateActiveNavigation,
        { passive: true }
    );


    /* =====================================================
       7. CLOSE MOBILE MENU ON NAVIGATION
       ===================================================== */

    /*
     * This is the only navigation-click handler responsible
     * for closing the mobile menu.
     */
    document.querySelectorAll(
        ".navbar-collapse .nav-link"
    ).forEach(link => {
        link.addEventListener("click", closeMobileMenu);
    });

    /*
     * Allow the Escape key to close the expanded menu.
     */
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeMobileMenu();
        }
    });


    /* =====================================================
       8. SCROLL REVEAL ANIMATIONS
       ===================================================== */

    const revealSelector = [
        ".section-header",
        ".subject-card",
        ".technology-item",
        ".journey-item",
        ".project-main-card",
        ".mini-project-card",
        ".benefit-card",
        ".about-content",
        ".about-visual",
        ".level-card",
        ".cta-content"
    ].join(", ");

    const revealElements = document.querySelectorAll(
        revealSelector
    );

    if (prefersReducedMotion) {
        /*
         * Never hide content from users who prefer reduced
         * motion or depend on animations to reveal content.
         */
        revealElements.forEach(element => {
            element.classList.add("is-visible");
        });
    } else if ("IntersectionObserver" in window) {
        revealElements.forEach(element => {
            element.classList.add("scroll-reveal");
        });

        const revealObserver = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    } else {
        /*
         * Fallback for browsers without IntersectionObserver.
         */
        revealElements.forEach(element => {
            element.classList.add("is-visible");
        });
    }


    /* =====================================================
       9. STAGGERED CARD ANIMATIONS
       ===================================================== */

    const animatedGroups = [
        ".subject-card",
        ".technology-item",
        ".journey-item",
        ".benefit-card",
        ".level-card",
        ".mini-project-card"
    ];

    animatedGroups.forEach(selector => {
        document.querySelectorAll(selector).forEach(
            (element, index) => {
                element.style.setProperty(
                    "--animation-delay",
                    `${index * 80}ms`
                );
            }
        );
    });


    /* =====================================================
       10. HERO DASHBOARD MOUSE MOVEMENT
       ===================================================== */

    const heroVisual = document.querySelector(".hero-visual");

    const dashboard = document.querySelector(
        ".learning-dashboard"
    );

    if (
        heroVisual &&
        dashboard &&
        isDesktop &&
        !prefersReducedMotion
    ) {
        heroVisual.addEventListener("mousemove", event => {
            const rect = heroVisual.getBoundingClientRect();

            if (!rect.width || !rect.height) return;

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateY =
                ((x - centerX) / centerX) * 3;

            const rotateX =
                ((centerY - y) / centerY) * 3;

            dashboard.style.transform =
                `perspective(1200px) ` +
                `rotateX(${rotateX}deg) ` +
                `rotateY(${rotateY}deg)`;
        });

        heroVisual.addEventListener("mouseleave", () => {
            dashboard.style.transform =
                "perspective(1200px) rotateX(0deg) rotateY(0deg)";
        });
    }


    /* =====================================================
       11. TECHNOLOGY ITEMS INTERACTION
       ===================================================== */

    document.querySelectorAll(".technology-item").forEach(item => {
        item.addEventListener("mouseenter", () => {
            item.classList.add("tech-active");
        });

        item.addEventListener("mouseleave", () => {
            item.classList.remove("tech-active");
        });
    });


    /* =====================================================
       12. SUBJECT CARD INTERACTION
       ===================================================== */

    document.querySelectorAll(".subject-card").forEach(card => {
        card.addEventListener("mouseenter", () => {
            card.classList.add("subject-hover");
        });

        card.addEventListener("mouseleave", () => {
            card.classList.remove("subject-hover");
        });
    });


    /* =====================================================
       13. LEARNING PROGRESS ANIMATION
       ===================================================== */

    const progressBars = document.querySelectorAll(
        ".skill-progress"
    );

    const animateProgressBar = bar => {
        const rawProgress = bar.getAttribute("data-progress");

        if (rawProgress === null || rawProgress.trim() === "") {
            return;
        }

        const progress = Number(rawProgress);

        if (!Number.isFinite(progress)) return;

        const safeProgress = Math.min(
            100,
            Math.max(0, progress)
        );

        bar.style.setProperty(
            "--progress-width",
            `${safeProgress}%`
        );

        /*
         * Also supports progress bars styled with width.
         * Remove this line if your CSS exclusively uses
         * the --progress-width custom property.
         */
        bar.style.width = `${safeProgress}%`;
    };

    if (prefersReducedMotion) {
        progressBars.forEach(animateProgressBar);
    } else if ("IntersectionObserver" in window) {
        const progressObserver = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateProgressBar(entry.target);
                        progressObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.3
            }
        );

        progressBars.forEach(bar => {
            progressObserver.observe(bar);
        });
    } else {
        progressBars.forEach(animateProgressBar);
    }


    /* =====================================================
       14. BACK TO TOP BUTTON
       ===================================================== */

    const backToTop = document.querySelector(".back-to-top");

    const toggleBackToTop = () => {
        if (!backToTop) return;

        backToTop.classList.toggle(
            "visible",
            window.scrollY > 500
        );
    };

    toggleBackToTop();

    window.addEventListener(
        "scroll",
        toggleBackToTop,
        { passive: true }
    );

    if (backToTop) {
        backToTop.addEventListener("click", event => {
            event.preventDefault();

            window.scrollTo({
                top: 0,
                behavior: scrollBehavior
            });
        });
    }


    /* =====================================================
       15. DASHBOARD SKILL CARD MICRO-INTERACTIONS
       ===================================================== */

    document.querySelectorAll(".skill-card").forEach(card => {
        const icon = card.querySelector(".skill-icon");

        if (!icon) return;

        card.addEventListener("mouseenter", () => {
            icon.classList.add("icon-active");
        });

        card.addEventListener("mouseleave", () => {
            icon.classList.remove("icon-active");
        });

        /*
         * Keyboard users receive the same visual feedback.
         */
        card.addEventListener("focusin", () => {
            icon.classList.add("icon-active");
        });

        card.addEventListener("focusout", () => {
            icon.classList.remove("icon-active");
        });
    });


    /* =====================================================
       16. AUTOMATIC COPYRIGHT YEAR
       ===================================================== */

    document.querySelectorAll("[data-current-year]").forEach(
        element => {
            element.textContent = new Date().getFullYear();
        }
    );


    /* =====================================================
       17. BUTTON RIPPLE EFFECT
       ===================================================== */

    if (!prefersReducedMotion) {
        document.querySelectorAll(
            ".btn, .nav-cta, .btn-white-custom"
        ).forEach(button => {
            button.addEventListener("click", event => {
                /*
                 * Avoid ripples for keyboard-generated clicks,
                 * where pointer coordinates are unavailable.
                 */
                if (
                    event.detail === 0 ||
                    typeof event.clientX !== "number"
                ) {
                    return;
                }

                const rect = button.getBoundingClientRect();

                const size = Math.max(
                    rect.width,
                    rect.height
                );

                const ripple = document.createElement("span");

                ripple.className = "button-ripple";

                ripple.style.width = `${size}px`;
                ripple.style.height = `${size}px`;

                ripple.style.left =
                    `${event.clientX - rect.left - size / 2}px`;

                ripple.style.top =
                    `${event.clientY - rect.top - size / 2}px`;

                button.appendChild(ripple);

                window.setTimeout(() => {
                    ripple.remove();
                }, 650);
            });
        });
    }


    /* =====================================================
       18. REDUCED MOTION ACCESSIBILITY
       ===================================================== */

    if (prefersReducedMotion) {
        document.documentElement.classList.add(
            "reduced-motion"
        );
    }


    /* =====================================================
       19. CONSOLE BRAND MESSAGE
       ===================================================== */

    console.log(
        "%c NovaTech Learning ",
        "font-size:16px;font-weight:bold;" +
        "color:#0d9488;background:#10243a;" +
        "padding:6px 10px;border-radius:4px;"
    );

    console.log(
        "Learn. Build. Grow. — " +
        "Technology Tutor Portfolio initialized."
    );

});