const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const urlObj = new URL(req.url, 'http://localhost');
    
    // Extract path - could come from:
    // 1. URL path: /api/proxy/properties/?token=... -> path = "properties/"
    // 2. Query param: /api/proxy?path=properties/&token=...
    let apiPath = urlObj.searchParams.get('path') || '';
    if (!apiPath) {
      // Extract from URL path after /api/proxy/
      const match = urlObj.pathname.match(/\/api\/proxy\/?(.*)/);
      apiPath = (match && match[1]) ? match[1] : 'properties/';
    }
    if (!apiPath) apiPath = 'properties/';

    // Build query string without 'path' param
    urlObj.searchParams.delete('path');
    const qs = urlObj.searchParams.toString();
    const target = 'https://renet.immoflux.ro/api/v1/' + apiPath + (qs ? '?' + qs : '');

    const data = await new Promise((resolve, reject) => {
      const reqOptions = {
        hostname: 'renet.immoflux.ro',
        port: 443,
        path: '/api/v1/' + apiPath + (qs ? '?' + qs : ''),
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
          'Host': 'renet.immoflux.ro'
        }
      };
      const r = https.request(reqOptions, (resp) => {
        let body = '';
        resp.on('data', d => body += d);
        resp.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch(e) { reject(new Error('Parse error: ' + body.slice(0, 100))); }
        });
      });
      r.on('error', reject);
      r.setTimeout(25000, () => r.destroy(new Error('Timeout after 25s')));
      r.end();
    });

    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
