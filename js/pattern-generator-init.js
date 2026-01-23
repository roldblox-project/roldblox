// pages/pattern-generator-init.js
(function () {
    // This function will be defined in pages/pattern-generator.js
    // We just need a forward declaration here for clarity.
    let initializePatternGenerator;

    function onRoute() {
        if (location.hash && location.hash.startsWith('#/patterngenerator')) {
            const content = document.getElementById('content') || document;
            // The page content is inside a div with class 'page'
            const page = content.querySelector('.page');
            if (page && typeof window.initializePatternGenerator === 'function') {
                // Ensure the init function hasn't already run on this element
                if (!page._patternGeneratorAttached) {
                    window.initializePatternGenerator(page);
                    page._patternGeneratorAttached = true;
                }
            }
        }
    }

    // Listen for hash changes and DOM mutations to robustly detect page loads.
    window.addEventListener('hashchange', () => setTimeout(onRoute, 0));
    window.addEventListener('DOMContentLoaded', onRoute);

    const content = document.getElementById('content');
    if (content && typeof MutationObserver !== 'undefined') {
        const mo = new MutationObserver(() => onRoute());
        mo.observe(content, { childList: true });
    }
})();
