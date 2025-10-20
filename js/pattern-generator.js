(function () { // Wrap in an IIFE to avoid polluting the global scope unnecessarily
    function initializePatternGenerator(rootElement) {
        /*
          Pattern recreation notes (based on the supplied image):
          - Grid of square tiles, each tile is subdivided diagonally into two triangles.
          - Some tiles are further subdivided into 4 right triangles (two diagonal cuts) to create smaller triangular shapes.
          - Palette: muted grays only, with three to four distinct luminance values.
          - Directionality: triangles point in 4 cardinal diagonal directions, random but with local coherence.
          - We'll implement a deterministic pseudo-random generator (seedable) so refresh/regenerate is repeatable.
        */

        // Simple xorshift32 PRNG for determinism
        function makeRNG(seed) {
            let v = seed >>> 0;
            if (v === 0) v = 0x811c9dc5;
            return function () {
                v ^= v << 13; v >>>= 0;
                v ^= v >>> 17; v >>>= 0;
                v ^= v << 5; v >>>= 0;
                return (v >>> 0) / 4294967295;
            }
        }

        const canvas = rootElement.querySelector('#c');
        if (!canvas) {
            console.error("Pattern Generator: Canvas element #c not found.");
            return;
        }
        const ctx = canvas.getContext('2d');
        const regenBtn = rootElement.querySelector('#regen');
        const seedInput = rootElement.querySelector('#seed');
        const paletteDiv = rootElement.querySelector('#palette');

        // Default palette state: array of [r,g,b]
        let paletteState = [[45, 45, 45], [42, 42, 42], [39, 39, 39], [36, 36, 36]];

        const newColorInput = rootElement.querySelector('#newcolor');
        const addColorBtn = rootElement.querySelector('#addcolor');
        const setDefaultsBtn = rootElement.querySelector('#setDefaults');

        // --- Default Values ---
        const defaults = {
            seed: '',
            scale: 64,
            palette: [[45, 45, 45], [35, 35, 35], [25, 25, 25], [15, 15, 15]],
            exportWidth: 512,
            exportHeight: 512,
            exportTile: 48,
            noiseSoftness: 8,
            randomnessSoftness: 64,
        };
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
                // Ensure newValue is a number before clamping
                const numericValue = parseFloat(newValue);
                if (isNaN(numericValue)) return;
                const clampedValue = Math.max(min, Math.min(max, numericValue));
                input.value = clampedValue;
                render();
            };

            downBtn.addEventListener('click', () => updateValue(parseFloat(input.value) - step));
            upBtn.addEventListener('click', () => updateValue(parseFloat(input.value) + step));
            input.addEventListener('change', () => updateValue(parseFloat(input.value)));

            return input;
        }

        const scaleInput = setupNumberInput('scale');
        const noiseSoftnessInput = setupNumberInput('noiseSoftness');
        const randomnessSoftnessInput = setupNumberInput('randomnessSoftness');
        const exportWidthInput = setupNumberInput('exportWidth');
        const exportHeightInput = setupNumberInput('exportHeight');
        const exportTileInput = setupNumberInput('exportTile');
        // --- End Custom Number Input Logic ---

        function rgbToHex([r, g, b]) {
            return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        }

        function renderPaletteUI() {
            paletteDiv.innerHTML = '';
            paletteState.forEach((c, i) => {
                const btn = document.createElement('button');
                btn.title = `Remove ${c.join(',')}`;
                btn.className = 'pg-palette-btn';
                btn.style.background = rgbToHex(c);
                btn.addEventListener('click', () => { paletteState.splice(i, 1); renderPaletteUI(); render(); });
                paletteDiv.appendChild(btn);
            });
        }

        addColorBtn.addEventListener('click', () => {
            const hex = newColorInput.value.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            paletteState.push([r, g, b]);
            renderPaletteUI(); render();
        });

        function setDefaults() {
            seedInput.value = defaults.seed;
            scaleInput.value = defaults.scale;
            paletteState = [[45, 45, 45], [42, 42, 42], [39, 39, 39], [36, 36, 36]];
            exportWidthInput.value = defaults.exportWidth;
            exportHeightInput.value = defaults.exportHeight;
            exportTileInput.value = defaults.exportTile;
            noiseSoftnessInput.value = defaults.noiseSoftness;
            randomnessSoftnessInput.value = defaults.randomnessSoftness;

            renderPaletteUI(); render();
        }

        setDefaultsBtn.addEventListener('click', setDefaults);

        // initial palette UI
        renderPaletteUI();

        // preset buttons
        rootElement.querySelector('#presetDark').addEventListener('click', () => {
            paletteState = [[45, 45, 45], [42, 42, 42], [39, 39, 39], [36, 36, 36]];
            renderPaletteUI(); render();
        });

        rootElement.querySelector('#presetLight').addEventListener('click', () => {
            paletteState = [[255, 255, 255], [250, 250, 250], [240, 240, 240], [235, 235, 235]];
            renderPaletteUI(); render();
        });

        rootElement.querySelector('#presetBlue').addEventListener('click', () => {
            paletteState = [[0, 180, 255], [0, 175, 255], [0, 170, 255], [0, 165, 255]];
            renderPaletteUI(); render();
        });

        rootElement.querySelector('#presetRoldblue').addEventListener('click', () => {
            paletteState = [[35, 35, 45], [30, 30, 40], [25, 25, 35], [20, 20, 30]];
            renderPaletteUI(); render();
        });


        rootElement.querySelector('#presetRed').addEventListener('click', () => {
            paletteState =
                [
                    [
                        226,
                        35,
                        26
                    ],
                    [
                        222,
                        34,
                        26
                    ],
                    [
                        218,
                        34,
                        25
                    ],
                    [
                        216,
                        33,
                        25
                    ]
                ];
            renderPaletteUI(); render();
        });

        rootElement.querySelector('#presetGreen').addEventListener('click', () => {
            paletteState =
                [
                    [
                        6,
                        171,
                        80
                    ],
                    [
                        2,
                        183,
                        87
                    ],
                    [
                        44,
                        191,
                        106
                    ],
                    [
                        54,
                        194,
                        114
                    ]
                ];
            renderPaletteUI(); render();
        });

        rootElement.querySelector('#presetYellow').addEventListener('click', () => {
            paletteState =
                [
                    [
                        246,
                        150,
                        2
                    ],
                    [
                        246,
                        162,
                        2
                    ],
                    [
                        246,
                        173,
                        2
                    ],
                    [
                        246,
                        183,
                        2
                    ]
                ];
            renderPaletteUI(); render();
        });

        rootElement.querySelector('#newPalette').addEventListener('click', () => {
            paletteState = [];
            renderPaletteUI(); render();
        });



        // save palette as JSON
        rootElement.querySelector('#savePalette').addEventListener('click', () => {
            const data = JSON.stringify(paletteState);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'palette.json'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 3000);
        });
        // load palette from file
        const loadPaletteFile = rootElement.querySelector('#loadPaletteFile');
        rootElement.querySelector('#loadPalette').addEventListener('click', () => loadPaletteFile.click());
        loadPaletteFile.addEventListener('change', (e) => {
            const f = e.target.files && e.target.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const parsed = JSON.parse(ev.target.result);
                    if (Array.isArray(parsed)) { paletteState = parsed.map(arr => [arr[0], arr[1], arr[2]]); renderPaletteUI(); render(); }
                } catch (err) { alert('Invalid palette file'); }
            };
            reader.readAsText(f);
        });

        function resize() {
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            const mainEl = rootElement.querySelector('.main');
            if (!mainEl) return;
            const { width, height } = mainEl.getBoundingClientRect();
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        window.addEventListener('resize', () => { resize(); render(); });

        function pickPalette(rng) {
            // Four gray shades chosen to mimic the image (dark to light)
            const base = 34; // a dark baseline
            const shades = [
                `rgb(${base},${base},${base})`,
                `rgb(${base + 24},${base + 24},${base + 24})`,
                `rgb(${base + 48},${base + 48},${base + 48})`,
                `rgb(${base + 80},${base + 80},${base + 80})`
            ];
            return shades;
        }

        function luminanceFromRgbCss(css) {
            // css expected like 'rgb(r,g,b)'
            const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(css);
            if (!m) return 0;
            const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
            // relative luminance approximation
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }

        // choose color biased by luminance similarity when randomness is low
        function chooseColorBiased(rng, paletteCss, randomness, preferLuminance) {
            // randomness: 0..1 (0 = fully biased by luminance, 1 = uniform)
            if (randomness >= 0 || paletteCss.length <= 1) return paletteCss[Math.floor(rng() * paletteCss.length)];
            // compute luminances
            const lums = paletteCss.map(luminanceFromRgbCss);
            // target luminance: when preferLuminance provided, prefer nearby; else pick random target
            const target = (typeof preferLuminance === 'number') ? preferLuminance : (lums[Math.floor(rng() * lums.length)]);
            // amplify bias when randomness is low: biasFactor in [1, 11]
            const biasFactor = 1 + (1 - randomness) * 10;
            // compute weights stronger inverse to distance to target
            const weights = lums.map(l => 1 / Math.pow(Math.abs(l - target) + 0.001, biasFactor));
            // convert weights to probabilities but mix with uniform based on randomness
            const mixed = weights.map(w => w * (1 - randomness) + (1 * randomness));
            const sum = mixed.reduce((a, b) => a + b, 0);
            let r = rng() * sum;
            for (let i = 0; i < mixed.length; i++) {
                r -= mixed[i];
                if (r <= 0) return paletteCss[i];
            }
            return paletteCss[paletteCss.length - 1];
        }

        // choose two distinct colors: first follows preferLuminance target, second prefers similar luminance but must differ
        function chooseTwoDistinctColors(rng, paletteCss, softness, preferLuminance) {
            // softness here controls how strictly we follow preferLuminance (0..1 mapped from randomnessSoftness)
            const randomness = 1 - Math.min(1, Math.max(0, (softness - 4) / 396));
            // sameColorChance increases with softness: map softness range [4,400] -> chance [0.02,0.65]
            const t = Math.min(1, Math.max(0, (softness - 4) / 396));
            const sameColorChance = 0.02 + t * (0.65 - 0.02);
            // pick first color
            const c0 = chooseColorBiased(rng, paletteCss, randomness, preferLuminance);
            // sometimes allow the same color for both triangles
            if (rng() < sameColorChance) return [c0, c0];
            // otherwise try to pick a different second color; try a few times
            let c1 = null;
            for (let i = 0; i < 6; i++) {
                const attempt = chooseColorBiased(rng, paletteCss, randomness, luminanceFromRgbCss(c0));
                if (attempt !== c0) { c1 = attempt; break; }
            }
            if (!c1) {
                // fallback: pick the next different color by index
                for (let i = 0; i < paletteCss.length; i++) if (paletteCss[i] !== c0) { c1 = paletteCss[i]; break; }
            }
            if (!c1) c1 = c0; // last resort (single-color palette)
            return [c0, c1];
        }

        // seeded 2D value-noise: lattice values generated from an RNG seeded per pattern
        function makeValueNoise(seed) {
            const baseRng = makeRNG(seed);
            const cache = new Map();
            return function (x, y) {
                // integer lattice
                const xi = Math.floor(x), yi = Math.floor(y);
                const key = xi + ',' + yi;
                if (cache.has(key)) return cache.get(key);
                // produce a deterministic pseudorandom value per lattice point
                // mix xi/yi into a small seed by hashing
                let s = (xi * 374761393 + yi * 668265263) >>> 0;
                // combine with base seed
                s = (s ^ (seed >>> 0)) >>> 0;
                const r = makeRNG(s)();
                cache.set(key, r);
                return r;
            };
        }

        function valueNoiseAt(noiseFn, x, y) {
            const x0 = Math.floor(x), y0 = Math.floor(y);
            const tx = x - x0, ty = y - y0;
            const v00 = noiseFn(x0, y0);
            const v10 = noiseFn(x0 + 1, y0);
            const v01 = noiseFn(x0, y0 + 1);
            const v11 = noiseFn(x0 + 1, y0 + 1);
            // bilinear interp
            const a = v00 * (1 - tx) + v10 * tx;
            const b = v01 * (1 - tx) + v11 * tx;
            return a * (1 - ty) + b * ty;
        }

        // fractal Brownian motion (sum of octaves) for smoother continuous noise
        function fBm(noiseFn, x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
            let sum = 0, amp = 1, freq = 1, max = 0;
            for (let i = 0; i < octaves; i++) {
                sum += amp * valueNoiseAt(noiseFn, x * freq, y * freq);
                max += amp;
                amp *= gain;
                freq *= lacunarity;
            }
            return sum / max;
        }

        function lerp(a, b, t) { return a + (b - a) * t; }
        function lerpRgbHex(a, b, t) {
            // a and b are css 'rgb(r,g,b)'
            const ma = /rgb\((\d+),(\d+),(\d+)\)/.exec(a);
            const mb = /rgb\((\d+),(\d+),(\d+)\)/.exec(b);
            if (!ma || !mb) return a;
            const r = Math.round(lerp(parseInt(ma[1], 10), parseInt(mb[1], 10), t));
            const g = Math.round(lerp(parseInt(ma[2], 10), parseInt(mb[2], 10), t));
            const bl = Math.round(lerp(parseInt(ma[3], 10), parseInt(mb[3], 10), t));
            return `rgb(${r},${g},${bl})`;
        }

        // snap an rgb(...) color to the nearest exact color from paletteCss (array of 'rgb(r,g,b)')
        function snapToPalette(css, paletteCss) {
            const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(css);
            if (!m) return css;
            const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
            let best = paletteCss[0] || css;
            let bestDist = Infinity;
            for (let i = 0; i < paletteCss.length; i++) {
                const pm = /rgb\((\d+),(\d+),(\d+)\)/.exec(paletteCss[i]);
                if (!pm) continue;
                const pr = parseInt(pm[1], 10), pg = parseInt(pm[2], 10), pb = parseInt(pm[3], 10);
                const dr = r - pr, dg = g - pg, db = b - pb;
                const dist = dr * dr + dg * dg + db * db;
                if (dist < bestDist) { bestDist = dist; best = paletteCss[i]; }
            }
            return best;
        }

        function render() {
            resize();
            // seed handling (same deterministic seed approach)
            const seedStr = (seedInput.value || '').toString();
            let seed = 0;
            if (seedStr.length) {
                for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
            } else {
                seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
            }

            const rng = makeRNG(seed);
            const scale = parseInt(scaleInput.value, 10) || 64; // tile size
            const palette = paletteState.map(c => `rgb(${c[0]},${c[1]},${c[2]})`);
            const paletteOrdered = palette.slice().sort((a, b) => luminanceFromRgbCss(a) - luminanceFromRgbCss(b));
            const len = paletteOrdered.length;

            // --- Histogram Equalization for True Uniform Color Distribution ---
            // 1. Sample the noise distribution to build a CDF (Cumulative Distribution Function).
            const samples = [];
            const noiseSampler = makeValueNoise(seed);
            for (let i = 0; i < 2000; i++) {
                samples.push(fBm(noiseSampler, rng() * 50, rng() * 50, 4, 2, 0.55));
            }
            samples.sort((a, b) => a - b);

            // 2. Create a function that finds the percentile of a value and maps it to a color.
            const getColorIndex = (v) => {
                // Find where `v` would be inserted in the sorted samples to maintain order.
                const index = samples.findIndex(s => s >= v);
                const percentile = (index === -1) ? 1 : (index / samples.length);
                return Math.min(len - 1, Math.floor(percentile * len));
            };
            // --- End Equalization ---

            // randomnessRange removed; we drive behavior from randomnessSoftness only
            const randomnessSoftness = parseFloat(randomnessSoftnessInput.value) || 64;
            const noiseFn = makeValueNoise(seed);
            const noiseFnHigh = makeValueNoise((seed ^ 0x9e3779b1) >>> 0);

            // background
            ctx.fillStyle = palette[3] || '#222';
            const mainEl = rootElement.querySelector('.main');
            if (!mainEl) return;
            const { width, height } = mainEl.getBoundingClientRect();
            ctx.fillRect(0, 0, width, height);

            const cols = Math.ceil(width / scale) + 2;
            const rows = Math.ceil(height / scale) + 2;

            // draw tiles: exactly two triangles per square (slash diagonal)
            const prevRowLums = new Array(cols + 2).fill(null);
            for (let y = -1; y < rows; y++) {
                let leftLum = null;
                for (let x = -1; x < cols; x++) {
                    const px = x * scale;
                    const py = y * scale;

                    // compute a noise-based preferred luminance for the tile center
                    let preferLum = null;
                    if (randomnessSoftness > 0) {
                        const cx = (x + 0.5) * scale / randomnessSoftness;
                        const cy = (y + 0.5) * scale / randomnessSoftness;
                        const nv = valueNoiseAt(noiseFn, cx, cy); // 0..1
                        // map noise to luminance range of palette (approx min..max luminance)
                        const lums = palette.map(luminanceFromRgbCss);
                        const minL = Math.min(...lums);
                        const maxL = Math.max(...lums);
                        preferLum = minL + nv * (maxL - minL);
                    }

                    // per-triangle sampling: sample noise at each triangle's centroid so triangles stay visible
                    // triangle centroids for slash diagonal (top-left triangle and bottom-right triangle)
                    const cxA = px + scale * 0.33, cyA = py + scale * 0.33;
                    const cxB = px + scale * 0.66, cyB = py + scale * 0.66;
                    const vA = fBm(noiseFn, cxA / randomnessSoftness, cyA / randomnessSoftness, 4, 2, 0.55);
                    const vB = fBm(noiseFn, cxB / randomnessSoftness, cyB / randomnessSoftness, 4, 2, 0.55);
                    const idxA = getColorIndex(vA);
                    const idxB = getColorIndex(vB);
                    const c0 = paletteOrdered[idxA];
                    const c1 = paletteOrdered[idxB];

                    // To avoid seams, draw the full tile with one color, then the other triangle on top.
                    ctx.fillStyle = c1;
                    ctx.fillRect(px, py, scale, scale);
                    ctx.fillStyle = c0;
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + scale, py);
                    ctx.lineTo(px, py + scale);
                    ctx.closePath();
                    ctx.fill();

                    // remember luminance for neighbor bias
                    leftLum = luminanceFromRgbCss(c1);
                    prevRowLums[x + 1] = leftLum;
                }
            }

            // subtle noise overlay to match the slightly grainy appearance
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const softness = parseFloat(noiseSoftnessInput.value) || 0;
            if (softness > 0) {
                const rng = makeRNG(Date.now());
                for (let i = 0; i < data.length; i += 4) {
                    const v = (rng() - 0.5) * softness; // small variation
                    data[i] = Math.max(0, Math.min(255, data[i] + v));
                    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + v));
                    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + v));
                }
                ctx.putImageData(imageData, 0, 0);
            }
        }

        // reusable draw function for exports and on-screen rendering
        function drawPattern(ctxLocal, width, height, tileSize, seedVal, paletteArr, randomnessSoftness, noiseSoftness) {
            const rngLocal = makeRNG(seedVal);
            const paletteOrderedLocal = paletteArr.slice().sort((a, b) => luminanceFromRgbCss(a) - luminanceFromRgbCss(b));
            const lenLocal = paletteOrderedLocal.length;

            // --- Histogram Equalization for Export ---
            const samples = [];
            const noiseSampler = makeValueNoise(seedVal);
            for (let i = 0; i < 2000; i++) {
                samples.push(fBm(noiseSampler, rngLocal() * 50, rngLocal() * 50, 4, 2, 0.55));
            }
            samples.sort((a, b) => a - b);

            const getColorIndex = (v) => {
                const index = samples.findIndex(s => s >= v);
                const percentile = (index === -1) ? 1 : (index / samples.length);
                return Math.min(lenLocal - 1, Math.floor(percentile * lenLocal));
            };
            // --- End Equalization ---

            // background
            ctxLocal.fillStyle = paletteArr[paletteArr.length - 1] || '#222';
            ctxLocal.fillRect(0, 0, width, height);

            const colsLocal = Math.ceil(width / tileSize) + 2;
            const rowsLocal = Math.ceil(height / tileSize) + 2;
            const noiseFnLocal = makeValueNoise(seedVal);
            const noiseFnHighLocal = makeValueNoise((seedVal ^ 0x9e3779b1) >>> 0);
            const randomnessSoftnessLocal = randomnessSoftness || 64;

            const prevRowLumsLocal = new Array(colsLocal + 2).fill(null);
            for (let y = -1; y < rowsLocal; y++) {
                let leftLumLocal = null;
                for (let x = -1; x < colsLocal; x++) {
                    const px = x * tileSize;
                    const py = y * tileSize;

                    // new approach: ordered palette indices from low-frequency noise + micro-noise per-triangle
                    const cxALocal = px + tileSize * 0.33, cyALocal = py + tileSize * 0.33;
                    const cxBLocal = px + tileSize * 0.66, cyBLocal = py + tileSize * 0.66;
                    const vALocal = fBm(noiseFnLocal, cxALocal / randomnessSoftnessLocal, cyALocal / randomnessSoftnessLocal, 4, 2, 0.55);
                    const vBLocal = fBm(noiseFnLocal, cxBLocal / randomnessSoftnessLocal, cyBLocal / randomnessSoftnessLocal, 4, 2, 0.55);
                    const idxALocal = getColorIndex(vALocal);
                    const idxBLocal = getColorIndex(vBLocal);
                    const c0 = paletteOrderedLocal[idxALocal];
                    const c1 = paletteOrderedLocal[idxBLocal];
                    // To avoid seams, draw the full tile with one color, then the other triangle on top.
                    ctxLocal.fillStyle = c1;
                    ctxLocal.fillRect(px, py, tileSize, tileSize);
                    ctxLocal.fillStyle = c0;
                    ctxLocal.beginPath();
                    ctxLocal.moveTo(px, py);
                    ctxLocal.lineTo(px + tileSize, py);
                    ctxLocal.lineTo(px, py + tileSize);
                    ctxLocal.closePath();
                    ctxLocal.fill();

                    leftLumLocal = luminanceFromRgbCss(c1);
                    prevRowLumsLocal[x + 1] = leftLumLocal;
                }
            }

            // subtle noise
            try {
                const id = ctxLocal.getImageData(0, 0, width, height);
                const d = id.data;
                const softnessLocal = noiseSoftness || 0;
                if (softnessLocal > 0) {
                    for (let i = 0; i < d.length; i += 4) {
                        const v = (rngLocal() - 0.5) * softnessLocal;
                        d[i] = Math.max(0, Math.min(255, d[i] + v));
                        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + v));
                        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + v));
                    }
                    ctxLocal.putImageData(id, 0, 0);
                }
            } catch (e) {/*ignore for tainted canvas*/ }
        }

        // wire download button
        const downloadBtn = rootElement.querySelector('#downloadPNG');
        downloadBtn.addEventListener('click', () => {
            const width = parseInt(exportWidthInput.value, 10) || 512;
            const height = parseInt(exportHeightInput.value, 10) || 512;
            const tile = parseInt(exportTileInput.value, 10) || 48;
            // seed derivation
            const seedStr = (rootElement.querySelector('#seed').value || '').toString();
            let seed = 0;
            if (seedStr.length) { for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0; }
            else seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;

            const out = document.createElement('canvas');
            out.width = width; out.height = height;
            const octx = out.getContext('2d');
            const paletteCss = paletteState.map(c => `rgb(${c[0]},${c[1]},${c[2]})`);
            const randomnessSoftness = parseFloat(randomnessSoftnessInput.value) || 64;
            const noiseSoftness = parseFloat(noiseSoftnessInput.value) || 0;
            drawPattern(octx, width, height, tile, seed, paletteCss, randomnessSoftness, noiseSoftness);
            out.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `pattern-${width}x${height}.png`; a.click();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            });
        });

        regenBtn.addEventListener('click', () => { render(); });

        // --- ROBUST INITIAL RENDER ---
        // The SPA uses a CSS transition to fade in the page. We must wait for this
        // transition to end before the first render to get the correct canvas size.
        // Listening for the 'transitionend' event is the most reliable way to do this.
        const handleFirstRender = () => {
            render();
        };

        // We listen for the transition to end on the root element of the page.
        // The { once: true } option automatically removes the listener after it runs.
        rootElement.addEventListener('transitionend', handleFirstRender, { once: true });

        // As a fallback, in case the transitionend event doesn't fire (e.g., if
        // animations are disabled), we still trigger a render after a safe delay.
        // This ensures the generator always appears.
        setTimeout(() => rootElement.removeEventListener('transitionend', handleFirstRender), 400);
        setTimeout(handleFirstRender, 400);
    }

    // Expose the initialization function to the global scope so the SPA router can call it.
    window.initializePatternGenerator = initializePatternGenerator;
})();