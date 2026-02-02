(function () {
    function onRoute() {
        if (location.hash && location.hash.startsWith('#/robloxfontgenerator')) {
            const content = document.getElementById('content') || document;
            const page = content.querySelector('.page');
            if (page && typeof window.initializeRobloxFontGenerator === 'function') {
                if (!page._robloxFontGeneratorAttached) {
                    window.initializeRobloxFontGenerator(page);
                    page._robloxFontGeneratorAttached = true;
                }
            }
        }
    }

    window.addEventListener('hashchange', () => setTimeout(onRoute, 0));
    window.addEventListener('DOMContentLoaded', onRoute);

    const content = document.getElementById('content');
    if (content && typeof MutationObserver !== 'undefined') {
        const mo = new MutationObserver(() => onRoute());
        mo.observe(content, { childList: true });
    }
})();

