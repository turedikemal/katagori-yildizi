/**
 * Kategori Yıldızı - Reactive Admin State & Live Preview Engine
 * Full-scale SaaS Control Center
 */
(function() {
  'use strict';

  // SVG Icons
  const ICONS = {
    ribbon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/><path d="m8.21 13.89-1.96 7.61 5.75-3.05 5.75 3.05-1.96-7.61"/></svg>`,
    medal: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    cup: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"/><path d="M6 3h12v7a6 6 0 0 1-12 0V3Z"/></svg>`,
    crown: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`,
    star: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    check: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    trend: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    fire: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    award: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    leaf: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`
  };

  // State Management
  let state = {
    isDirty: false,
    device: 'desktop', // desktop | mobile
    viewMode: 'category', // category | pdp | single
    activeSubpanel: null,
    selectedCategoryIndex: 0,
    categoriesData: [],
    customTemplates: [],
    undoStack: [],
    redoStack: [],
    config: null
  };

  const API_BASE = window.location.origin;

  // Initialize
  async function init() {
    setupEventListeners();
    await loadInitialSettings();
    renderSubpanelNav();
    updateLivePreview();
  }

  // Load from Server
  async function loadInitialSettings() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`);
      const data = await res.json();
      if (data.success) {
        state.config = data.draftConfig;
        state.categoriesData = data.categories || [];
        state.isDirty = data.hasUnpublishedChanges || false;
        updateStatusDot();
        populateFormFields();
        renderCategoriesList();
      }
    } catch (e) {
      console.warn('Using local fallback state:', e);
      state.config = getFallbackConfig();
      populateFormFields();
    }
  }

  function getFallbackConfig() {
    return {
      templateId: 'sage-ribbon',
      ranking: { period: '30days', metric: 'quantity', maxRank: 3, excludeOutOfStock: true, excludeRefunded: true, minSalesThreshold: 3 },
      placements: { categoryCards: true, productDetail: true, cardLocation: 'image_bottom_bar', detailLocation: 'under_title', ninePointPosition: 'bottom_center', offsetX: 0, offsetY: 0 },
      styling: { fontFamily: 'Bricolage Grotesque', bgColor: '#3b4d47', textColor: '#ffffff', gradientEnabled: false, gradient: 'linear-gradient(135deg, #70d6ff, #ffd670, #ff70a6)', borderColor: 'transparent', borderWidth: 0, borderStyle: 'solid', borderRadius: 4, shadow: 'none', opacity: 100, paddingX: 10, paddingY: 5, scale: 100, rotation: 0 },
      texts: { lang: 'tr', rank1Text: 'En Çok Satan 1. Ürün', rank2Text: 'En Çok Satan 2. Ürün', rank3Text: 'En Çok Satan 3. Ürün', pdpPrefixText: '{category} Kategorisinde', pdpBadgeText: 'En çok satan #{rank}. ürün >' },
      icon: { enabled: true, type: 'ribbon', size: 14, color: '#ffffff', customSvg: '' },
      animation: { entry: 'fade', hover: 'lift', speed: 'normal', durationMs: 300 },
      responsive: { desktopEnabled: true, mobileEnabled: true, mobileFontSizeOffset: -1, mobileBadgeScale: 92, mobilePaddingX: 8, mobilePaddingY: 4 },
      rules: { hideIfRankAbove: 3, hideIfDiscounted: false, hideIfNewProduct: false, excludedProducts: [], excludedCategories: [] }
    };
  }

  // Push State to Undo Stack
  function pushUndo() {
    state.undoStack.push(JSON.stringify(state.config));
    if (state.undoStack.length > 30) state.undoStack.shift();
    state.redoStack = [];
    markDirty();
  }

  function markDirty() {
    state.isDirty = true;
    updateStatusDot();
  }

  function updateStatusDot() {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    if (state.isDirty) {
      dot.className = 'ky-status-dot dirty';
      text.innerText = 'Yayınlanmamış değişiklikler var';
    } else {
      dot.className = 'ky-status-dot';
      text.innerText = 'Tüm değişiklikler yayında';
    }
  }

  // Real-time Event Listeners
  function setupEventListeners() {
    // Device switch
    document.querySelectorAll('.ky-device-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ky-device-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.device = btn.dataset.device;
        const canvas = document.getElementById('stageCanvas');
        if (state.device === 'mobile') {
          canvas.classList.add('mobile-view');
        } else {
          canvas.classList.remove('mobile-view');
        }
        updateLivePreview();
      });
    });

    // View mode tabs
    document.querySelectorAll('.ky-view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ky-view-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.viewMode = tab.dataset.view;
        updateLivePreview();
      });
    });

    // Category Selector in preview
    const catSelect = document.getElementById('previewCategorySelect');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        state.selectedCategoryIndex = parseInt(e.target.value) || 0;
        updateLivePreview();
      });
    }

    // Bottom Bar Actions
    document.getElementById('btnSaveDraft').addEventListener('click', saveDraft);
    document.getElementById('btnPublish').addEventListener('click', publishSettings);
    document.getElementById('btnCopyCode').addEventListener('click', copyEmbedCode);

    // Undo / Redo
    document.getElementById('btnUndo').addEventListener('click', () => {
      if (state.undoStack.length > 0) {
        state.redoStack.push(JSON.stringify(state.config));
        state.config = JSON.parse(state.undoStack.pop());
        populateFormFields();
        updateLivePreview();
        showToast('Geri alındı');
      }
    });

    document.getElementById('btnRedo').addEventListener('click', () => {
      if (state.redoStack.length > 0) {
        state.undoStack.push(JSON.stringify(state.config));
        state.config = JSON.parse(state.redoStack.pop());
        populateFormFields();
        updateLivePreview();
        showToast('Yinelendi');
      }
    });

    // Reset to Default
    document.getElementById('btnResetDefault').addEventListener('click', () => {
      if (confirm('Tüm ayarları varsayılana döndürmek istediğinize emin misiniz?')) {
        pushUndo();
        state.config = getFallbackConfig();
        populateFormFields();
        updateLivePreview();
        showToast('Varsayılana dönüldü');
      }
    });
  }

  // Populate Form Controls from state.config
  function populateFormFields() {
    const c = state.config;
    if (!c) return;

    // Styling
    setVal('cfgBgColor', c.styling.bgColor);
    setVal('cfgBgColorHex', c.styling.bgColor);
    setVal('cfgTextColor', c.styling.textColor);
    setVal('cfgTextColorHex', c.styling.textColor);
    setVal('cfgBorderRadius', c.styling.borderRadius);
    setVal('cfgBorderWidth', c.styling.borderWidth);
    setVal('cfgPaddingX', c.styling.paddingX);
    setVal('cfgPaddingY', c.styling.paddingY);
    setVal('cfgOpacity', c.styling.opacity);
    setVal('cfgScale', c.styling.scale);
    setVal('cfgFontFamily', c.styling.fontFamily);

    // Texts
    setVal('cfgRank1Text', c.texts.rank1Text);
    setVal('cfgRank2Text', c.texts.rank2Text);
    setVal('cfgRank3Text', c.texts.rank3Text);
    setVal('cfgPdpPrefix', c.texts.pdpPrefixText);
    setVal('cfgPdpBadge', c.texts.pdpBadgeText);

    // Ranking
    setVal('cfgPeriod', c.ranking.period);
    setVal('cfgMetric', c.ranking.metric);
    setVal('cfgMaxRank', c.ranking.maxRank);

    // Position
    setVal('cfgCardLocation', c.placements.cardLocation);
    setVal('cfgOffsetX', c.placements.offsetX);
    setVal('cfgOffsetY', c.placements.offsetY);

    // Icon & Animation
    setVal('cfgIconType', c.icon.type);
    setVal('cfgIconSize', c.icon.size);
    setVal('cfgAnimEntry', c.animation.entry);
    setVal('cfgAnimHover', c.animation.hover);
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) {
      if (el.type === 'checkbox') el.checked = Boolean(val);
      else el.value = val;
      const numSpan = document.querySelector(`span[data-bind="${id}"]`);
      if (numSpan) numSpan.innerText = val;
    }
  }

  // Bind live form changes to state & preview
  window.handleInput = function(keyPath, value, bindSpanId) {
    pushUndo();
    const parts = keyPath.split('.');
    let target = state.config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]]) target[parts[i]] = {};
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;

    if (bindSpanId) {
      const sp = document.querySelector(`span[data-bind="${bindSpanId}"]`);
      if (sp) sp.innerText = value;
    }

    updateLivePreview();
  };

  // Color Sync Helpers
  window.syncColor = function(pickerId, hexId, keyPath) {
    const picker = document.getElementById(pickerId);
    const hex = document.getElementById(hexId);
    if (picker && hex) {
      picker.addEventListener('input', (e) => {
        hex.value = e.target.value;
        window.handleInput(keyPath, e.target.value);
      });
      hex.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          picker.value = e.target.value;
          window.handleInput(keyPath, e.target.value);
        }
      });
    }
  };

  // Template Selection
  window.selectTemplate = function(tplId) {
    pushUndo();
    state.config.templateId = tplId;
    document.querySelectorAll('.ky-tpl-card').forEach(c => {
      if (c.dataset.tpl === tplId) c.classList.add('active');
      else c.classList.remove('active');
    });

    // Apply template signature defaults
    if (tplId === 'sage-ribbon') {
      state.config.styling.bgColor = '#3b4d47';
      state.config.styling.textColor = '#ffffff';
      state.config.styling.borderRadius = 4;
      state.config.placements.cardLocation = 'image_bottom_bar';
    } else if (tplId === 'gradient-pill') {
      state.config.styling.bgColor = '#ffffff';
      state.config.styling.textColor = '#111111';
      state.config.styling.borderRadius = 24;
      state.config.styling.borderWidth = 1.5;
    } else if (tplId === 'luxury-gold') {
      state.config.styling.bgColor = '#111827';
      state.config.styling.textColor = '#fef08a';
      state.config.styling.borderColor = '#eab308';
      state.config.styling.borderWidth = 1;
      state.config.styling.borderRadius = 2;
    } else if (tplId === 'fire-trending') {
      state.config.styling.bgColor = '#ea580c';
      state.config.styling.textColor = '#ffffff';
      state.config.icon.type = 'fire';
    }
    populateFormFields();
    updateLivePreview();
    showToast(`"${tplId}" şablonu uygulandı`);
  };

  // 9-Point Grid Selector
  window.selectGridPos = function(pos) {
    pushUndo();
    state.config.placements.ninePointPosition = pos;
    document.querySelectorAll('.ky-grid-btn').forEach(btn => {
      if (btn.dataset.pos === pos) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    updateLivePreview();
  };

  // Render Subpanel Navigation
  function renderSubpanelNav() {
    document.querySelectorAll('.ky-menu-card').forEach(card => {
      card.addEventListener('click', () => {
        const targetId = card.dataset.target;
        openSubpanel(targetId);
      });
    });

    document.querySelectorAll('.ky-btn-back').forEach(btn => {
      btn.addEventListener('click', () => {
        closeSubpanels();
      });
    });
  }

  function openSubpanel(panelId) {
    document.getElementById('menuList').style.display = 'none';
    document.querySelectorAll('.ky-subpanel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(panelId);
    if (target) {
      target.classList.add('active');
      state.activeSubpanel = panelId;
    }
  }

  function closeSubpanels() {
    document.querySelectorAll('.ky-subpanel').forEach(p => p.classList.remove('active'));
    document.getElementById('menuList').style.display = 'flex';
    state.activeSubpanel = null;
  }

  // UPDATE LIVE PREVIEW (Real-time HTML & CSS Injection)
  function updateLivePreview() {
    const c = state.config;
    if (!c) return;

    const canvas = document.getElementById('stageCanvas');
    const currCat = state.categoriesData[state.selectedCategoryIndex] || {
      name: "Mutfak Dekorasyonu",
      products: [
        { id: "p1", name: "El Yapımı Seramik Meyve Sepeti", rank: 1, price: "850 TL", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&auto=format&fit=crop&q=60" },
        { id: "p2", name: "Adaçayı Yeşili Sunum Tabağı", rank: 2, price: "420 TL", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&auto=format&fit=crop&q=60" },
        { id: "p3", name: "Ham Dokulu Seramik Fincan", rank: 3, price: "320 TL", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60" }
      ]
    };

    // Calculate Dynamic CSS Variables
    const styleBlock = document.getElementById('kyPreviewDynamicStyles') || document.createElement('style');
    styleBlock.id = 'kyPreviewDynamicStyles';
    styleBlock.innerHTML = `
      #stageCanvas {
        --ky-primary-bg: ${c.styling.bgColor};
        --ky-primary-text: ${c.styling.textColor};
        --ky-border-color: ${c.styling.borderColor};
        --ky-border-width: ${c.styling.borderWidth}px;
        --ky-border-radius: ${c.styling.borderRadius}px;
        --ky-font-family: '${c.styling.fontFamily}', sans-serif;
        --ky-padding-x: ${state.device === 'mobile' ? (c.styling.paddingX - 2) : c.styling.paddingX}px;
        --ky-padding-y: ${state.device === 'mobile' ? (c.styling.paddingY - 1) : c.styling.paddingY}px;
        --ky-scale: ${(c.styling.scale || 100) / 100};
        --ky-opacity: ${(c.styling.opacity || 100) / 100};
        --ky-anim-dur: ${c.animation.durationMs || 300}ms;
      }
    `;
    if (!document.getElementById('kyPreviewDynamicStyles')) document.head.appendChild(styleBlock);

    const iconSvg = c.icon.enabled && ICONS[c.icon.type] ? ICONS[c.icon.type] : (c.icon.type === 'custom_svg' ? c.icon.customSvg : '');
    const tplClass = `ky-tpl-${c.templateId || 'sage-ribbon'}`;
    const animClass = `ky-anim-${c.animation.entry || 'fade'} ky-hover-${c.animation.hover || 'lift'}`;

    if (state.viewMode === 'pdp') {
      // Render Product Detail Page
      const p = currCat.products[0];
      canvas.innerHTML = `
        <div class="ky-mock-pdp">
          <div class="ky-pdp-gallery">
            <img src="${p.image}" alt="${p.name}">
          </div>
          <div class="ky-pdp-info">
            <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px;">THE GOATZ STUDIO</span>
            <h1 class="ky-pdp-h1">${p.name}</h1>
            
            <div class="ky-tpl-category-context ${animClass}" style="margin: 8px 0 16px 0;">
              <a href="#" class="ky-cat-anchor">
                ${iconSvg}
                <span>${c.texts.pdpPrefixText.replace('{category}', currCat.name)}</span>
              </a>
              <div class="ky-pill-part">
                ${ICONS.check}
                <span>${c.texts.pdpBadgeText.replace('{rank}', p.rank).replace('{category}', currCat.name)}</span>
              </div>
            </div>

            <div class="ky-pdp-price">${p.price}</div>
            <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
              Çanakkale stüdyomuzda elde şekillendirilen, gıdaya uygun doğal sırla fırınlanan özel koleksiyon ürünüdür.
            </p>
            <button class="ky-pdp-btn">Sepete Ekle</button>
          </div>
        </div>
      `;
    } else {
      // Render Category Product Grid
      let cardsHtml = '';
      currCat.products.slice(0, 3).forEach((prod, i) => {
        const rank = prod.rank;
        const text = rank === 1 ? c.texts.rank1Text : (rank === 2 ? c.texts.rank2Text : c.texts.rank3Text);
        
        let badgeHtml = `
          <div class="ky-badge-root ${tplClass} ${animClass}">
            ${iconSvg}
            <span>${text}</span>
          </div>
        `;

        let posClass = 'ky-pos-bottom-full';
        if (c.placements.cardLocation === 'image_corner') posClass = 'ky-pos-top-left';
        else if (c.placements.cardLocation === 'nine_point') posClass = `ky-pos-${c.placements.ninePointPosition.replace('_', '-')}`;

        cardsHtml += `
          <div class="ky-mock-card">
            <div class="ky-mock-img-wrap ky-pos-parent">
              <img src="${prod.image}" alt="${prod.name}">
              <div class="${posClass}" style="transform: translate(${c.placements.offsetX}px, ${c.placements.offsetY}px);">
                ${badgeHtml}
              </div>
            </div>
            <div class="ky-mock-details">
              <div class="ky-mock-title">${prod.name}</div>
              <div class="ky-mock-price">${prod.price}</div>
            </div>
          </div>
        `;
      });

      canvas.innerHTML = `
        <div style="margin-bottom: 18px;">
          <h2 style="font-size: 18px; font-weight: 800; color: #0f172a;">${currCat.name}</h2>
          <span style="font-size: 12px; color: #64748b;">${currCat.products.length} ürün listeleniyor</span>
        </div>
        <div class="ky-mock-grid">
          ${cardsHtml}
        </div>
      `;
    }
  }

  // Render Categories in Subpanel
  function renderCategoriesList() {
    const list = document.getElementById('categoriesListContainer');
    if (!list) return;
    let html = '';
    state.categoriesData.forEach((cat, idx) => {
      html += `
        <div class="ky-group">
          <div class="ky-group-title">
            <span>📁 ${cat.name}</span>
            <span style="font-size: 11px; color: #243a8b; font-weight: 600;">${cat.products.length} Ürün</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${cat.products.map(p => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: #f8fafc; border-radius: 6px; font-size: 12px;">
                <span style="font-weight: 600; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  #${p.rank} - ${p.name}
                </span>
                <div style="display: flex; gap: 4px;">
                  <button class="ky-btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="pinProduct('${cat.id}', '${p.id}', 1)">#1 Sabitle</button>
                  <button class="ky-btn-secondary" style="padding: 2px 6px; font-size: 10px; color: #ef4444;" onclick="hideProduct('${cat.id}', '${p.id}')">Gizle</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
    list.innerHTML = html;
  }

  window.pinProduct = function(catId, prodId, rank) {
    fetch(`${API_BASE}/api/admin/categories/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: catId, productId: prodId, manualRank: rank })
    }).then(() => {
      showToast('Ürün 1. sıraya sabitlendi');
      loadInitialSettings();
    });
  };

  window.hideProduct = function(catId, prodId) {
    fetch(`${API_BASE}/api/admin/categories/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: catId, productId: prodId, hidden: true })
    }).then(() => {
      showToast('Rozet gizlendi');
      loadInitialSettings();
    });
  };

  // Save Draft
  async function saveDraft() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: state.config })
      });
      const data = await res.json();
      if (data.success) {
        state.isDirty = true;
        updateStatusDot();
        showToast('Ayarlar taslak olarak kaydedildi');
      }
    } catch (e) {
      showToast('Taslak kaydedildi (Yerel)');
    }
  }

  // Publish to Storefront
  async function publishSettings() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: state.config })
      });
      const data = await res.json();
      if (data.success) {
        state.isDirty = false;
        updateStatusDot();
        showToast('🎉 Canlı Mağazada Başarıyla Yayınlandı!');
      }
    } catch (e) {
      state.isDirty = false;
      updateStatusDot();
      showToast('Yayınlandı (Yerel mod)');
    }
  }

  // Copy Storefront Embed Script
  function copyEmbedCode() {
    const code = `<link rel="stylesheet" href="${API_BASE}/widget.css">\n<script src="${API_BASE}/widget.js" defer></script>`;
    navigator.clipboard.writeText(code).then(() => {
      showToast('📋 Storefront kodu panoya kopyalandı!');
    });
  }

  function showToast(msg) {
    let t = document.getElementById('kyToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'kyToast';
      t.className = 'ky-toast';
      document.body.appendChild(t);
    }
    t.innerText = msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3000);
  }

  // Run when DOM ready
  document.addEventListener('DOMContentLoaded', init);
})();
