const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

test('fluxo de oportunidade: criar, consultar, filtrar, editar e excluir', async () => {
  const scratch = require('node:os').tmpdir();
  const dir = fs.mkdtempSync(path.join(scratch, 'atendeflow-test-'));
  const child = spawn(process.execPath, [path.join(__dirname, 'server.js')], { env: { ...process.env, DATA_DIR: dir, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', c => { stderr += c; });
  try {
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Servidor não iniciou: ' + stderr)), 5000);
      child.stdout.once('data', chunk => { clearTimeout(timer); resolve(Number(String(chunk).match(/:(\d+)/)?.[1])); });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Servidor encerrou: ${code} ${stderr}`)); });
    });
    const base = `http://localhost:${port}`;
    const request = async (url, options) => { const res = await fetch(base + url, options); return { status: res.status, body: await res.json() }; };
    const initial = await request('/api/leads');
    assert.equal(initial.status, 200);
    assert.equal(initial.body.length, 4);
    const created = await request('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Teste Portfólio', company: 'Empresa Teste', service: 'Site', value: 5000, status: 'Novo' }) });
    assert.equal(created.status, 201);
    assert.equal(created.body.name, 'Teste Portfólio');
    const id = created.body.id;
    const filtered = await request('/api/leads?q=Empresa%20Teste&status=Novo');
    assert.equal(filtered.body.length, 1);
    assert.equal(filtered.body[0].id, id);
    const edited = await request(`/api/leads/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Teste Portfólio', company: 'Empresa Teste', service: 'Site', value: 5000, status: 'Fechado' }) });
    assert.equal(edited.body.status, 'Fechado');
    const stats = await request('/api/stats');
    assert.equal(stats.body.total, 5);
    assert.equal(stats.body.byStatus.Fechado, 2);
    const invalid = await request('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'X', company: 'Y', service: 'Z', status: 'Inválido' }) });
    assert.equal(invalid.status, 400);
    const deleted = await request(`/api/leads/${id}`, { method: 'DELETE' });
    assert.equal(deleted.status, 200);
    assert.equal((await request('/api/leads?q=Empresa%20Teste')).body.length, 0);
    assert.equal((await request('/server.js')).status, 404);
  } finally {
    child.kill();
    await new Promise(resolve => child.once('exit', resolve));
    if (path.resolve(dir).startsWith(scratch + path.sep)) fs.rmSync(dir, { recursive: true, force: true });
  }
});
