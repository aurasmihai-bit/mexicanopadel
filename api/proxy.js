const https = require('https');
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const path = urlObj.searchParams.get('path') || 'properties/';
    urlObj.searchParams.delete('path');
    const qs = urlObj.searchParams.toString();
    const target = 'https://renet.immoflux.ro/api/v1/' + path + (qs ? '?' + qs : '');
    const data = await new Promise((resolve, reject) => {
      https.get(target, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Host': 'renet.immoflux.ro' }
      }, (r) => {
        let body = '';
        r.on('data', d => body += d);
        r.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(new Error('Parse: ' + body.slice(0,100))); } });
      }).on('error', reject).setTimeout(20000, function(){ this.destroy(new Error('Timeout')); });
    });
    res.status(200).json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
};
