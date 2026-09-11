const http = require('http');
const fs = require('fs');
const path = require('path');

const IKAS_CLIENT_ID = process.env.IKAS_CLIENT_ID || 'ornek_client_id';
const IKAS_CLIENT_SECRET = process.env.IKAS_CLIENT_SECRET || 'ornek_client_secret';

async function getIkasAccessToken() {
  try {
    const response = await fetch('https://api.myikas.com/api/v1/admin/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: IKAS_CLIENT_ID,
        clientSecret: IKAS_CLIENT_SECRET,
        grant_type: 'client_credentials'
      })
    });
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Token alma hatasi:', error);
    return null;
  }
}

async function fetchIkasData() {
  const token = await getIkasAccessToken();
  if (!token) return { error: 'Token alinamadi' };

  const query = `
    {
      categories(pagination: { limit: 10 }) {
        data {
          id
          name
        }
      }
      products(pagination: { limit: 5 }, sort: { soldCount: DESC }) {
        data {
          id
          name
          soldCount
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
    return result.data;
  } catch (error) {
    console.error('GraphQL sorgu hatasi:', error);
    return { error: 'Veri cekilemedi' };
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/bestsellers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const data = await fetchIkasData();
    res.end(JSON.stringify(data));
    return;
  }

  if (req.url === '/admin') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Kategori Yildizi - Admin Ayarlari</title>
        <style>
          body { font-family: sans-serif; padding: 20px; background: #fff; color: #333; }
          .form-group { margin-bottom: 15px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input { width: 100%; padding: 8px; box-sizing: border-box; }
          button { background: #ff416c; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h2>Kategori Yıldızı Admin Ayarları</h2>
        <div class="form-group">
          <label>Widget Durumu</label>
          <input type="text" value="Aktif" readonly />
        </div>
        <div class="form-group">
          <label>En Çok Satan Gösterim Limiti</label>
          <input type="number" value="5" />
        </div>
        <button onclick="alert('Ayarlar kaydedildi!')">Kaydet</button>
      </body>
      </html>
    `);
    return;
  }

  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  let extname = path.extname(filePath);
  let contentType = 'text/html';

  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
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