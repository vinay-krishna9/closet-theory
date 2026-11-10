import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.onnx': 'application/octet-stream' };
createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (name !== '/' && !/^\/(index\.html|app\.js|worker\.js|style\.css|models\/u2netp\.onnx|node_modules\/onnxruntime-web\/dist\/[\w.-]+)$/.test(name)) { res.writeHead(404).end(); return; }
    const target = path.join(root, name === '/' ? 'index.html' : name);
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404).end('Not found. Run npm run download-model if the model is missing.'); }
}).listen(Number(process.env.PORT || 4173), process.env.HOST || '127.0.0.1', () => console.log('Spike: http://127.0.0.1:4173'));
