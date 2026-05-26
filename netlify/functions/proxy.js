const https = require('https');
const http = require('http');

exports.handler = async function(event) {
  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url) return { statusCode: 400, body: 'No URL' };

  const allowed = ['upload.wikimedia.org', 'i.imgflip.com'];
  try {
    const host = new URL(url).hostname;
    if (!allowed.includes(host)) return { statusCode: 403, body: 'Not allowed' };
  } catch(e) {
    return { statusCode: 400, body: 'Invalid URL' };
  }

  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.wikipedia.org/' } }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('base64');
        const ct = res.headers['content-type'] || 'image/jpeg';
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': ct,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          },
          body,
          isBase64Encoded: true,
        });
      });
    }).on('error', () => resolve({ statusCode: 500, body: 'Error' }));
  });
};
