const https = require('https');

exports.handler = async function(event) {
  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url) return { statusCode: 400, body: 'No URL' };

  const allowed = ['upload.wikimedia.org', 'i.imgflip.com'];
  let parsedHost;
  try {
    parsedHost = new URL(url).hostname;
    if (!allowed.includes(parsedHost)) return { statusCode: 403, body: 'Not allowed: ' + parsedHost };
  } catch(e) {
    return { statusCode: 400, body: 'Invalid URL: ' + url };
  }

  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
        'Referer': 'https://en.wikipedia.org/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      }
    };
    https.get(url, options, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, options, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => {
            resolve({
              statusCode: 200,
              headers: {
                'Content-Type': res2.headers['content-type'] || 'image/jpeg',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400',
              },
              body: Buffer.concat(chunks).toString('base64'),
              isBase64Encoded: true,
            });
          });
        }).on('error', e => resolve({ statusCode: 500, body: 'Redirect error: ' + e.message }));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: {
            'Content-Type': res.headers['content-type'] || 'image/jpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          },
          body: Buffer.concat(chunks).toString('base64'),
          isBase64Encoded: true,
        });
      });
    }).on('error', e => resolve({ statusCode: 500, body: 'Error: ' + e.message }));
  });
};
