const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const root = __dirname;
const dataDir = process.env.DATA_DIR || path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'atendeflow.sqlite'));
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    service TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Novo',
    next_action TEXT NOT NULL DEFAULT '',
    due_date TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

const statuses = ['Novo', 'Em conversa', 'Proposta enviada', 'Fechado'];
const fileTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
  res.end(body);
}

async function bodyOf(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 20000) throw new Error('Dados enviados excedem o limite.');
  }
  try { return JSON.parse(body || '{}'); } catch { throw new Error('JSON inválido.'); }
}

function clean(input) {
  const name = String(input.name ?? '').trim();
  const company = String(input.company ?? '').trim();
  const email = String(input.email ?? '').trim();
  const service = String(input.service ?? '').trim();
  const value = Number(input.value ?? 0);
  const status = String(input.status ?? 'Novo');
  const nextAction = String(input.next_action ?? '').trim();
  const dueDate = String(input.due_date ?? '').trim();
  if (!name || !company || !service) throw new Error('Preencha nome, empresa e serviço.');
  if ([name, company, email, service, nextAction].some(v => v.length > 160)) throw new Error('Um campo de texto é longo demais.');
  if (!Number.isFinite(value) || value < 0 || value > 1e9) throw new Error('Informe um valor válido.');
  if (!statuses.includes(status)) throw new Error('Etapa inválida.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido.');
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new Error('Informe uma data válida.');
  return { name, company, email, service, value, status, nextAction, dueDate };
}

function seed() {
  if (db.prepare("SELECT value FROM app_meta WHERE key = 'seeded'").get()) return;
  const insert = db.prepare('INSERT INTO leads (name, company, email, service, value, status, next_action, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insert.run('Marina Costa', 'Casa do Mar', 'marina@exemplo.com', 'Landing page', 4200, 'Em conversa', 'Enviar escopo inicial', '2026-10-20');
  insert.run('Rafael Lima', 'Ateliê Norte', 'rafael@exemplo.com', 'Site institucional', 6800, 'Proposta enviada', 'Acompanhar proposta', '2026-10-18');
  insert.run('Beatriz Rocha', 'Studio Raiz', 'beatriz@exemplo.com', 'Página de portfólio', 3500, 'Novo', 'Marcar conversa', '2026-10-22');
  insert.run('Diego Martins', 'Vila Verde', 'diego@exemplo.com', 'Página de reservas', 7800, 'Fechado', 'Iniciar levantamento', '2026-10-24');
  db.prepare("INSERT INTO app_meta (key, value) VALUES ('seeded', '1')").run();
}
seed();

async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/leads' && req.method === 'GET') {
      const search = (url.searchParams.get('q') || '').trim();
      const status = url.searchParams.get('status') || '';
      if (status && !statuses.includes(status)) return json(res, 400, { error: 'Etapa inválida.' });
      const rows = db.prepare(`SELECT * FROM leads WHERE (? = '' OR status = ?) AND (? = '' OR name LIKE ? OR company LIKE ? OR service LIKE ?) ORDER BY CASE status WHEN 'Novo' THEN 0 WHEN 'Em conversa' THEN 1 WHEN 'Proposta enviada' THEN 2 ELSE 3 END, updated_at DESC, id DESC`)
        .all(status, status, search, `%${search}%`, `%${search}%`, `%${search}%`);
      return json(res, 200, rows);
    }
    if (url.pathname === '/api/stats' && req.method === 'GET') {
      const rows = db.prepare('SELECT status, COUNT(*) AS total, SUM(value) AS amount FROM leads GROUP BY status').all();
      const total = rows.reduce((n, r) => n + r.total, 0);
      const openValue = rows.filter(r => r.status !== 'Fechado').reduce((n, r) => n + r.amount, 0);
      const closedValue = rows.find(r => r.status === 'Fechado')?.amount || 0;
      return json(res, 200, { total, openValue, closedValue, byStatus: Object.fromEntries(statuses.map(s => [s, rows.find(r => r.status === s)?.total || 0])) });
    }
    if (url.pathname === '/api/leads' && req.method === 'POST') {
      const lead = clean(await bodyOf(req));
      const result = db.prepare('INSERT INTO leads (name, company, email, service, value, status, next_action, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(lead.name, lead.company, lead.email, lead.service, lead.value, lead.status, lead.nextAction, lead.dueDate);
      return json(res, 201, db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid));
    }
    const match = url.pathname.match(/^\/api\/leads\/(\d+)$/);
    if (match && req.method === 'PUT') {
      const lead = clean(await bodyOf(req));
      const result = db.prepare("UPDATE leads SET name=?, company=?, email=?, service=?, value=?, status=?, next_action=?, due_date=?, updated_at=datetime('now') WHERE id=?")
        .run(lead.name, lead.company, lead.email, lead.service, lead.value, lead.status, lead.nextAction, lead.dueDate, Number(match[1]));
      if (!result.changes) return json(res, 404, { error: 'Contato não encontrado.' });
      return json(res, 200, db.prepare('SELECT * FROM leads WHERE id = ?').get(Number(match[1])));
    }
    if (match && req.method === 'DELETE') {
      const result = db.prepare('DELETE FROM leads WHERE id = ?').run(Number(match[1]));
      return result.changes ? json(res, 200, { ok: true }) : json(res, 404, { error: 'Contato não encontrado.' });
    }
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Rota não encontrada.' });
    if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
    const staticPath = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!['/index.html', '/styles.css', '/app.js'].includes(staticPath)) return json(res, 404, { error: 'Arquivo não encontrado.' });
    const resolved = path.resolve(root, '.' + staticPath);
    if (!resolved.startsWith(root + path.sep)) return json(res, 403, { error: 'Acesso negado.' });
    const ext = path.extname(resolved);
    if (!fileTypes[ext] || !fs.existsSync(resolved)) return json(res, 404, { error: 'Arquivo não encontrado.' });
    res.writeHead(200, { 'Content-Type': fileTypes[ext], 'Cache-Control': 'no-store' });
    fs.createReadStream(resolved).pipe(res);
  } catch (error) {
    json(res, 400, { error: error.message || 'Não foi possível concluir a operação.' });
  }
}

const server = http.createServer(handler);
if (require.main === module) {
  server.listen(Number(process.env.PORT || 3000), () => console.log(`AtendeFlow: http://localhost:${server.address().port}`));
}
module.exports = { server, db, clean };
