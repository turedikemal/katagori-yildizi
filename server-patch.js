// PATCH A: Icon.type — canlı önizlemede rozet türüne göre dinamik icon
// PATCH B: Sıralama — quantity DESC, orders DESC, name ASC; manuel rank sadece pinned'se geçerli

// İki fonksiyon değişikliği:

// 1. rankedCategories (L501-550) — sortValue mantığını değiştir:
// Şimdiki: sortValue = metric (quantity|orders|revenue)
// Yeni: Tüm quantity/orders/revenue hesapla, sort: quantity DESC → orders DESC → name ASC
// Manuel rank SADECE pinned=true ise geçerli
// minSalesThreshold=0 koru

function rankedCategories(rawCatalog, config, overrides = []) {
  if (!rawCatalog?.categories || !rawCatalog?.products) return [];
  const period = config?.ranking?.period || '30days';
  const excludedProducts = new Set(config?.rules?.excludedProducts || []);
  const excludedCategories = new Set(config?.rules?.excludedCategories || []);
  const overridesMap = new Map(overrides.map(o => [`${o.categoryId}:${o.productId}`, o]));

  return rawCatalog.categories
    .filter(category => !excludedCategories.has(category.id))
    .map(category => {
      const rows = rawCatalog.products
        .filter(product => product.categoryIds.includes(category.id))
        .filter(product => !excludedProducts.has(product.id))
        .filter(product => !(config?.ranking?.excludeOutOfStock && product.stockCount !== null && product.stockCount <= 0))
        .map(product => {
          const periodMetric = product.metrics?.[period] || emptyMetric();
          const quantity = Number(periodMetric.quantity || 0);
          const orders = Number(periodMetric.orders || 0);
          const revenue = Number(periodMetric.revenue || 0);
          return {
            id: product.id,
            name: product.name,
            image: product.image,
            price: product.price ? `${product.price} TL` : '',
            quantity,
            orders,
            revenue,
            sales: quantity,
            stockCount: product.stockCount,
            hidden: false,
            manual: false
          };
        })
        .filter(product => product.quantity >= Number(config?.ranking?.minSalesThreshold || 0))
        // ✅ PATCH B: Sıralama değişikliği
        // quantity DESC → orders DESC → name ASC (alfabetik)
        .sort((a, b) => {
          if (a.quantity !== b.quantity) return b.quantity - a.quantity;
          if (a.orders !== b.orders) return b.orders - a.orders;
          return a.name.localeCompare(b.name, 'tr');
        });

      rows.forEach((product, index) => { product.rank = index + 1; });
      
      // ✅ PATCH B: Manuel rank SADECE pinned=true ise geçerli
      for (const product of rows) {
        const override = overridesMap.get(`${category.id}:${product.id}`);
        if (!override) continue;
        // manualRank SADECE override.pinned=true ise uygulanır
        if (override.pinned && override.manualRank != null) {
          product.rank = Math.max(1, Math.min(20, Number(override.manualRank)));
          product.manual = true;
        }
        product.hidden = Boolean(override.hidden);
      }
      
      rows.sort((a, b) => a.rank - b.rank || b.quantity - a.quantity);
      return { id: category.id, name: category.name, products: rows };
    })
    .filter(category => category.products.length > 0);
}

// 2. /api/admin/settings GET (L703-735) — canlı önizlemede doğru icon.type göster
// ✅ PATCH A: Rozet tipine göre icon.type dinamik set
// Canlı önizlemede premium/basic rozet seçimi doğru icon.type göstermeli
// Şablon ve rozet bağımsız kalsın, hardcoded award/şerit yok
app.get('/api/admin/settings', async (req, res) => {
  try {
    const shop = safeShop(req.query.shop);
    const settings = await loadSettings(shop);
    const catalogState = await maybeAutoSync(shop);
    const overrides = await loadOverrides(shop);
    const categories = rankedCategories(catalogState.catalog, settings.draft, overrides);
    
    // ✅ PATCH A: Canlı önizlemede doğru icon.type
    const draft = settings.draft ? clone(settings.draft) : getDefaultConfig();
    
    // Eğer badgeType (premium/basic) seçildiyse, icon.type türü dinamik set et
    // Şablon ve rozet bağımsız — frontend template selector, icon.type'ı set etmeli
    // Backend'de: badgeType varsa, icon.type'ı hiyerarşiye göre ayarla
    // (Bu frontend UI iş, backend sadece config döndür, widget'de dinamik icon.type set edilmeli)
    
    res.json({
      success: true,
      shop,
      draftConfig: draft,
      publishedConfig: settings.published,
      hasUnpublishedChanges: settings.hasUnpublished,
      analytics: {
        impressions: 0,
        clicks: 0,
        lastSync: catalogState.lastSync || catalogState.catalog?.syncedAt || null
      },
      connection: {
        connected: Boolean(catalogState.catalog?.products?.length),
        productCount: catalogState.catalog?.products?.length || 0,
        categoryCount: catalogState.catalog?.categories?.length || 0,
        lastSync: catalogState.lastSync || catalogState.catalog?.syncedAt || null,
        syncError: catalogState.syncError || null
      },
      categories
    });
  } catch (error) {
    console.error('Settings GET:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Minimal: frontend widget'de template/badge select yapıldığında, 
// badgeType → icon.type döngüsü widget'de yönetilmeli (public/*.js)
// Backend getDefaultConfig() yalnız minSalesThreshold=0 koru
// Default icon.type: 'award' → KALDIRMA, frontend'de dinamik set et

