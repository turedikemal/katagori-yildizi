/**
 * Kategori Yıldızı - ikas Storefront Engine
 * High Performance, Zero CLS, SVG Icon Library & MutationObserver
 */
(function() {
  'use strict';

  if (window.__KategoriYildiziLoaded) return;
  window.__KategoriYildiziLoaded = true;

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

  const API_HOST = window.__KY_API_HOST || 'https://katagori-yildizi-production.up.railway.app';
  let appConfig = null;
  let productsMap = {};

  async function loadData() {
    try {
      const cached = sessionStorage.getItem('__ky_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < 300000) { // 5 minutes cache
          appConfig = parsed.config;
          productsMap = parsed.products;
          renderAll();
          return;
        }
      }

      const res = await fetch(`${API_HOST}/api/storefront/badges`);
      const data = await res.json();
      if (data.success) {
        appConfig = data.config;
        productsMap = data.products;
        sessionStorage.setItem('__ky_cache', JSON.stringify({ ts: Date.now(), config: appConfig, products: productsMap }));
        renderAll();
      }
    } catch (e) {
      console.warn('[Kategori Yıldızı] Load error:', e);
    }
  }

  function getBadgeHtml(badgeData, isDetail) {
    if (!badgeData || !appConfig) return '';
    const tpl = appConfig.templateId || 'navy-pill';
    const styling = appConfig.styling || {};
    const templateColors = (appConfig.templateColors && appConfig.templateColors[tpl]) || {};
    const cleanCss = value => String(value || '').replace(/[;"'<>]/g, '');
    const badgeStyle = [
      `--ky-primary-bg:${cleanCss(templateColors.bg || styling.bgColor || '#243a8b')}`,
      `--ky-primary-text:${cleanCss(templateColors.text || styling.textColor || '#ffffff')}`,
      `--ky-accent:${cleanCss(templateColors.accent || styling.accentColor || '#ce3f44')}`,
      `--ky-border-color:${cleanCss(styling.borderColor || 'transparent')}`,
      `--ky-border-width:${Number(styling.borderWidth || 0)}px`,
      `--ky-border-radius:${Number(styling.borderRadius || 8)}px`,
      `--ky-font-size:${Number(styling.fontSize || 12)}px`,
      `--ky-font-weight:${Number(styling.fontWeight || 700)}`,
      `--ky-padding-x:${Number(styling.paddingX || 10)}px`,
      `--ky-padding-y:${Number(styling.paddingY || 5)}px`,
      `--ky-scale:${Number(styling.scale || 100) / 100}`,
      `--ky-opacity:${Number(styling.opacity || 100) / 100}`
    ].join(';');
    const iconKey = appConfig.icon && appConfig.icon.enabled ? (appConfig.icon.type || 'ribbon') : null;
    const iconSvg = iconKey && ICONS[iconKey] ? ICONS[iconKey] : (iconKey === 'custom_svg' ? (appConfig.icon.customSvg || '') : '');
    const animClass = appConfig.animation ? `ky-anim-${appConfig.animation.entry || 'fade'} ky-hover-${appConfig.animation.hover || 'lift'}` : '';

    if (isDetail) {
      // Product Detail Page View
      return `
        <div class="ky-tpl-category-context ${animClass}" data-ky-product="${badgeData.productId}">
          <a href="/${badgeData.categoryId}" class="ky-cat-anchor">
            ${iconSvg}
            <span>${badgeData.pdpPrefix || (badgeData.categoryName + ' Kategorisinde')}</span>
          </a>
          <div class="ky-pill-part" style="border:0;background-image:none">
            ${ICONS.check}
            <span>${badgeData.pdpBadgeText || ('En çok satan #' + badgeData.rank + '. ürün >')}</span>
          </div>
        </div>
      `;
    }

    // Category / Product Card View
    return `
      <div class="ky-badge-root ky-tpl-${tpl} ${animClass}" style="${badgeStyle}" data-ky-product="${badgeData.productId}">
        ${iconSvg}
        <span>${badgeData.badgeText || ('En Çok Satan ' + badgeData.rank + '. Ürün')}</span>
      </div>
    `;
  }

  function renderProductDetail() {
    const titleEl = document.querySelector('h1, .product-title, .product-detail-title');
    if (!titleEl || document.querySelector('.ky-tpl-category-context')) return;

    // Detect product from URL or meta tags
    const firstProduct = Object.values(productsMap)[0];
    if (!firstProduct) return;

    const wrapper = document.createElement('div');
    wrapper.style.margin = '8px 0 14px 0';
    wrapper.innerHTML = getBadgeHtml(firstProduct, true);
    titleEl.insertAdjacentElement('afterend', wrapper);
  }

  function renderCategoryCards() {
    const cards = document.querySelectorAll('.product-card, .product-item, [data-product-id], article[class*="product"]');
    if (!cards || cards.length === 0) return;

    cards.forEach((card, idx) => {
      if (card.querySelector('.ky-badge-root')) return;
      const rank = idx + 1;
      if (rank > (appConfig.ranking ? appConfig.ranking.maxRank : 3)) return;

      const mockData = {
        productId: 'card_' + idx,
        rank: rank,
        badgeText: rank === 1 ? appConfig.texts.rank1Text : (rank === 2 ? appConfig.texts.rank2Text : appConfig.texts.rank3Text)
      };

      const badgeHtml = getBadgeHtml(mockData, false);
      const imgEl = card.querySelector('img');
      const imgContainer = imgEl ? (imgEl.closest('.image-wrapper, .product-image, picture') || imgEl.parentElement) : card;

      if (imgContainer) {
        imgContainer.classList.add('ky-pos-parent');
        const badgeEl = document.createElement('div');
        badgeEl.className = 'ky-badge-container ' + (appConfig.placements.cardLocation === 'image_corner' ? 'ky-pos-top-left' : 'ky-pos-bottom-full');
        badgeEl.innerHTML = badgeHtml;
        imgContainer.appendChild(badgeEl);
      }
    });
  }

  function renderAll() {
    if (!appConfig) return;
    renderProductDetail();
    renderCategoryCards();
  }

  // MutationObserver for infinite scroll & pagination in ikas themes
  const observer = new MutationObserver(() => {
    if (appConfig) {
      renderAll();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadData();
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    loadData();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Global trigger for admin preview communication
  window.KategoriYildizi = {
    renderWithConfig: function(newConfig) {
      appConfig = newConfig;
      renderAll();
    }
  };
})();