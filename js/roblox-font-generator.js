(function () {
    function initializeRobloxFontGenerator(rootElement) {
        if (!rootElement) return;

        const textInput = rootElement.querySelector('#fontTextInput');
        const previewInner = rootElement.querySelector('#fontPreviewInner');
        const previewBox = rootElement.querySelector('#fontPreview');
        const downloadPngBtn = rootElement.querySelector('#downloadPngBtn');
        const thickOutlineCheckbox = rootElement.querySelector('#fgThickOutline');
        const thickOutlineContainer = rootElement.querySelector('#thickOutlineContainer');
        const fontStyleSelect = rootElement.querySelector('#fgFontStyle');
        const styleInfo = rootElement.querySelector('#styleInfo');
        const fgCaption = rootElement.querySelector('#fgCaption');
        
        // --- Custom Number Input Logic ---
        function setupNumberInput(inputId) {
            const input = rootElement.querySelector(`#${inputId}`);
            if (!input) return null;

            const wrapper = input.closest('.number-input');
            const downBtn = wrapper.querySelector('.down');
            const upBtn = wrapper.querySelector('.up');
            const min = parseFloat(wrapper.dataset.min) || 0;
            const max = parseFloat(wrapper.dataset.max) || 100;
            const step = parseFloat(wrapper.dataset.step) || 1;

            const updateValue = (newValue) => {
                const numericValue = parseFloat(newValue);
                if (isNaN(numericValue)) return;
                const clampedValue = Math.max(min, Math.min(max, numericValue));
                // Round to 1 decimal place to avoid float precision issues (e.g., 1.5000000001)
                input.value = Math.round(clampedValue * 10) / 10;
            };

            downBtn.addEventListener('click', () => updateValue(parseFloat(input.value) - step));
            upBtn.addEventListener('click', () => updateValue(parseFloat(input.value) + step));
            input.addEventListener('change', () => updateValue(parseFloat(input.value)));

            return input;
        }

        const scaleSelect = setupNumberInput('fgScaleSelect');
        // --- End Custom Number Input Logic ---

        if (!textInput || !previewInner || !previewBox) return;

        const baseFontSize = 96;

        let currentState = {
            text: '',
            fontSize: baseFontSize,
            scale: 1,
            wrapperEl: null
        };

        function render() {
            const text = textInput.value || '';
            previewInner.innerHTML = '';

            if (!text) return;

            const lines = text.split('\n');

            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.transformOrigin = 'center center';
            wrapper.style.whiteSpace = 'pre';
            wrapper.style.textAlign = 'center';
            wrapper.style.padding = '120px 60px'; // Extra top/bottom padding for export
            wrapper.style.margin = '-120px -60px';  // Compensate padding for layout
            wrapper.style.overflow = 'visible';

            const thickOutline = thickOutlineCheckbox && thickOutlineCheckbox.checked;
            const fontStyle = fontStyleSelect ? fontStyleSelect.value : 'boblox';

            function isLetterChar(c) {
                return /[A-Za-z0-9]/.test(c);
            }

            function isSpaceChar(c) {
                return /\s/.test(c);
            }

            let wordCounter = 0;

            function flushBlock(block) {
                if (!block.length) return;

                const baseZ = (wordCounter + 1) * 1000;

                let lastLetterIndex = -1;
                for (let i = 0; i < block.length; i++) {
                    if (!block[i].isPunctuation) {
                        lastLetterIndex = i;
                    }
                }

                if (lastLetterIndex === -1) {
                    for (let i = 0; i < block.length; i++) {
                        const entry = block[i];
                        const z = baseZ + i + 1;
                        entry.wrapper.style.zIndex = String(z);
                        wrapper.appendChild(entry.wrapper);
                    }
                } else {
                    for (let i = 0; i < lastLetterIndex; i++) {
                        const entry = block[i];
                        const z = baseZ + (lastLetterIndex - i);
                        entry.wrapper.style.zIndex = String(z);
                    }

                    const lastEntry = block[lastLetterIndex];
                    lastEntry.wrapper.style.zIndex = String(baseZ + lastLetterIndex + 2);

                    let pz = baseZ + lastLetterIndex + 3;
                    for (let i = lastLetterIndex + 1; i < block.length; i++) {
                        const entry = block[i];
                        entry.wrapper.style.zIndex = String(pz++);
                    }

                    for (let i = 0; i < block.length; i++) {
                        wrapper.appendChild(block[i].wrapper);
                    }
                }

                wordCounter++;
                block.length = 0;
            }

            for (let li = 0; li < lines.length; li++) {
                const line = lines[li];
                if (li > 0) wrapper.appendChild(document.createElement('br'));

                const block = [];

                for (let ci = 0; ci < line.length; ci++) {
                    const ch = line[ci];

                    if (isSpaceChar(ch)) {
                        flushBlock(block);
                        if (ch === ' ') {
                            const spaceSpan = document.createElement('span');
                            spaceSpan.style.display = 'inline-block';
                            spaceSpan.style.width = baseFontSize * 0.6 + 'px';
                            wrapper.appendChild(spaceSpan);
                        }
                        continue;
                    }

                    const isPunctuation = !isLetterChar(ch);

                    const letterWrapper = document.createElement('span');
                    letterWrapper.style.position = 'relative';
                    letterWrapper.style.display = 'inline-block';

                    if (fontStyle === 'blorx') {
                        // Original margins for Blorx
                        const outlineContainer = document.createElement('span');
                        outlineContainer.style.position = 'absolute';
                        outlineContainer.style.left = '0';
                        outlineContainer.style.top = '0';
                        outlineContainer.style.whiteSpace = 'pre';

                        const offsets = thickOutline
                            ? [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]
                            : [[0, 0]];

                        for (let oi = 0; oi < offsets.length; oi++) {
                            const [dx, dy] = offsets[oi];
                            const o = document.createElement('span');
                            o.textContent = ch;
                            o.style.fontFamily = '"Blorx Outlines", "Source Sans Pro", sans-serif';
                            o.style.fontSize = baseFontSize + 'px';
                            o.style.position = 'absolute';
                            o.style.left = dx + 'px';
                            o.style.top = dy + 'px';
                            o.style.whiteSpace = 'pre';
                            o.style.color = '#ff0000';
                            outlineContainer.appendChild(o);
                        }

                        const fillSpan = document.createElement('span');
                        fillSpan.textContent = ch;
                        fillSpan.style.fontFamily = '"Blorx Fill", "Source Sans Pro", sans-serif';
                        fillSpan.style.fontSize = baseFontSize + 'px';
                        fillSpan.style.color = '#ffffff';
                        fillSpan.style.position = 'relative';
                        fillSpan.style.display = 'inline-block';
                        fillSpan.style.whiteSpace = 'pre';

                        letterWrapper.appendChild(outlineContainer);
                        letterWrapper.appendChild(fillSpan);
                    } else {
                        // Boblox Classic Style
                        // Use span-based rendering (like Blorx) for maximum export compatibility
                        const outlineSpan = document.createElement('span');
                        outlineSpan.textContent = ch;
                        outlineSpan.style.fontFamily = '"Boblox Classic", "Source Sans Pro", sans-serif';
                        outlineSpan.style.fontSize = baseFontSize + 'px';
                        outlineSpan.style.position = 'absolute';
                        outlineSpan.style.left = '0';
                        outlineSpan.style.top = '0';
                        outlineSpan.style.whiteSpace = 'pre';
                        outlineSpan.style.color = '#E2231A';
                        outlineSpan.style.webkitTextStroke = '12px #E2231A';
                        outlineSpan.style.paintOrder = 'stroke fill';
                        
                        const fillSpan = document.createElement('span');
                        fillSpan.textContent = ch;
                        fillSpan.style.fontFamily = '"Boblox Classic", "Source Sans Pro", sans-serif';
                        fillSpan.style.fontSize = baseFontSize + 'px';
                        fillSpan.style.color = '#ffffff';
                        fillSpan.style.position = 'relative';
                        fillSpan.style.display = 'inline-block';
                        fillSpan.style.whiteSpace = 'pre';
                        fillSpan.style.zIndex = '1';

                        letterWrapper.appendChild(outlineSpan);
                        letterWrapper.appendChild(fillSpan);
                        
                        // Adjust margins for Boblox overlap
                        letterWrapper.style.marginRight = '-4px'; 
                    }

                    block.push({ wrapper: letterWrapper, isPunctuation });
                }

                flushBlock(block);
            }

            previewInner.appendChild(wrapper);

            // Update UI based on style
            if (fontStyle === 'blorx') {
                if (thickOutlineContainer) thickOutlineContainer.style.display = 'flex';
                if (styleInfo) styleInfo.textContent = "A Font that recreates the 2006 ROBLOX Logo Font Accurately.";
                if (fgCaption) fgCaption.textContent = "Blorx (2006)";
            } else {
                if (thickOutlineContainer) thickOutlineContainer.style.display = 'none';
                if (styleInfo) styleInfo.textContent = "Boblox Classic, mimics 2016 Roblox Font.";
                if (fgCaption) fgCaption.textContent = "Boblox Classic";
            }

            const previewRect = previewBox.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();

            const padding = 32;
            const maxWidth = Math.max(10, previewRect.width - padding);
            const maxHeight = Math.max(10, previewRect.height - padding);

            const widthScale = maxWidth / wrapperRect.width;
            const heightScale = maxHeight / wrapperRect.height;
            
            // Autoscale: Always try to fit the container perfectly
            // We cap it at 1.5x so single letters don't get TOO huge, 
            // but it will always shrink to fit long text.
            let scale = Math.min(widthScale, heightScale);
            scale = Math.min(1.5, Math.max(0.1, scale));

            wrapper.style.transform = 'scale(' + scale + ')';

            currentState.text = text;
            currentState.fontSize = baseFontSize;
            currentState.scale = scale;
            currentState.wrapperEl = wrapper;
        }

        textInput.addEventListener('input', render);
        if (thickOutlineCheckbox) {
            thickOutlineCheckbox.addEventListener('change', render);
        }
        if (fontStyleSelect) {
            fontStyleSelect.addEventListener('change', render);
        }

        function downloadPng() {
            const baseTarget = currentState.wrapperEl || previewBox;
            if (!baseTarget || !window.html2canvas) return;

            let exportScale = 1;
            if (scaleSelect) {
                const v = parseFloat(scaleSelect.value);
                if (!isNaN(v) && v > 0) exportScale = v;
            }

            function capture() {
                // To fix the export looking "nothing like" the preview, we need to handle 
                // SVG scaling and positioning carefully for html2canvas.
                const clone = baseTarget.cloneNode(true);

                if (clone.style) {
                    clone.style.transform = 'none';
                    clone.style.transformOrigin = 'top left';
                    clone.style.margin = '0';
                    clone.style.padding = '120px 60px'; // Re-apply padding explicitly
                }

                // Important: html2canvas has trouble with SVGs that are inside a scaled container.
                // We ensure the clone is at natural scale (1.0) and then use the 'scale' option in html2canvas.
                const container = document.createElement('div');
                container.style.position = 'fixed';
                container.style.left = '-10000px';
                container.style.top = '0';
                container.style.pointerEvents = 'none';
                container.style.background = 'transparent';
                container.style.padding = '0';

                container.appendChild(clone);
                document.body.appendChild(container);

                // html2canvas options specifically tuned for SVG rendering
                window.html2canvas(container, {
                    backgroundColor: null,
                    scale: (window.devicePixelRatio || 1) * exportScale,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    onclone: (clonedDoc) => {
                        // Ensure all SVGs in the clone have correct dimensions for the capture
                        const svgs = clonedDoc.querySelectorAll('svg');
                        svgs.forEach(svg => {
                            svg.style.overflow = 'visible';
                        });
                    }
                }).then(function (canvas) {
                    document.body.removeChild(container);
                    canvas.toBlob(function (blob) {
                        if (!blob) return;
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'roldblox-text.png';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
                    }, 'image/png');
                }).catch(function () {
                    document.body.removeChild(container);
                });
            }

            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(capture);
            } else {
                capture();
            }
        }

        if (downloadPngBtn) {
            downloadPngBtn.addEventListener('click', downloadPng);
        }

        // Initial render logic
        const initFontsAndRender = async () => {
            if (document.fonts) {
                try {
                    // Pre-load fonts so character measurement is accurate
                    await Promise.all([
                        document.fonts.load('96px "Blorx Outlines"'),
                        document.fonts.load('96px "Blorx Fill"'),
                        document.fonts.load('96px "Boblox Classic"')
                    ]);
                } catch (e) {
                    console.warn("Font loading failed, rendering anyway", e);
                }
            }
            render();
        };

        initFontsAndRender();

        // Also trigger on transition end if the page is being animated into view
        rootElement.addEventListener('transitionend', initFontsAndRender, { once: true });
    }

    window.initializeRobloxFontGenerator = initializeRobloxFontGenerator;
})();
