document.addEventListener('DOMContentLoaded', () => {
    // Custom Cursor
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    // Only active on desktop usually, but we'll add checks
    if (cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            // Dot follows instantly
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Outline follows with slight delay
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Hover effects for cursor
        const interactiveElements = document.querySelectorAll('a, button, .work-card, .skill-tags span');

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.classList.add('hovered');
                cursorDot.style.opacity = '0';
            });

            el.addEventListener('mouseleave', () => {
                cursorOutline.classList.remove('hovered');
                cursorDot.style.opacity = '1';
            });
        });
    }

    // Scroll Reveal Animation (Unified Logic)
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Select all elements to animate
    // Added .about-text and .about-skills to target the new layout
    const elementsToReveal = document.querySelectorAll('.section-title, .work-card, .about-text, .about-skills');

    elementsToReveal.forEach((el, index) => {
        // Set initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';

        // Optional: Stagger effect for grid items
        if (el.classList.contains('work-card')) {
            el.style.transitionDelay = `${(index % 3) * 100}ms`;
        }

        // Observe
        revealObserver.observe(el);
    });
});
