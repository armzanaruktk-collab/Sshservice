import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Static files in public
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Explicit Direct File Download Routes with Attachment Header
  app.get(['/download/apk', '/apk/worldvpn-release-85.apk', '/api/download/apk'], (_req, res) => {
    const apkPath = path.resolve(__dirname, 'public/apk/worldvpn-release-85.apk');
    if (fs.existsSync(apkPath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="worldvpn-release-85.apk"');
      return res.sendFile(apkPath);
    }
    return res.status(404).send('APK file not found');
  });

  app.get(['/download/zip', '/SshVpn.zip', '/api/download/zip'], (_req, res) => {
    const zipPath = path.resolve(__dirname, 'public/SshVpn.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="SshVpn.zip"');
      return res.sendFile(zipPath);
    }
    return res.status(404).send('ZIP file not found');
  });

  // API: Test SSH Connection and Handshake
  app.post('/api/ssh/test', (req, res) => {
    const { host, port = 22, username, password, privateKey, passphrase } = req.body;

    if (!host || !username) {
      return res.status(400).json({ success: false, error: 'Host and Username are required.' });
    }

    const conn = new Client();
    let isHandled = false;
    const logs: string[] = [];

    const appendLog = (msg: string) => {
      const time = new Date().toTimeString().split(' ')[0];
      logs.push(`[${time}] ${msg}`);
    };

    appendLog(`Initiating test connection to ${host}:${port} as ${username}...`);

    const timeout = setTimeout(() => {
      if (!isHandled) {
        isHandled = true;
        appendLog('Connection timed out after 10 seconds.');
        try { conn.end(); } catch {}
        res.json({ success: false, error: 'Connection timed out (10s)', logs });
      }
    }, 10000);

    conn.on('ready', () => {
      if (isHandled) return;
      isHandled = true;
      clearTimeout(timeout);
      appendLog('SSH authentication successful! Session established.');
      appendLog('Tunnel channel direct-tcpip is ready.');
      conn.end();
      res.json({ success: true, message: 'Authentication successful! Server is ready.', logs });
    });

    conn.on('banner', (message) => {
      appendLog(`Server banner: ${message.trim()}`);
    });

    conn.on('error', (err) => {
      if (isHandled) return;
      isHandled = true;
      clearTimeout(timeout);
      appendLog(`SSH Error: ${err.message}`);
      res.json({ success: false, error: err.message, logs });
    });

    conn.on('close', () => {
      appendLog('Connection closed.');
    });

    try {
      const config: any = {
        host: host.trim(),
        port: parseInt(port, 10) || 22,
        username: username.trim(),
        readyTimeout: 8000,
      };

      if (privateKey && privateKey.trim()) {
        config.privateKey = privateKey.trim();
        if (passphrase) config.passphrase = passphrase;
      } else if (password) {
        config.password = password;
      }

      conn.connect(config);
    } catch (e: any) {
      if (!isHandled) {
        isHandled = true;
        clearTimeout(timeout);
        appendLog(`Exception: ${e.message}`);
        res.json({ success: false, error: e.message, logs });
      }
    }
  });

  // API: Get list of Android source files in SshVpn
  app.get('/api/source-tree', (req, res) => {
    const baseDir = path.resolve(__dirname, 'SshVpn');
    if (!fs.existsSync(baseDir)) {
      return res.json({ files: [] });
    }

    function walk(dir: string, rel: string = ''): Array<{ name: string; path: string; isDir: boolean; size?: number }> {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const results: Array<{ name: string; path: string; isDir: boolean; size?: number }> = [];
      for (const entry of entries) {
        if (entry.name === '.git' || entry.name === 'build' || entry.name === '.gradle') continue;
        const relativePath = rel ? `${rel}/${entry.name}` : entry.name;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push({ name: entry.name, path: relativePath, isDir: true });
          results.push(...walk(fullPath, relativePath));
        } else {
          const stats = fs.statSync(fullPath);
          results.push({ name: entry.name, path: relativePath, isDir: false, size: stats.size });
        }
      }
      return results;
    }

    try {
      const files = walk(baseDir);
      res.json({ files });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Read file content
  app.get('/api/source-file', (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath || filePath.includes('..')) {
      return res.status(400).send('Invalid path');
    }
    const fullPath = path.resolve(__dirname, 'SshVpn', filePath);
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
      return res.status(404).send('File not found');
    }
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      res.type('text/plain').send(content);
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  });

  // Vite dev server middlewares or static dist
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SSH Tunnel VPN app running on http://0.0.0.0:${port}`);
  });
}

startServer();
