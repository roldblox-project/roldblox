// --- Site Intro Logic ---

/* 
PREVIOUS INTRO LOGIC (Auto-hide on load)
(function() {
    const intro = document.getElementById('site-intro');
    const loader = intro ? intro.querySelector('.intro-loader') : null;
    if (!intro) return;

    const startTime = Date.now();
    const minDuration = 3000;
    let isHiding = false;

    const loaderTimeout = setTimeout(() => {
        if (!isHiding && loader) {
            loader.classList.add('show');
        }
    }, 5000);

    function hideIntro() {
        if (isHiding) return;
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = Math.max(0, minDuration - elapsed);

        setTimeout(() => {
            isHiding = true;
            clearTimeout(loaderTimeout);
            intro.classList.add('fade-out');
            document.body.classList.remove('is-loading');
            setTimeout(() => { intro.remove(); }, 800);
        }, remaining);
    }
    window.addEventListener('load', hideIntro);
    setTimeout(hideIntro, 10000);
})();
*/

(function() {
    const intro = document.getElementById('site-intro');
    const mainContent = document.getElementById('intro-main-content');
    const warningContent = document.getElementById('intro-warning-content');
    const understandBtn = document.getElementById('intro-understand-btn');
    
    if (!intro) return;

    const logoDuration = 3500; // Time to show logo/subtitle
    let isHiding = false;

    // Transition from Logo to Warning
    const warningTimeout = setTimeout(() => {
        if (mainContent && warningContent) {
            mainContent.classList.add('fade-out');
            setTimeout(() => {
                warningContent.classList.add('show');
            }, 500);
        }
    }, logoDuration);

    function hideIntro() {
        if (isHiding) return;
        isHiding = true;
        
        clearTimeout(warningTimeout);
        
        // Add the zoom + blur exit class
        intro.classList.add('exit-zoom');
        
        // Start fading the whole intro
        setTimeout(() => {
            intro.classList.add('fade-out');
            document.body.classList.remove('is-loading');
        }, 300); // Small delay to let zoom start

        // Remove from DOM after transitions
        setTimeout(() => {
            intro.remove();
        }, 1200);
    }

    // Only hide intro when "I Understand" is clicked
    if (understandBtn) {
        understandBtn.addEventListener('click', hideIntro);
    }
})();
