(function() {
  console.log('ikas Kategori Yildizi Widget yukleniyor...');
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'widget.css';
  document.head.appendChild(link);

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
})();