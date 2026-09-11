const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        store_id VARCHAR(255) UNIQUE,
        access_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        store_id VARCHAR(255) UNIQUE,
        badge_color VARCHAR(50) DEFAULT '#1b4332',
        "limit" INT DEFAULT 3,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS bestsellers (
        id SERIAL PRIMARY KEY,
        store_id VARCHAR(255),
        category_id VARCHAR(255),
        product_id VARCHAR(255),
        product_name TEXT,
        total_sold INT,
        rank INT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PostgreSQL tabloları başarıyla oluşturuldu veya zaten mevcut.');
  } catch (err) {
    console.error('Veritabanı tabloları oluşturulurken hata:', err);
  }
}

initDB();

const IKAS_CLIENT_ID = process.env.IKAS_CLIENT_ID || 'ornek_client_id';
const IKAS_CLIENT_SECRET = process.env.IKAS_CLIENT_SECRET || 'ornek_client_secret';
const IKAS_REDIRECT_URI = process.env.IKAS_REDIRECT_URI || 'http://localhost:3000/api/oauth/callback/ikas';
const IKAS_SCOPE = 'read_products read_orders';

async function getIkasAccessToken(code) {
  try {
    const response = await fetch('https://api.myikas.com/api/v1/admin/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: IKAS_CLIENT_ID,
        clientSecret: IKAS_CLIENT_SECRET,
        grant_type: code ? 'authorization_code' : 'client_credentials',
        code: code,
        scope: IKAS_SCOPE
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
  
  if (urlObj.pathname === '/api/oauth/callback/ikas') {
    const code = urlObj.searchParams.get('code');
    const token = await getIkasAccessToken(code);
    if (token) {
      try {
        await pool.query(
          `INSERT INTO stores (store_id, access_token) VALUES ($1, $2) ON CONFLICT (store_id) DO UPDATE SET access_token = $2`,
          ['default_store', token]
        );
      } catch (dbErr) {
        console.error('Veritabanına token kaydedilemedi:', dbErr);
      }
    }
    res.writeHead(302, { 'Location': '/admin?success=1' });
    res.end();
    return;
  }

  if (urlObj.pathname === '/auth/callback') {
    const code = urlObj.searchParams.get('code');
    const token = await getIkasAccessToken(code);
    if (token) {
      try {
        await pool.query(
          `INSERT INTO stores (store_id, access_token) VALUES ($1, $2) ON CONFLICT (store_id) DO UPDATE SET access_token = $2`,
          ['default_store', token]
        );
      } catch (dbErr) {
        console.error('Veritabanına token kaydedilemedi:', dbErr);
      }
    }
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
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body);
          const badgeColor = parsed.badgeColor || '#1b4332';
          const limit = parsed.limit || 3;
          
          await pool.query(
            `INSERT INTO settings (store_id, badge_color, "limit") VALUES ($1, $2, $3) ON CONFLICT (store_id) DO UPDATE SET badge_color = $2, "limit" = $3, updated_at = CURRENT_TIMESTAMP`,
            ['default_store', badgeColor, limit]
          );

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, settings: { badgeColor, limit } }));
        } catch (e) {
          console.error(e);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Gecersiz JSON veya DB hatasi' }));
        }
      });
      return;
    } else {
      try {
        const result = await pool.query('SELECT badge_color, "limit" FROM settings WHERE store_id = $1', ['default_store']);
        let settings = { badgeColor: '#1b4332', limit: 5 };
        if (result.rows.length > 0) {
          settings = {
            badgeColor: result.rows[0].badge_color,
            limit: result.rows[0].limit
          };
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(settings));
      } catch (dbErr) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ayarlar alinamadi' }));
      }
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