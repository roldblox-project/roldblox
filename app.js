// app.js
// Explorer for GitHub repo: roldblox-project/roarchive

document.addEventListener('DOMContentLoaded', () => {
  const OWNER = 'roldblox-project';
  const REPO = 'roarchive';
  const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

  const fileListEl = document.getElementById('fileList');
  const breadcrumbEl = document.getElementById('breadcrumb');
  const previewContent = document.getElementById('previewContent');
  const openRawBtn = document.getElementById('openRaw');
  const downloadBtn = document.getElementById('downloadBtn');
  const filterInput = document.getElementById('filter');
  const refreshBtn = document.getElementById('refreshBtn');
  const backBtn = document.getElementById('backBtn');
  const forwardBtn = document.getElementById('forwardBtn');

  let currentPath = '';
  let entriesCache = {};
  const historyBack = [];
  const historyForward = [];

  // put svg icons in nav buttons
  backBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`;
  forwardBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`;

  function updateNavButtons() {
    backBtn.disabled = historyBack.length === 0;
    forwardBtn.disabled = historyForward.length === 0;
  }

  backBtn.addEventListener('click', () => {
    if (historyBack.length === 0) return;
    historyForward.push(currentPath);
    const prev = historyBack.pop();
    openPath(prev, { fromHistory: true });
    updateNavButtons();
  });

  forwardBtn.addEventListener('click', () => {
    if (historyForward.length === 0) return;
    historyBack.push(currentPath);
    const next = historyForward.pop();
    openPath(next, { fromHistory: true });
    updateNavButtons();
  });

  async function fetchContents(path = '') {
    // IMPORTANT: do NOT encode the whole path (slashes must remain as / for nested folders).
    // If you need to encode, encode each segment separately.
    const url = API_BASE + (path ? '/' + path : '');
    try {
      const res = await fetch(url, {
        headers: {
          // Explicit accept helps clarity; not strictly required.
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!res.ok) {
        if (res.status === 403) {
          // Could be rate limit; surface a helpful message.
          const remaining = res.headers.get('X-RateLimit-Remaining');
          const reset = res.headers.get('X-RateLimit-Reset');
          const resetDate = reset ? new Date(parseInt(reset, 10) * 1000) : null;
          throw new Error(
            `GitHub API 403 (rate limit or access). Remaining: ${remaining ?? 'unknown'}`
            + (resetDate ? `, resets at ${resetDate.toLocaleTimeString()}` : '')
          );
        }
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (e) {
      return { error: String(e.message || e) };
    }
  }

  function makeDownloadButton(item) {
    const btn = document.createElement('button');
    btn.className = 'icon-btn has-tooltip';
    btn.setAttribute('data-tooltip', 'download');
    btn.title = 'download';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 15V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!item.download_url) return;
      const a = document.createElement('a');
      a.href = item.download_url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
    return btn;
  }

  function renderList(items) {
    fileListEl.innerHTML = '';
    if (!items || items.length === 0) {
      fileListEl.innerHTML = '<div class="empty">No files found</div>';
      return;
    }
    const q = filterInput.value.trim().toLowerCase();
    items
      .filter(i => i.name.toLowerCase().includes(q))
      .forEach(item => {
        const el = document.createElement('div');
        el.className = 'item';

        const icon = document.createElement('div');
        icon.className = 'item-icon';
        icon.textContent = item.type === 'dir' ? '📁' : '📄';

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = item.name;

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = item.type === 'dir' ? 'folder' : item.size ? formatBytes(item.size) : '';

        el.appendChild(icon);
        el.appendChild(name);
        el.appendChild(meta);

        if (item.type !== 'dir' && item.download_url) {
          const dl = makeDownloadButton(item);
          el.appendChild(dl);
        }

        el.addEventListener('click', () => onClickItem(item));
        fileListEl.appendChild(el);
      });
  }

  function setBreadcrumb(path) {
    breadcrumbEl.textContent = '/' + (path || '');
  }

  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  }

  async function openPath(path, opts = {}) {
    opts = opts || {};
    if (!opts.fromHistory) {
      if (currentPath !== '') historyBack.push(currentPath);
      historyForward.length = 0;
    }

    currentPath = path || '';
    setBreadcrumb(currentPath);
    updateNavButtons();

    if (entriesCache[currentPath]) {
      renderList(entriesCache[currentPath]);
      return;
    }

    fileListEl.innerHTML = '<div class="empty">Loading...</div>';
    const data = await fetchContents(currentPath);
    if (data.error) {
      fileListEl.innerHTML = `<div class="empty">${escapeHtml(data.error)}</div>`;
      return;
    }

    const items = Array.isArray(data) ? data : [data];
    items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'dir' ? -1 : 1;
    });
    entriesCache[currentPath] = items;
    renderList(items);
  }

  async function onClickItem(item) {
    if (item.type === 'dir') {
      openPath(item.path);
      previewContent.innerHTML = '<div class="empty">Select a file to preview</div>';
      openRawBtn.style.display = 'none';
      downloadBtn.style.display = 'none';
      return;
    }

    previewContent.innerHTML = '<div class="empty">Loading preview...</div>';
    openRawBtn.style.display = 'none';
    downloadBtn.style.display = 'none';

    if (item.download_url) {
      openRawBtn.style.display = 'inline-block';
      downloadBtn.style.display = 'inline-block';
      openRawBtn.onclick = () => window.open(item.download_url, '_blank');
      downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = item.download_url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      };
    }

    const textExt = ['md', 'txt', 'json', 'js', 'ts', 'css', 'html', 'yml', 'yaml', 'lua', 'py', 'csv'];
    const imgExt = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
    const ext = (item.name.split('.').pop() || '').toLowerCase();

    if (textExt.includes(ext)) {
      try {
        const r = await fetch(item.download_url, { cache: 'no-store' });
        if (!r.ok) throw new Error(`Failed to fetch file (${r.status})`);
        const text = await r.text();
        previewContent.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
      } catch (e) {
        previewContent.innerHTML = `<div class="empty">Could not load file: ${escapeHtml(e.message)}</div>`;
      }
      return;
    }

    if (imgExt.includes(ext)) {
      previewContent.innerHTML = '';
      const img = document.createElement('img');
      img.src = item.download_url;
      img.style.maxWidth = '100%';
      img.style.borderRadius = '8px';
      img.alt = item.name;
      previewContent.appendChild(img);
      return;
    }

    previewContent.innerHTML = '<div class="empty">No preview available. Use Download or Open raw.</div>';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
  }

  filterInput.addEventListener('input', () => {
    const items = entriesCache[currentPath] || [];
    renderList(items);
  });

  refreshBtn.addEventListener('click', () => {
    entriesCache = {};
    openPath(currentPath);
  });

  // initial
  updateNavButtons();
  openPath('');
});