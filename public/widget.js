(function() {
  console.log('ikas Kategori Yildizi Widget yukleniyor...');
  
  if (!document.getElementById('ikas-kategori-yildizi-css')) {
    const link = document.createElement('link');
    link.id = 'ikas-kategori-yildizi-css';
    link.rel = 'stylesheet';
    link.href = '/widget.css';
    document.head.appendChild(link);
  }

  // Ayarlari API uzerinden dinamik cek
  let appSettings = { badgeColor: '#1b4332' };
  fetch('/api/settings')
    .then(res => res.json())
    .then(data => {
      appSettings = data;
      if (appSettings.badgeColor) {
        document.documentElement.style.setProperty('--ikas-badge-color', appSettings.badgeColor);
      }
    })
    .catch(e => console.log('Ayarlar alinamadi', e));

  window.IkasKategoriYildizi = {
    initCardBadge: function(selector, rank) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.querySelector('.ikas-badge-ribbon')) {
          el.style.position = 'relative';
          const ribbon = document.createElement('div');
          ribbon.className = 'ikas-badge-ribbon';
          ribbon.innerText = `En Çok Satan ${rank}. Ürün`;
          el.appendChild(ribbon);
        }
      });
    },
    initDetailBadge: function(selector, rank) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.querySelector('.ikas-badge-oval')) {
          const badge = document.createElement('div');
          badge.className = 'ikas-badge-oval';
          badge.innerHTML = `<span>⭐</span> En çok satan #${rank}. ürün`;
          el.appendChild(badge);
        }
      });
    }
  };

  // Magaza sayfalarinda otomatik calisma kancasi
  document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/bestsellers')
      .then(res => res.json())
      .then(data => {
        console.log('Kategori Yildizi otomatik analiz verisi:', data);
      }).catch(err => console.error(err));
  });
})();