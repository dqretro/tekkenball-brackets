// server.js
const express = require('express');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const app = express();
app.use(express.json());

// ------------------------------
// Static files (fixes /admin/admin.html, etc.)
// ------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// Optional helpers for direct routes (nice DX)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
});

// Safe join within public/
function withinPublic(p) {
  const full = path.join(__dirname, 'public', p);
  const pub = path.join(__dirname, 'public') + path.sep;
  if (!full.startsWith(pub)) {
    throw new Error('Path escapes public folder');
  }
  return full;
}

// ------------------------------
// Save generated HTML pages
// Body: { pages: [{ path: "pages/bracket/pool1.html", content: "<!doctype html>..." }, ...] }
// ------------------------------
app.post('/savePages', async (req, res) => {
  const { pages } = req.body;

  if (!pages || !Array.isArray(pages)) {
    return res.status(400).json({ error: 'Invalid pages array' });
  }

  try {
    await Promise.all(
      pages.map(async (p) => {
        if (!p || typeof p.path !== 'string' || typeof p.content !== 'string') {
          throw new Error('Invalid page entry');
        }

        // basic normalization & constraint (must live under pages/bracket)
        const normalized = path.posix.normalize(p.path.replace(/\\/g, '/'));
        if (!normalized.startsWith('pages/bracket/')) {
          throw new Error('Page path must be inside pages/bracket/');
        }

        const fullPath = withinPublic(normalized);
        await fsp.mkdir(path.dirname(fullPath), { recursive: true });
        await fsp.writeFile(fullPath, p.content, 'utf8');
        console.log(`Saved page: ${fullPath}`);
      })
    );

    res.json({ ok: true, message: `${pages.length} page(s) saved.` });
  } catch (err) {
    console.error('Error saving pages:', err);
    res.status(500).json({ error: 'Failed to save pages.' });
  }
});

// ------------------------------
// Delete one pool page (quiet success if already gone)
// Body: { path: "pages/bracket/pool3.html" }
// ------------------------------
app.post('/deletePage', async (req, res) => {
  const { path: relPath } = req.body;
  if (!relPath) return res.status(400).json({ error: 'No file path provided' });

  try {
    const normalized = path.posix.normalize(relPath.replace(/\\/g, '/'));
    if (!normalized.startsWith('pages/bracket/')) {
      return res.status(400).json({ error: 'Only files under pages/bracket can be deleted' });
    }

    const fullPath = withinPublic(normalized);
    try {
      await fsp.unlink(fullPath);
      console.log(`Deleted page: ${fullPath}`);
    } catch (e) {
      // If it wasn't there, that's fine—quiet success
      if (e.code !== 'ENOENT') throw e;
    }

    return res.json({ ok: true, message: 'Page deleted (or did not exist).' });
  } catch (err) {
    console.error('Error deleting page:', err);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// ------------------------------
// Delete ALL pool pages + clear data-pools.json
// Always returns a clean success message.
// ------------------------------
app.delete('/pools/all', async (req, res) => {
  const bracketDir = path.join(__dirname, 'public', 'pages', 'bracket');
  const poolsJsonPath = path.join(__dirname, 'public', 'data', 'data-pools.json');

  try {
    // Delete all pool*.html in pages/bracket
    try {
      const files = await fsp.readdir(bracketDir);
      await Promise.all(
        files
          .filter((f) => /^pool\d+\.html$/i.test(f))
          .map((f) => fsp.unlink(path.join(bracketDir, f)).catch((e) => {
            // ignore ENOENT; rethrow others
            if (e.code !== 'ENOENT') throw e;
          }))
      );
    } catch (e) {
      // If the directory doesn't exist yet, that's fine
      if (e.code !== 'ENOENT') throw e;
    }

    // Clear data-pools.json to an empty array (your admin.js expects an array)
    try {
      await fsp.mkdir(path.dirname(poolsJsonPath), { recursive: true });
      await fsp.writeFile(poolsJsonPath, JSON.stringify([], null, 2), 'utf8');
      console.log('Reset data-pools.json to []');
    } catch (e) {
      console.error('Failed writing data-pools.json:', e);
      throw e;
    }

    // Clean, friendly message—no "not found" noise
    res.json({ ok: true, message: '✅ All pools have been deleted successfully.' });
  } catch (err) {
    console.error('Error deleting all pools:', err);
    res.status(500).json({ error: 'Failed to delete all pools.' });
  }
});

// ------------------------------
// Serve JSON files from /public/data
// ------------------------------
app.get('/data/:file', async (req, res) => {
  const file = req.params.file;
  const filePath = path.join(__dirname, 'public', 'data', file);

  try {
    const data = await fsp.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    res.status(500).json({ error: `Cannot read or parse ${file}` });
  }
});

// ------------------------------
// Save JSON data endpoint
// ------------------------------
app.post('/save', async (req, res) => {
  const { file, data } = req.body;
  if (!file || data === undefined) return res.status(400).send({ error: 'Missing file or data' });

  const allowedFiles = [
    'data-players.json',
    'data-pools.json',
    'data-topcut.json',
    'data-tournaments.json',
    'data-standings.json',
    'data-stats.json'
  ];

  if (!allowedFiles.includes(file)) {
    return res.status(400).send({ error: 'File not allowed' });
  }

  const filePath = path.join(__dirname, 'public', 'data', file);

  try {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved JSON: ${file}`);
    res.json({ status: 'success', file });
  } catch (err) {
    console.error(`Error saving ${file}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------
// Start server
// ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
