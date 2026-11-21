// server.js
// Local development / preview server for the DQRetro site.
// Serves public/ as static files only. It has no write endpoints and no
// filesystem access beyond express.static, which refuses paths outside public/.
const express = require('express');
const path = require('path');

const app = express();
const PUBLIC_DIR = path.join(__dirname, 'public');

// ------------------------------
// Static files (includes /data/*.json)
// ------------------------------
app.use(express.static(PUBLIC_DIR, { dotfiles: 'ignore' }));

// Convenience routes
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ------------------------------
// Start server
// Binds to localhost by default so it is not reachable from the network.
// Set HOST=0.0.0.0 to expose it deliberately (e.g. LAN preview).
// ------------------------------
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
