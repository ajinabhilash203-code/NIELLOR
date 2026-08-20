// Minimal zero-dependency static server for previewing the NIELLOR site.
//   node dev-server.js            -> http://localhost:4321
//   node dev-server.js . 8080     -> serve this folder on port 8080
//
// Binds 0.0.0.0, so the site is reachable from phones and tablets on the same
// Wi-Fi at the Network URL printed on start. Local development only — there is
// no authentication here, so do not run it on a public or untrusted network.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || __dirname);
const PORT = Number(process.argv[3] || 4321);
const HOST = '0.0.0.0';   // all interfaces, not just loopback

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.md': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';

  const file = path.resolve(ROOT, '.' + rel);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); return; }
    /* Every response used to go out with no Cache-Control, no ETag and no
       Last-Modified. With no validator at all a browser is free to reuse a
       cached copy WITHOUT asking the server whether it changed — so an edited
       products.js could keep running from cache on one machine while another
       machine saw the new file. Phones hit the LAN URL and laptops hit
       localhost, which are different origins with separate caches, so the two
       could disagree for a long time. Development server: never cache. */
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store, must-revalidate'
    });
    res.end(buf);
  });
}).listen(PORT, HOST, () => {
  const nets = os.networkInterfaces();
  const lan = Object.values(nets).flat().filter(n =>
    n && n.family === 'IPv4' && !n.internal && !n.address.startsWith('169.254.'));

  console.log('\n  NIELLOR  ·  serving ' + ROOT + '\n');
  console.log('  Local:    http://localhost:' + PORT);
  lan.forEach(n => console.log('  Network:  http://' + n.address + ':' + PORT + '   (' + n.family + ')'));
  if (!lan.length) console.log('  Network:  no LAN address found — are you connected to Wi-Fi?');
  console.log('\n  Open the Network URL on your phone, on the same Wi-Fi.');
  console.log('  If it does not load, allow Node through the Windows firewall'
            + ' for Private networks.\n');
});
