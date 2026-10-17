const test = require('node:test');
const assert = require('node:assert/strict');
const { ruleSuggestion, aiSuggestion, suggest, buildPrompt } = require('./suggest');

const lead = { name: 'Ana Souza', company: 'Studio Aurora', email: 'ana@exemplo.com', service: 'Site', value: 4200, status: 'Em conversa', next_action: 'Enviar escopo', due_date: '2026-10-20' };
const today = '2026-10-17';

test('regras locais: cada etapa recebe uma orientação', () => {
  assert.match(ruleSuggestion({ ...lead, status: 'Novo' }, today), /primeiro contato/);
  assert.match(ruleSuggestion(lead, today), /escopo/);
  assert.match(ruleSuggestion({ ...lead, status: 'Proposta enviada' }, today), /Acompanhe a proposta/);
  assert.match(ruleSuggestion({ ...lead, status: 'Fechado' }, today), /fechado/);
});

test('regras locais: prazo vencido tem prioridade e trata singular e plural', () => {
  assert.match(ruleSuggestion({ ...lead, due_date: '2026-10-16' }, today), /há 1 dia\./);
  assert.match(ruleSuggestion({ ...lead, due_date: '2026-10-10' }, today), /há 7 dias\./);
  assert.doesNotMatch(ruleSuggestion({ ...lead, due_date: '' }, today), /venceu/);
  assert.doesNotMatch(ruleSuggestion({ ...lead, status: 'Fechado', due_date: '2026-10-01' }, today), /venceu/);
});

test('o prompt enviado à IA não inclui nome, empresa nem e-mail', () => {
  const prompt = buildPrompt(lead, today);
  assert.doesNotMatch(prompt, /Ana|Aurora|exemplo\.com/);
  assert.match(prompt, /Serviço: Site/);
});

test('IA: envia a requisição esperada e devolve o texto limitado', async () => {
  let call;
  const fetchImpl = async (url, options) => { call = { url, options }; return { ok: true, json: async () => ({ content: [{ text: '  Envie o escopo hoje.  ' }] }) }; };
  const text = await aiSuggestion(lead, { apiKey: 'chave-de-teste', fetchImpl, today });
  assert.equal(text, 'Envie o escopo hoje.');
  assert.equal(call.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(call.options.headers['x-api-key'], 'chave-de-teste');
  assert.equal(JSON.parse(call.options.body).model, 'claude-haiku-5-5');
  const long = async () => ({ ok: true, json: async () => ({ content: [{ text: 'a'.repeat(900) }] }) });
  assert.equal((await aiSuggestion(lead, { apiKey: 'x', fetchImpl: long, today })).length, 400);
});

test('sem chave usa regras; com chave usa IA; se a IA falhar volta para regras', async () => {
  assert.equal((await suggest(lead, { apiKey: '', today })).source, 'rules');
  const ok = async () => ({ ok: true, json: async () => ({ content: [{ text: 'Ligue para o cliente.' }] }) });
  assert.deepEqual(await suggest(lead, { apiKey: 'x', fetchImpl: ok, today }), { source: 'ai', text: 'Ligue para o cliente.' });
  for (const broken of [async () => ({ ok: false, status: 401 }), async () => { throw new Error('rede'); }, async () => ({ ok: true, json: async () => ({ content: [] }) })]) {
    assert.equal((await suggest(lead, { apiKey: 'x', fetchImpl: broken, today })).source, 'rules');
  }
});
