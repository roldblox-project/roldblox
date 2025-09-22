// archive-init.js
(function(){
  const OWNER = 'roldblox-project';
  const REPO = 'roarchive';
  const API_CONTENTS = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;
  const API_COMMITS = `https://api.github.com/repos/${OWNER}/${REPO}/commits`;

  function formatBytes(bytes){
    if (bytes == null) return '';
    const units = ['B','KB','MB','GB','TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes)/Math.log(1024));
    return Math.round(bytes/Math.pow(1024,i)) + ' ' + units[i];
  }
  function extOf(name){ const i = name.lastIndexOf('.'); return i>=0? name.slice(i+1).toLowerCase():''; }
  function isImg(ext){ return ['png','jpg','jpeg','gif','svg','webp'].includes(ext); }

  function attachArchivePreview(root){
    root.querySelectorAll('.archive-grid .tile-thumb img').forEach(img=>{
      if (img._fsAttached) return; img._fsAttached = true;
      img.addEventListener('click', e=>{ e.stopPropagation(); if (typeof window.toggleFullscreenImage==='function') window.toggleFullscreenImage(img); });
    });
  }

  function initArchiveExplorer(root){
    if (!root || root._archiveAttached) return;
    const fileListEl = root.querySelector('#fileList');
    const breadcrumbEl = root.querySelector('#breadcrumb');
    const filterInput = root.querySelector('#filter');
    const refreshBtn = root.querySelector('#refreshBtn');
    const backBtn = root.querySelector('#backBtn');
    const forwardBtn = root.querySelector('#forwardBtn');
    const sortSelect = root.querySelector('#sortSelect');
    if (!fileListEl || !breadcrumbEl) return;

    // set toolbar icons
    if (backBtn) backBtn.innerHTML = '<img src="/images/miscicons/leftarrow.png" alt="Back" width="32" height="32" />';
    if (forwardBtn) forwardBtn.innerHTML = '<img src="/images/miscicons/rightarrow.png" alt="Forward" width="32" height="32" />';

    root._archiveAttached = true;
    let currentPath = '';
    const entriesCache = Object.create(null);
    const commitCache = Object.create(null);
    const histBack = []; const histFwd = [];

    function setNavState(){ if(backBtn) backBtn.disabled = histBack.length===0; if(forwardBtn) forwardBtn.disabled = histFwd.length===0; }

    backBtn && backBtn.addEventListener('click', ()=>{ if(!histBack.length) return; histFwd.push(currentPath); const p = histBack.pop(); openPath(p,{fromHistory:true}); setNavState(); });
    forwardBtn && forwardBtn.addEventListener('click', ()=>{ if(!histFwd.length) return; histBack.push(currentPath); const n = histFwd.pop(); openPath(n,{fromHistory:true}); setNavState(); });

    async function fetchContents(path=''){
      const url = API_CONTENTS + (path? '/'+path: '');
      try {
        const res = await fetch(url, { headers: { 'Accept':'application/vnd.github.v3+json' }});
        if (!res.ok) throw new Error('GitHub API error '+res.status);
        return await res.json();
      } catch (e){ return { error: String(e && e.message || e) }; }
    }
    async function fetchLatestCommitDate(path){
      if (commitCache[path] !== undefined) return commitCache[path];
      try {
        const url = `${API_COMMITS}?path=${encodeURIComponent(path)}&per_page=1`;
        const res = await fetch(url, { headers: { 'Accept':'application/vnd.github.v3+json' }});
        if (!res.ok) throw new Error('Commit fetch '+res.status);
        const data = await res.json();
        const iso = data && data[0] && data[0].commit && data[0].commit.author && data[0].commit.author.date;
        commitCache[path] = iso? new Date(iso): null; return commitCache[path];
      } catch(_){ commitCache[path] = null; return null; }
    }

    // Load JSZip lazily when needed
    async function ensureJSZip(){
      if (window.JSZip) return window.JSZip;
      return new Promise((resolve, reject)=>{
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        s.onload = ()=> resolve(window.JSZip);
        s.onerror = ()=> reject(new Error('Failed to load ZIP library'));
        document.head.appendChild(s);
      });
    }

    // Recursively add a folder to the zip from GitHub contents
    async function addFolderToZip(zip, path, prefix){
      const items = await fetchContents(path);
      if (!Array.isArray(items)) return;
      for (const item of items){
        if (item.type === 'dir'){
          await addFolderToZip(zip, item.path, `${prefix}${item.name}/`);
        } else if (item.download_url){
          const resp = await fetch(item.download_url);
          if (!resp.ok) throw new Error(`Fetch failed for ${item.path}: ${resp.status}`);
          const blob = await resp.blob();
          zip.file(`${prefix}${item.name}`, blob);
        }
      }
    }

    // Zip a folder and trigger download
    async function downloadFolderAsZip(path, name){
      try {
        const JSZipCtor = await ensureJSZip();
        if (!JSZipCtor) throw new Error('ZIP library unavailable');
        const zip = new JSZipCtor();
        await addFolderToZip(zip, path, '');
        const blob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = (name || 'folder') + '.zip';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=> URL.revokeObjectURL(url), 2000);
      } catch (e){
        alert('Failed to download folder as ZIP: ' + (e && e.message || e));
      }
    }

    function setBreadcrumb(path){ breadcrumbEl.textContent = '/' + (path||''); }

    function render(items){
      fileListEl.innerHTML = '';
      const q = (filterInput && filterInput.value || '').trim().toLowerCase();
      const sortMode = (sortSelect && sortSelect.value) || 'name-asc';
      let list = items.filter(i=> i.name.toLowerCase().includes(q));
      list.sort((a,b)=>{
        if (sortMode.startsWith('name')){
          const cmp = a.name.localeCompare(b.name); return sortMode.endsWith('asc')? cmp: -cmp;
        }
        if (a.type===b.type) return a.name.localeCompare(b.name);
        return a.type==='dir'? -1: 1;
      });

      if (!list.length){ fileListEl.innerHTML = '<div class="empty">No files found</div>'; return; }

      list.forEach(item=>{
        const el = document.createElement('div'); el.className = 'archive-tile';
        const thumb = document.createElement('div'); thumb.className = 'tile-thumb';
        const meta = document.createElement('div'); meta.className = 'tile-meta';
        const actions = document.createElement('div'); actions.className = 'tile-actions';

        const ext = extOf(item.name);
        if (item.type==='dir') { thumb.textContent='📁'; }
        else if (item.download_url && isImg(ext)) { const img = document.createElement('img'); img.src=item.download_url; img.alt=item.name; thumb.appendChild(img); }
        else { thumb.textContent='📄'; }

        const nameEl = document.createElement('div'); nameEl.className = 'tile-name'; nameEl.textContent = item.name;
        const info1 = document.createElement('div'); info1.className = 'tile-info'; info1.textContent = item.type==='dir'? 'folder': (item.size? formatBytes(item.size): (ext || 'file'));
        const info2 = document.createElement('div'); info2.className = 'tile-info'; info2.textContent = '';
        meta.appendChild(nameEl); meta.appendChild(info1); meta.appendChild(info2);

        const openBtn = document.createElement('button'); openBtn.className='icon-btn has-tooltip'; openBtn.title='Open on GitHub'; openBtn.setAttribute('data-tooltip','open on GitHub');
        openBtn.innerHTML = '<img src="/images/miscicons/openexternal.png" alt="Open on GitHub" width="32" height="32" />';
        openBtn.addEventListener('click', ev=>{ ev.stopPropagation(); const url = item.html_url || (item.type==='dir'? `https://github.com/${OWNER}/${REPO}/tree/main/${item.path}`: `https://github.com/${OWNER}/${REPO}/blob/main/${item.path}`); window.open(url, '_blank'); });
        actions.appendChild(openBtn);

        if (item.type!=='dir' && item.download_url){
          const dlBtn = document.createElement('button'); dlBtn.className='icon-btn has-tooltip'; dlBtn.title='Download'; dlBtn.setAttribute('data-tooltip','download');
          dlBtn.innerHTML = '<img src="/images/miscicons/download.png" alt="Download" width="32" height="32" />';
          dlBtn.addEventListener('click', ev=>{ ev.stopPropagation(); const a=document.createElement('a'); a.href=item.download_url; a.download=item.name; document.body.appendChild(a); a.click(); a.remove(); });
          actions.appendChild(dlBtn);
        } else if (item.type==='dir'){
          const dlFolderBtn = document.createElement('button'); dlFolderBtn.className='icon-btn has-tooltip'; dlFolderBtn.title='Download Folder'; dlFolderBtn.setAttribute('data-tooltip','download folder');
          dlFolderBtn.innerHTML = '<img src="/images/miscicons/download.png" alt="Download Folder" width="32" height="32" />';
          dlFolderBtn.addEventListener('click', async ev=>{
            ev.stopPropagation();
            dlFolderBtn.disabled = true; dlFolderBtn.title = 'Zipping...';
            try { await downloadFolderAsZip(item.path, item.name); }
            finally { dlFolderBtn.disabled = false; dlFolderBtn.title = 'Download Folder'; }
          });
          actions.appendChild(dlFolderBtn);
        }

        el.appendChild(thumb); el.appendChild(meta); el.appendChild(actions); fileListEl.appendChild(el);

        el.addEventListener('click', ()=>{
          if (item.type==='dir') openPath(item.path);
          else if (item.download_url && isImg(ext)) { const img = thumb.querySelector('img'); if (img) { if (typeof window.toggleFullscreenImage==='function') window.toggleFullscreenImage(img); }}
          else if (item.html_url) window.open(item.html_url,'_blank');
          else if (item.download_url) window.open(item.download_url,'_blank');
        });

        fetchLatestCommitDate(item.path).then(dt=>{ if (!dt) return; info2.textContent = `Last updated: ${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}`; });
      });

      attachArchivePreview(root);

      if (sortMode.startsWith('date')){
        const children = Array.from(fileListEl.children);
        children.sort((a,b)=>{
          const nA = a.querySelector('.tile-name').textContent;
          const nB = b.querySelector('.tile-name').textContent;
          const itemA = list.find(i=> i.name===nA);
          const itemB = list.find(i=> i.name===nB);
          const da = commitCache[itemA && itemA.path] || null; const db = commitCache[itemB && itemB.path] || null;
          const va = da? da.getTime(): -Infinity; const vb = db? db.getTime(): -Infinity;
          return sortMode.endsWith('asc')? (va - vb): (vb - va);
        });
        children.forEach(c=> fileListEl.appendChild(c));
      }
    }

    async function openPath(path='', opts={}){
      if (!opts.fromHistory){ if (currentPath!=='') histBack.push(currentPath); histFwd.length = 0; }
      currentPath = path||''; setBreadcrumb(currentPath); setNavState();
      if (entriesCache[currentPath]){ render(entriesCache[currentPath]); return; }
      fileListEl.innerHTML = '<div class="empty">Loading...</div>';
      const data = await fetchContents(currentPath);
      if (data && data.error){ fileListEl.innerHTML = `<div class="empty">${data.error}</div>`; return; }
      const items = Array.isArray(data)? data: [data];
      items.sort((a,b)=>{ if (a.type===b.type) return a.name.localeCompare(b.name); return a.type==='dir'? -1: 1; });
      entriesCache[currentPath] = items; render(items);
    }

    filterInput && filterInput.addEventListener('input', ()=>{ render(entriesCache[currentPath]||[]); });
    sortSelect && sortSelect.addEventListener('change', ()=>{ render(entriesCache[currentPath]||[]); });
    refreshBtn && refreshBtn.addEventListener('click', ()=>{ Object.keys(entriesCache).forEach(k=> delete entriesCache[k]); openPath(currentPath); });

    setNavState(); openPath('');
  }

  function onRoute(){
    if (location.hash && location.hash.startsWith('#/archive')){
      const content = document.getElementById('content') || document;
      const page = content.querySelector('.archive-page');
      if (page) initArchiveExplorer(page);
    }
  }

  window.addEventListener('hashchange', ()=> setTimeout(onRoute, 0));
  window.addEventListener('DOMContentLoaded', ()=>{
    onRoute();
    const content = document.getElementById('content');
    if (content && typeof MutationObserver !== 'undefined'){
      const mo = new MutationObserver(()=> onRoute());
      mo.observe(content, { childList: true, subtree: true });
    }
  });
})();