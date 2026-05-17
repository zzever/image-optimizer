import { removeBackground } from 'https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm';

'use strict';

const state = {
  type: 'logo',
  file: null,
  fileDataURL: null,
  svgText: null,
};

const typeBtns       = document.querySelectorAll('.type-btn');
const dropZone       = document.getElementById('dropZone');
const fileInput      = document.getElementById('fileInput');
const previewWrap    = document.getElementById('previewWrap');
const previewImg     = document.getElementById('previewImg');
const fileMeta       = document.getElementById('fileMeta');
const formatHint     = document.getElementById('formatHint');
const convertBtn     = document.getElementById('convertBtn');
const progressWrap   = document.getElementById('progressWrap');
const progressBar    = document.getElementById('progressBar');
const progressText   = document.getElementById('progressText');
const resultsSection = document.getElementById('step-results');
const resultsGrid    = document.getElementById('resultsGrid');

const optionsLogo     = document.getElementById('optionsLogo');
const optionsRetrato  = document.getElementById('optionsRetrato');
const optionsPaisaje  = document.getElementById('optionsPaisaje');
const optionsRemoveBg = document.getElementById('optionsRemoveBg');

const retratoQuality    = document.getElementById('retratoQuality');
const retratoQualityVal = document.getElementById('retratoQualityVal');
const paisajeQuality    = document.getElementById('paisajeQuality');
const paisajeQualityVal = document.getElementById('paisajeQualityVal');

typeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    typeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.type = btn.dataset.type;
    switchOptions(state.type);
    resetResults();
  });
});

function switchOptions(type) {
  optionsLogo.hidden     = type !== 'logo';
  optionsRetrato.hidden  = type !== 'retrato';
  optionsPaisaje.hidden  = type !== 'paisaje';
  optionsRemoveBg.hidden = type !== 'remove-bg';

  const hints = {
    logo: 'SVG, PNG, JPG — máx. 20 MB',
    retrato: 'JPG, PNG, WebP — máx. 20 MB',
    paisaje: 'JPG, PNG, WebP — máx. 20 MB',
    'remove-bg': 'PNG, JPG, WebP — máx. 20 MB',
  };
  formatHint.textContent = hints[type] || hints.logo;
}

retratoQuality.addEventListener('input', () => retratoQualityVal.textContent = retratoQuality.value);
paisajeQuality.addEventListener('input', () => paisajeQualityVal.textContent = paisajeQuality.value);

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  state.file = file;
  state.svgText = null;
  state.fileDataURL = null;

  const isSVG = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
  const reader = new FileReader();
  reader.onload = e => {
    state.fileDataURL = e.target.result;
    if (isSVG) {
      state.svgText = e.target.result;
      previewImg.src = `data:image/svg+xml;base64,${toBase64(e.target.result)}`;
    } else {
      previewImg.src = e.target.result;
    }

    previewWrap.hidden = false;
    fileMeta.innerHTML = `
      <div><span class="badge">${file.type || 'image/svg+xml'}</span></div>
      <div>Nombre: <span>${file.name}</span></div>
      <div>Tamaño: <span>${formatBytes(file.size)}</span></div>
    `;
    convertBtn.disabled = false;
    resetResults();
  };

  if (isSVG) reader.readAsText(file);
  else reader.readAsDataURL(file);
}

convertBtn.addEventListener('click', async () => {
  convertBtn.disabled = true;
  showProgress(10, 'Preparando...');
  resultsSection.hidden = true;
  resultsGrid.innerHTML = '';

  try {
    if (state.type === 'logo') await convertLogo();
    else if (state.type === 'retrato') await convertPhoto('retrato');
    else if (state.type === 'paisaje') await convertPhoto('paisaje');
    else await convertRemoveBg();
  } catch (err) {
    console.error(err);
    showProgress(0, `Error: ${err.message}`);
  } finally {
    convertBtn.disabled = false;
  }
});

async function convertLogo() {
  showProgress(20, 'Procesando logo...');
  const output = document.getElementById('logoOutput').value;
  const inline = document.getElementById('logoInline').checked;
  const results = [];
  const isSVG = state.svgText !== null;

  if (output === 'svg-min' && isSVG) {
    showProgress(50, 'Minificando SVG...');
    const minSVG = minifySVG(state.svgText);
    const minBlob = new Blob([minSVG], { type: 'image/svg+xml' });
    results.push({
      label: 'SVG Minificado', mimeType: 'image/svg+xml', blob: minBlob, ext: 'svg',
      originalSize: state.file.size, finalSize: minBlob.size,
      previewSrc: `data:image/svg+xml;base64,${toBase64(minSVG)}`,
      code: inline ? svgInlineCode(minSVG) : null,
    });
  }

  if (output === 'base64-svg' && isSVG) {
    showProgress(50, 'Codificando SVG a Base64...');
    const minSVG = minifySVG(state.svgText);
    const b64 = `data:image/svg+xml;base64,${toBase64(minSVG)}`;
    results.push({
      label: 'SVG → Base64 Data URI', mimeType: 'text/plain', text: b64,
      originalSize: state.file.size, finalSize: b64.length,
      previewSrc: b64, code: inline ? `<img src="${b64}" alt="logo" />` : b64,
    });
  }

  if (output === 'base64-png') {
    showProgress(40, 'Renderizando a PNG...');
    const { dataURL } = await renderToFormat('image/png', 1);
    results.push({
      label: 'PNG → Base64 Data URI', mimeType: 'text/plain', text: dataURL,
      originalSize: state.file.size, finalSize: dataURL.length,
      previewSrc: dataURL, code: inline ? `<img src="${dataURL}" alt="logo" />` : dataURL,
    });
  }

  showProgress(90, 'Generando resultados...');
  renderResults(results);
  showProgress(100, 'Listo');
}

async function convertPhoto(mode) {
  const isRetrato = mode === 'retrato';
  const formatSel = isRetrato ? document.getElementById('retratoFormat').value : document.getElementById('paisajeFormat').value;
  const quality = parseInt(isRetrato ? document.getElementById('retratoQuality').value : document.getElementById('paisajeQuality').value) / 100;
  const genBase64 = isRetrato ? document.getElementById('retratoBase64').checked : false;
  const genPlaceholder = !isRetrato ? document.getElementById('paisajePlaceholder').checked : false;
  const maxWidth = !isRetrato ? parseInt(document.getElementById('paisajeMaxWidth').value) : 99999;

  const results = [];
  const mime = formatSel === 'webp' ? 'image/webp' : 'image/jpeg';
  const ext = formatSel === 'webp' ? 'webp' : 'jpg';

  showProgress(30, `Convirtiendo a ${formatSel.toUpperCase()}...`);
  const { blob, dataURL, width, height } = await renderToFormat(mime, quality, maxWidth);

  results.push({
    label: `${isRetrato ? 'Retrato' : 'Paisaje'} → ${formatSel.toUpperCase()}`,
    mimeType: mime, blob, ext, originalSize: state.file.size, finalSize: blob.size,
    previewSrc: dataURL, dims: `${width}×${height}px`, code: null,
  });

  if (genBase64) {
    showProgress(60, 'Generando Base64...');
    results.push({
      label: `Base64 Data URI (${formatSel.toUpperCase()})`, mimeType: 'text/plain', text: dataURL,
      originalSize: blob.size, finalSize: dataURL.length, previewSrc: dataURL,
      code: `<img src="${dataURL}" alt="retrato" />`,
    });
  }

  if (genPlaceholder) {
    showProgress(75, 'Generando placeholder blur-up...');
    const { dataURL: phURL } = await renderToFormat('image/jpeg', 0.5, 20);
    results.push({
      label: 'Placeholder Base64 Blur-up (20px)', mimeType: 'text/plain', text: phURL,
      originalSize: blob.size, finalSize: phURL.length, previewSrc: phURL,
      code: placeholderCode(phURL, ext), isPlaceholder: true,
    });
  }

  showProgress(95, 'Renderizando resultados...');
  renderResults(results);
  showProgress(100, 'Listo ✅');
}

async function convertRemoveBg() {
  showProgress(20, 'Cargando modelo de eliminación de fondo...');
  const output = document.getElementById('removeBgOutput').value;
  const showCompare = document.getElementById('removeBgPreview').checked;

  if (!state.file) throw new Error('No hay archivo cargado');

  showProgress(45, 'Eliminando fondo...');
  const resultBlob = await removeBackground(state.file, {
    progress: key => {
      if (typeof key === 'string') progressText.textContent = `Modelo: ${key}`;
    }
  });

  const resultDataURL = await blobToDataURL(resultBlob);
  const results = [];

  results.push({
    label: 'PNG transparente sin fondo',
    mimeType: 'image/png',
    blob: resultBlob,
    ext: 'png',
    originalSize: state.file.size,
    finalSize: resultBlob.size,
    previewSrc: resultDataURL,
    code: null,
    compareBeforeAfter: showCompare ? { before: state.fileDataURL, after: resultDataURL } : null,
  });

  if (output === 'png-base64') {
    showProgress(80, 'Generando Base64...');
    results.push({
      label: 'PNG transparente → Base64 Data URI',
      mimeType: 'text/plain',
      text: resultDataURL,
      originalSize: resultBlob.size,
      finalSize: resultDataURL.length,
      previewSrc: resultDataURL,
      code: `<img src="${resultDataURL}" alt="imagen sin fondo" />`,
    });
  }

  showProgress(95, 'Preparando resultados...');
  renderResults(results);
  showProgress(100, 'Fondo eliminado ✅');
}

function renderToFormat(mime, quality, maxWidth = 99999) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Canvas toBlob falló'));
        const reader = new FileReader();
        reader.onload = e => resolve({ blob, dataURL: e.target.result, width: w, height: h });
        reader.readAsDataURL(blob);
      }, mime, quality);
    };
    img.onerror = reject;
    img.src = state.fileDataURL;
  });
}

function minifySVG(svg) {
  return svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s*([={}();:,])\s*/g, '$1')
    .replace(/\s+\/>/g, '/>')
    .replace(/^\s+|\s+$/g, '');
}

function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function svgInlineCode(svg) {
  return `<!-- SVG inline optimizado -->\n${svg}`;
}

function placeholderCode(placeholder, ext) {
  return `<!-- Blur-up placeholder pattern -->
<div class="img-wrap" style="position:relative">
  <img src="${placeholder}" style="filter:blur(8px);transform:scale(1.05);width:100%" aria-hidden="true" />
  <img src="imagen.${ext}" loading="lazy" style="position:absolute;inset:0;width:100%;opacity:0;transition:opacity .4s" onload="this.style.opacity=1;this.previousSibling.style.display='none'" alt="paisaje" />
</div>`;
}

function renderResults(results) {
  resultsGrid.innerHTML = '';
  results.forEach((r, i) => {
    const saving = r.originalSize && r.finalSize ? Math.round((1 - r.finalSize / r.originalSize) * 100) : null;
    const savingLabel = saving !== null ? (saving > 0 ? `−${saving}% tamaño` : `+${Math.abs(saving)}% (Base64 overhead)`) : '';
    const savingClass = saving !== null && saving < 0 ? 'warn' : '';

    const compareHtml = r.compareBeforeAfter ? `
      <div class="compare-row">
        <div class="compare-card">
          <span>Antes</span>
          <img src="${r.compareBeforeAfter.before}" alt="antes" loading="lazy" />
        </div>
        <div class="compare-card">
          <span>Después</span>
          <img src="${r.compareBeforeAfter.after}" alt="después" loading="lazy" />
        </div>
      </div>
    ` : `
      <div class="result-preview">
        <img src="${r.previewSrc}" alt="preview ${r.label}" loading="lazy" />
      </div>
    `;

    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      ${compareHtml}
      <div class="result-info">
        <h3>${r.label}</h3>
        <div class="result-stats">
          ${r.dims ? `<span class="stat">${r.dims}</span>` : ''}
          ${r.finalSize ? `<span class="stat">${formatBytes(r.finalSize)}</span>` : ''}
          ${savingLabel ? `<span class="stat ${savingClass}">${savingLabel}</span>` : ''}
          ${r.isPlaceholder ? '<span class="stat">~20px thumbnail</span>' : ''}
        </div>
        <div class="result-actions">
          ${r.blob ? `<button class="btn-sm primary" data-action="download" data-index="${i}">⬇ Descargar</button>` : ''}
          ${r.text || r.code ? `<button class="btn-sm" data-action="copy" data-index="${i}">📋 Copiar</button>` : ''}
          ${r.code ? `<button class="btn-sm" data-action="toggle" data-index="${i}">< > Ver código</button>` : ''}
        </div>
        ${r.code ? `<pre class="code-block" id="code-${i}">${escapeHtml(r.code)}</pre>` : ''}
      </div>
    `;
    resultsGrid.appendChild(item);
  });

  window.__results = results;
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

resultsGrid.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const i = Number(btn.dataset.index);
  const action = btn.dataset.action;
  const r = window.__results?.[i];
  if (!r) return;

  if (action === 'download' && r.blob) {
    const url = URL.createObjectURL(r.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized_${state.file.name.replace(/\.[^.]+$/, '')}.${r.ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  if (action === 'copy') {
    const text = r.code || r.text || '';
    await navigator.clipboard.writeText(text);
    const old = btn.textContent;
    btn.textContent = '✅ Copiado';
    setTimeout(() => btn.textContent = old, 2000);
  }

  if (action === 'toggle') {
    const block = document.getElementById(`code-${i}`);
    if (block) block.style.display = block.style.display === 'block' ? 'none' : 'block';
  }
});

function showProgress(pct, msg) {
  progressWrap.hidden = false;
  progressBar.style.setProperty('--progress', pct + '%');
  progressText.textContent = msg;
  if (pct >= 100) setTimeout(() => { progressWrap.hidden = true; }, 1500);
}

function resetResults() {
  resultsSection.hidden = true;
  resultsGrid.innerHTML = '';
  progressWrap.hidden = true;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

switchOptions('logo');
