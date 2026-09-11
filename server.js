const http = require('http');
const fs = require('fs');
const path = require('path');

const IKAS_CLIENT_ID = process.env.IKAS_CLIENT_ID || 'ornek_client_id';
const IKAS_CLIENT_SECRET = process.env.IKAS_CLIENT_SECRET || 'ornek_client_secret';
const IKAS_REDIRECT_URI = process.env.IKAS_REDIRECT_URI || 'http://localhost:3000/auth/callback';

let settings = {
  badgeColor: '#1b4332',
  limit: 5
};

async function getIkasAccessToken(code) {
  try {
    const response = await fetch('https://api.myikas.com/api/v1/admin/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: IKAS_CLIENT_ID,
        clientSecret: IKAS_CLIENT_SECRET,
        grant_type: code ? 'authorization_code' : 'client_credentials',
        code: code
      })
    });
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Token alma hatasi:', error);
    return null;
  }
}

async function analyzeBestSellers() {
  const token = await getIkasAccessToken();
  if (!token) return { error: 'Token alinamadi' };

  const query = `
    {
      categories(pagination: { limit: 50 }) {
        data {
          id
          name
        }
      }
      orderItems(pagination: { limit: 500 }) {
        data {
          productId
          productName
          quantity
          categoryId
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.myikas.com/api/v1/admin/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });
    const result = await response.json();
    const data = result.data;

    if (!data || !data.orderItems || !data.categories) {
      return { categories: [], bestSellers: {} };
    }

    // Kategori bazli urun satislarini hesapla ve ilk 3'u belirle
    const categoryProductSales = {};
    data.orderItems.data.forEach(item => {
      const catId = item.categoryId || 'diger';
      if (!categoryProductSales[catId]) {
        categoryProductSales[catId] = {};
      }
      if (!categoryProductSales[catId][item.productId]) {
        categoryProductSales[catId][item.productId] = {
          productId: item.productId,
          productName: item.productName,
          totalSold: 0
        };
      }
      categoryProductSales[catId][item.productId].totalSold += (item.quantity || 1);
    });

    const rankedCategories = {};
    Object.keys(categoryProductSales).forEach(catId => {
      const productsArray = Object.values(categoryProductSales[catId]);
      productsArray.sort((a, b) => b.totalSold - a.totalSold);
      rankedCategories[catId] = {
        first: productsArray[0] || null,
        second: productsArray[1] || null,
        third: productsArray[2] || null
      };
    });

    return {
      categories: data.categories.data,
      bestSellers: rankedCategories
    };
  } catch (error) {
    console.error('GraphQL analiz hatasi:', error);
    return { error: 'Veri analiz edilemedi' };
  }
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, 'http://localhost:3000');
  
  if (urlObj.pathname === '/auth/callback') {
    const code = urlObj.searchParams.get('code');
    const token = await getIkasAccessToken(code);
    res.writeHead(302, { 'Location': '/admin?success=1' });
    res.end();
    return;
  }

  if (urlObj.pathname === '/api/bestsellers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const data = await analyzeBestSellers();
    res.end(JSON.stringify(data));
    return;
  }

  if (urlObj.pathname === '/api/settings') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          settings = { ...settings, ...parsed };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, settings }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Gecersiz JSON' }));
        }
      });
      return;
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(settings));
      return;
    }
  }

  if (urlObj.pathname === '/admin') {
    const adminHtmlPath = path.join(__dirname, 'public', 'admin.html');
    fs.readFile(adminHtmlPath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('Admin sayfasi bulunamadi');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
      }
    });
    return;
  }

  let filePath = path.join(__dirname, 'public', urlObj.pathname === '/' ? 'index.html' : urlObj.pathname);
  let extname = path.extname(filePath);
  let contentType = 'text/html';

  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Sayfa bulunamadi');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(3000, () => {
  console.log('Kategori Yildizi Sunucusu http://localhost:3000 adresinde calisiyor.');
});