const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
let leads = [];
let editingId = null;
let requestVersion = 0;

async function api(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Não foi possível carregar os dados.');
  return payload;
}

function cell(text, className = '') {
  const td = document.createElement('td');
  if (className) td.className = className;
  td.textContent = text;
  return td;
}

function renderRows() {
  const tbody = $('leadRows');
  tbody.replaceChildren();
  $('resultCount').textContent = `${leads.length} ${leads.length === 1 ? 'contato' : 'contatos'}`;
  $('emptyState').hidden = leads.length > 0;
  for (const lead of leads) {
    const tr = document.createElement('tr');
    const contact = document.createElement('td');
    const name = document.createElement('strong'); name.textContent = lead.name;
    const company = document.createElement('small'); company.textContent = lead.company;
    contact.append(name, company);
    tr.append(contact, cell(lead.service), cell(money(lead.value), 'money'));
    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'status status-' + lead.status.replaceAll(' ', '-');
    badge.textContent = lead.status;
    statusCell.append(badge);
    tr.append(statusCell, cell(lead.next_action || '—', 'action-text'), cell(lead.due_date ? new Date(lead.due_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'));
    const actions = document.createElement('td');
    const group = document.createElement('div'); group.className = 'row-actions';
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'icon-button'; edit.textContent = 'Editar'; edit.setAttribute('aria-label', `Editar ${lead.name}`); edit.addEventListener('click', () => openDialog(lead));
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'icon-button delete'; remove.textContent = 'Excluir'; remove.setAttribute('aria-label', `Excluir ${lead.name}`); remove.addEventListener('click', () => deleteLead(lead));
    group.append(edit, remove); actions.append(group); tr.append(actions); tbody.append(tr);
    ['Contato', 'Serviço', 'Valor', 'Etapa', 'Próxima ação', 'Vencimento', 'Ações'].forEach((label, index) => tr.children[index].dataset.label = label);
  }
}

async function refresh() {
  const version = ++requestVersion;
  $('loadStatus').hidden = false;
  $('loadStatus').textContent = 'Carregando oportunidades…';
  try {
    const q = encodeURIComponent($('searchInput').value.trim());
    const status = encodeURIComponent($('statusFilter').value);
    const [items, stats] = await Promise.all([api(`/api/leads?q=${q}&status=${status}`), api('/api/stats')]);
    if (version !== requestVersion) return;
    $('loadStatus').hidden = true;
    $('emptyState').querySelector('strong').textContent = 'Nenhuma oportunidade encontrada';
    leads = items;
    renderRows();
    $('metricTotal').textContent = stats.total;
    $('metricOpen').textContent = money(stats.openValue);
    $('metricClosed').textContent = money(stats.closedValue);
    $('metricRate').textContent = stats.total ? `${Math.round(stats.byStatus.Fechado / stats.total * 100)}%` : '0%';
  } catch (error) {
    if (version !== requestVersion) return;
    $('loadStatus').textContent = error.message + ' Tente atualizar a página.';
  }
}

function openDialog(lead = null) {
  editingId = lead?.id ?? null;
  $('leadForm').reset();
  $('formError').hidden = true;
  $('dialogTitle').textContent = lead ? 'Editar oportunidade' : 'Novo contato';
  if (lead) {
    for (const field of ['name', 'company', 'email', 'service', 'value', 'status', 'next_action', 'due_date']) $('leadForm').elements[field].value = lead[field];
  }
  $('leadDialog').showModal();
  $('leadForm').elements.name.focus();
}

async function deleteLead(lead) {
  if (!confirm(`Excluir a oportunidade de ${lead.name}?`)) return;
  try { await api(`/api/leads/${lead.id}`, { method: 'DELETE' }); await refresh(); }
  catch (error) { alert(error.message); }
}

$('newButton').addEventListener('click', () => openDialog());
$('closeDialog').addEventListener('click', () => $('leadDialog').close());
$('cancelButton').addEventListener('click', () => $('leadDialog').close());
$('leadForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());
  const submit = event.currentTarget.querySelector('[type=submit]');
  submit.disabled = true;
  submit.textContent = 'Salvando…';
  try {
    await api(editingId ? `/api/leads/${editingId}` : '/api/leads', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    $('leadDialog').close();
    await refresh();
  } catch (error) { $('formError').textContent = error.message; $('formError').hidden = false; }
  finally { submit.disabled = false; submit.textContent = 'Salvar oportunidade'; }
});
$('searchInput').addEventListener('input', refresh);
$('statusFilter').addEventListener('change', refresh);
refresh();

document.querySelectorAll('.nav-item').forEach(link => link.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(item => { item.classList.toggle('active', item === link); item.removeAttribute('aria-current'); });
  link.setAttribute('aria-current', 'location');
}));
