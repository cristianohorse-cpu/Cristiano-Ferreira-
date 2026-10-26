/* CRM Fermani · app dos vendedores e do gestor
   Dados no Supabase; cada vendedor só recebe o que é dele (regras no banco). */
(function () {
'use strict';
const CFG = window.CRM_CONFIG || {};
const ETAPAS = ['Em contato', 'Interessado', 'Proposta enviada', 'Pedido fechado', 'Sem interesse', 'Dados incorretos'];
const CANAIS = ['Ligação', 'WhatsApp', 'E-mail', 'Visita', 'Reunião online'];
const ORIGENS = ['Prospecção', 'Pré-vendas', 'Indicação', 'Cliente antigo'];
const FIM = ['Sem interesse', 'Dados incorretos'];
const ORIG_MAPS = 'Estrada+Duilio+Beltramini,+6975,+Valinhos,+SP,+13278-078';
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const IC = {
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  back: '<path d="m15 18-6-6 6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  truck: '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'
};
const svg = (k, s) => `<svg aria-hidden="true" width="${s || 22}" height="${s || 22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, ' ').trim();
const dig = s => String(s || '').replace(/\D/g, '');
const titulo = s => String(s || '').toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());
const primeiro = s => titulo(String(s || '').split(' ')[0]);
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const hoje = () => iso(new Date());
const addDias = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const dm = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '';
const dmy = s => s ? dm(s) + '/' + s.slice(0, 4) : '';
const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
const SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const semana = s => SEM[new Date(s + 'T12:00').getDay()];
const brl = v => v >= 1e6 ? 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi' : v >= 1e4 ? 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil' : 'R$ ' + Math.round(v || 0).toLocaleString('pt-BR');
const brlFull = v => 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const S = { tab: 'pend', view: null, filtro: 'todas', ordem: 'compras', q: '', busca: null, form: {}, eu: null, papel: null,
  clientes: [], contatos: [], prosp: [], pedidos: [], corr: [], vendedores: [], itens: [], parcelas: [], variacao: [], nfs: [], nfItens: [], hist: [], carregado: false, tela: 'login', msg: '' };
const $app = document.getElementById('app'), $nav = document.getElementById('nav');
let sb = null;

/* ---------------- dados ---------------- */
async function todos(tabela, filtro) {
  let out = [], de = 0;
  for (;;) {
    let q = sb.from(tabela).select('*').range(de, de + 999);
    if (filtro) q = filtro(q);
    const { data, error } = await q;
    if (error) throw error;
    out = out.concat(data);
    if (data.length < 1000) return out;
    de += 1000;
  }
}
async function carregar() {
  const [cl, ct, pr, pe, co, it, pa, va, nf, ni] = await Promise.all([
    todos('clientes'), todos('contatos'), todos('prospeccoes'), todos('pedidos'), todos('correcoes'),
    todos('pedido_itens'), todos('parcelas'), todos('cliente_variacao'), todos('nfs'), todos('nf_itens')]);
  S.clientes = cl; S.contatos = ct; S.prosp = pr; S.pedidos = pe; S.corr = co;
  S.itens = it; S.parcelas = pa; S.variacao = va; S.nfs = nf; S.nfItens = ni;
  if (S.papel === 'gestor' || S.papel === 'suporte') S.vendedores = await todos('vendedores');
  S.carregado = true;
}
const gestor = () => S.papel === 'gestor';
const meus = l => l.filter(x => (x.resp || x.vendedor) === S.eu);
const minhaCarteira = () => meus(S.clientes);
function corrDe(c) { const o = {}; S.corr.filter(x => x.cliente_codigo === c.codigo && x.vendedor === c.resp).sort((a, b) => a.quando < b.quando ? -1 : 1).forEach(x => { o[x.campo] = x.depois; }); return o; }
function cliente(codigo, resp) {
  const c = S.clientes.find(x => x.codigo === String(codigo) && x.resp === (resp || S.eu)); if (!c) return null;
  const o = corrDe(c);
  return Object.assign({}, c, { cidade: o.cidade ?? c.cidade, telefone: o.telefone ?? c.telefone, contato: o.contato ?? c.contato, cnpj: o.cnpj ?? c.cnpj, _corr: Object.keys(o) });
}
const ordemCont = (a, b) => ((b.data || '') + (b.criado || '')) > ((a.data || '') + (a.criado || '')) ? 1 : -1;
function contatosDe(tipo, ref, vend) {
  vend = vend || S.eu;
  return S.contatos.filter(c => c.tipo === tipo && c.vendedor === vend && (tipo === 'C' ? c.cliente_codigo === String(ref) : c.prospeccao_id === ref)).sort(ordemCont);
}
function ultimosPorCliente(vend) {
  const m = new Map();
  S.contatos.filter(c => c.tipo === 'C' && (!vend || c.vendedor === vend)).sort(ordemCont).forEach(c => { const k = c.vendedor + '|' + c.cliente_codigo; if (!m.has(k)) m.set(k, c); });
  return m;
}
function pendencias(vend) {
  const out = [], ult = ultimosPorCliente(vend);
  ult.forEach(u => {
    if (!u.prox || FIM.includes(u.etapa)) return;
    const c = S.clientes.find(x => x.codigo === u.cliente_codigo && x.resp === u.vendedor);
    out.push({ tipo: 'C', ref: u.cliente_codigo, vend: u.vendedor, nome: c ? c.nome : (u.cliente_codigo || ''), prox: u.prox, hora: u.hora, acao: u.acao || u.obs, quem: u.falou, etapa: u.etapa });
  });
  S.prosp.filter(p => !vend || p.vendedor === vend).forEach(p => {
    if (p.prox && !FIM.includes(p.etapa)) out.push({ tipo: p.origem === 'Pré-vendas' ? 'N' : 'P', ref: p.id, vend: p.vendedor, nome: p.nome, prox: p.prox, hora: p.hora, acao: p.acao || p.obs, quem: p.contato, etapa: p.etapa });
  });
  return out.sort((a, b) => (a.prox + (a.hora || '99')) < (b.prox + (b.hora || '99')) ? -1 : 1);
}
const tagTipo = t => t === 'C' ? '<span class="tag">Carteira</span>' : t === 'N' ? '<span class="tag ok">Cliente novo</span>' : '<span class="tag p">Prospecção</span>';

/* ---------------- busca ---------------- */
async function buscar(q) {
  const r = { q, meus: [], prosp: [], outros: [], comum: false, livre: false, curta: false };
  const nq = norm(q), dq = dig(q);
  if (nq.length < 3 && dq.length < 8) { r.curta = true; return r; }
  minhaCarteira().forEach(c0 => { const c = cliente(c0.codigo); if ((nq.length >= 3 && norm(c.nome).includes(nq)) || (dq.length >= 8 && dig(c.cnpj).startsWith(dq.slice(0, 8)))) r.meus.push(c); });
  meus(S.prosp).forEach(p => { if ((nq.length >= 3 && norm(p.nome).includes(nq)) || (dq.length >= 8 && dig(p.cnpj).startsWith(dq.slice(0, 8)))) r.prosp.push(p); });
  const { data, error } = await sb.rpc('consulta_empresa', { q });
  if (error) { r.erro = true; return r; }
  (data || []).forEach(x => {
    if (x.tipo === 'comum') { r.comum = true; return; }
    if (x.responsavel === S.eu) { if (x.tipo === 'cliente' && !r.meus.length) r.outros.push({ k: 'sua', txt: x.forte ? 'NA SUA CARTEIRA' : 'NOME PARECIDO NA SUA CARTEIRA', sub: 'Procure na aba Carteira.' }); return; }
    if (x.tipo === 'cliente') r.outros.push({ k: x.forte ? 'cli' : 'par', txt: x.forte ? 'JÁ É CLIENTE' : 'NOME PARECIDO', sub: (x.forte ? 'Responsável: ' : 'Cliente de ') + titulo(x.responsavel) + (x.forte ? '' : ' · confirme pelo CNPJ') });
    else { const fech = x.etapa === 'Pedido fechado'; r.outros.push({ k: 'pro', txt: x.forte ? (fech ? 'JÁ VIROU PEDIDO' : 'EM PROSPECÇÃO') : 'NOME PARECIDO EM PROSPECÇÃO', sub: 'Com ' + titulo(x.responsavel) + (x.desde ? ' desde ' + dm(x.desde) : '') + (x.etapa && !fech ? ' · ' + x.etapa : '') }); }
  });
  r.outros.sort((a, b) => (a.k === 'cli' || a.k === 'pro' ? 0 : 1) - (b.k === 'cli' || b.k === 'pro' ? 0 : 1));
  if (r.comum && r.outros.length) r.comum = false;
  r.livre = !r.meus.length && !r.prosp.length && !r.outros.length && !r.comum;
  return r;
}

/* ---------------- pedaços de tela ---------------- */
const head = inner => `<div class="head">${inner}</div>`;
const topo = sub => `<div class="brand"><b>FERMANI</b>${gestor() ? '<span class="test">GESTOR</span>' : ''}</div>${sub || ''}`;
const voltar = () => `<button class="back" data-act="voltar" aria-label="Voltar">${svg('back')}</button>`;
const opts = (l, v) => l.map(x => `<option${x === v ? ' selected' : ''}>${esc(x)}</option>`).join('');
function acoes(nome, ci, uf, tel) {
  const t = dig(tel), rota = 'https://www.google.com/maps/dir/?api=1&origin=' + ORIG_MAPS + '&destination=' + encodeURIComponent((nome || '') + ' ' + (ci || '') + ' ' + (uf || ''));
  return `<div class="acts"><a class="act" href="tel:${esc(t)}">${svg('phone', 20)}Ligar</a>${t.length >= 10 ? `<a class="act" href="https://wa.me/55${esc(t)}" target="_blank" rel="noopener">${svg('wa', 20)}WhatsApp</a>` : `<span class="act" style="opacity:.5">${svg('wa', 20)}Sem celular</span>`}<a class="act" href="${esc(rota)}" target="_blank" rel="noopener">${svg('pin', 20)}Rota</a></div>`;
}
function historico(hist, vazio) {
  return `<div class="card"><div class="h2">Histórico</div>${hist.length ? hist.map((x, i) => `<div class="tl"><div class="dot${i ? ' g' : ''}"></div><div class="grow"><span class="sub">${dmy(x.data)} · ${esc([x.canal, x.etapa].filter(Boolean).join(' · ') || 'Anotação')}${x.falou ? ' · ' + esc(x.falou) : ''}</span><span class="txt">${esc(x.obs || x.acao || '')}</span>${x.pedido ? `<span class="sub">Pedido ${esc(x.pedido)}${x.valor ? ' · ' + brlFull(x.valor) : ''}</span>` : ''}</div></div>`).join('') : `<span class="sub">${esc(vazio || 'Nenhum contato registrado ainda.')}</span>`}</div>`;
}
function proximo(prox, hora, acao) {
  if (!prox) return '';
  const h = hoje(), over = prox < h, d = diasEntre(prox, h);
  return `<div class="alert${over ? ' bad' : ''}"><span class="lbl">PRÓXIMO CONTATO · ${over ? 'ATRASADO ' + d + (d > 1 ? ' DIAS' : ' DIA') : prox === h ? 'HOJE' + (hora ? ' ÀS ' + esc(hora) : '') : dm(prox) + (hora ? ' ÀS ' + esc(hora) : '')}</span><span class="txt">${esc(acao || 'Sem ação anotada')}</span></div>`;
}

/* ---------------- telas ---------------- */
function telaLogin() {
  const novo = S.tela === 'primeiro';
  return head(`<div class="brand"><b>FERMANI</b></div><h1>CRM Comercial</h1><div class="hi">${novo ? 'Primeiro acesso: crie a sua senha' : 'Entre com o seu e-mail da Fermani'}</div>`) +
  `<form class="main login" id="flogin">
    <div class="field"><label for="l_email">E-mail</label><input id="l_email" type="email" autocomplete="username" required value="${esc(S.form.email || '')}"></div>
    <div class="field"><label for="l_senha">${novo ? 'Crie uma senha (mínimo 8 caracteres)' : 'Senha'}</label><input id="l_senha" type="password" autocomplete="${novo ? 'new-password' : 'current-password'}" minlength="${novo ? 8 : 1}" required></div>
    ${S.msg ? `<p class="err" role="alert">${esc(S.msg)}</p>` : ''}
    <button class="btn" type="submit">${novo ? 'Criar senha e entrar' : 'Entrar'}</button>
    <button class="link" type="button" data-act="${novo ? 'login' : 'primeiro'}">${novo ? 'Já tenho senha' : 'Primeiro acesso? Criar senha'}</button>
    <p class="note">Esqueceu a senha? Fale com o Cristiano.</p>
  </form>`;
}
function telaSemAcesso() {
  return head(topo('<h1>Acesso ainda não liberado</h1>')) + `<div class="main"><div class="empty"><b>Seu e-mail ainda não está cadastrado no CRM</b><span>Peça ao Cristiano para liberar o seu acesso com este e-mail. Depois, entre de novo.</span></div><button class="btn ghost" data-act="sair">${svg('out', 18)} Sair</button></div>`;
}

function telaPend() {
  const all = pendencias(S.eu), h = hoje(), lim = addDias(7), f = S.filtro;
  const ok = p => f === 'todas' || (f === 'C' && p.tipo === 'C') || (f === 'P' && p.tipo !== 'C');
  const atr = all.filter(p => p.prox < h && ok(p)), hj = all.filter(p => p.prox === h && ok(p)), prox = all.filter(p => p.prox > h && p.prox <= lim && ok(p));
  const nAtr = all.filter(p => p.prox < h).length, nHj = all.filter(p => p.prox === h).length;
  const nP = meus(S.prosp).filter(p => ![...FIM, 'Pedido fechado'].includes(p.etapa)).length;
  const hr = new Date().getHours(), saud = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  const card = p => {
    const over = p.prox < h, d = diasEntre(p.prox, h);
    return `<button class="card${over ? ' over' : ''}" data-act="abrir" data-tipo="${p.tipo === 'C' ? 'C' : 'P'}" data-ref="${esc(p.ref)}"><div class="item">
      <div class="when"><b>${esc(p.hora || (p.prox === h ? 'hoje' : dm(p.prox)))}</b><small>${over ? 'há ' + d + (d > 1 ? ' dias' : ' dia') : p.prox === h ? (p.hora ? 'hoje' : '') : semana(p.prox) + (p.hora ? ' ' + dm(p.prox) : '')}</small></div>
      <div class="grow"><div class="row"><span class="name">${esc(p.nome)}</span>${tagTipo(p.tipo)}</div>
      <div class="txt">${esc(p.acao || 'Sem próxima ação anotada')}</div>
      <div class="sub">${esc([p.quem, p.etapa].filter(Boolean).join(' · '))}</div></div></div></button>`;
  };
  const bloco = (t, l, cls) => l.length ? `<div class="sec ${cls || ''}">${t} · ${l.length}</div>` + l.map(card).join('') : '';
  const vazio = !atr.length && !hj.length && !prox.length;
  return head(topo(`<div class="hi">${saud}, ${esc(primeiro(S.eu))}</div><h1>Pendências de hoje</h1>
    <div class="kpis"><div class="kpi"><strong>${nHj}</strong><span>para hoje</span></div><div class="kpi${nAtr ? ' bad' : ''}"><strong>${nAtr}</strong><span>atrasadas</span></div><div class="kpi gold"><strong>${nP}</strong><span>em prospecção</span></div></div>`)) +
  `<div class="main"><div class="chips" role="group" aria-label="Filtrar">${[['todas', 'Todas'], ['C', 'Carteira'], ['P', 'Prospecção e novos']].map(([k, t]) => `<button class="chip" data-act="filtro" data-v="${k}" aria-pressed="${f === k}">${t}</button>`).join('')}</div>
  ${(() => { const ea = itensAbertos(p => p.vendedor === S.eu).filter(x => x.s.atrasado); return ea.length ? `<div class="sec bad">Entregas atrasadas · ${ea.length}</div>` + ea.slice(0, 10).map(x => `<button class="card over" data-act="pedido" data-ref="${x.it.pedido}"><div class="row"><span class="name">${esc(nomeCli(x.p))}</span><span class="tag bad">Entrega ${dm(x.s.proxData)}</span></div><div class="txt">${esc(x.it.produto || '')} · saldo ${fmtQ(Math.max(x.s.saldo, 0))}</div><div class="sub">Pedido ${x.it.pedido} · O.F. ${esc(x.it.of)}</div></button>`).join('') : ''; })()}
  ${bloco('Atrasadas', atr, 'bad')}${bloco('Hoje', hj)}${bloco('Próximos 7 dias', prox)}
  ${vazio ? '<div class="empty"><b>Nada pendente por aqui</b><span>Ao registrar um contato com data de retorno, ele aparece nesta tela no dia marcado.</span></div>' : ''}
  <button class="btn ghost sm" data-act="sair" style="align-self:center">${svg('out', 16)} Sair</button></div>`;
}

function telaCarteira() {
  const q = norm(S.q), dq = dig(S.q);
  let l = minhaCarteira().map(c => cliente(c.codigo));
  if (q) l = l.filter(c => norm(c.nome).includes(q) || norm(c.cidade).includes(q) || (dq.length >= 3 && dig(c.cnpj).includes(dq)) || String(c.codigo) === S.q.trim());
  const ult = ultimosPorCliente(S.eu), dU = c => { const u = ult.get(S.eu + '|' + c.codigo); return u ? u.data : null; };
  if (S.ordem === 'compras') l.sort((a, b) => (b.vendas_2026 || 0) - (a.vendas_2026 || 0) || (a.nome < b.nome ? -1 : 1));
  if (S.ordem === 'sem') l.sort((a, b) => ((dU(a) || '0') > (dU(b) || '0') ? 1 : (dU(a) || '0') < (dU(b) || '0') ? -1 : 0) || (b.vendas_2026 || 0) - (a.vendas_2026 || 0));
  if (S.ordem === 'perto') l.sort((a, b) => (a.km ?? 9999) - (b.km ?? 9999));
  if (S.ordem === 'nome') l.sort((a, b) => a.nome < b.nome ? -1 : 1);
  const segTag = s => { s = s || ''; return /Ativo|Aberto/i.test(s) ? `<span class="tag ok">${esc(s)}</span>` : /Reativ/i.test(s) ? `<span class="tag bad">${esc(s)}</span>` : `<span class="tag">${esc(s)}</span>`; };
  return head(topo(`<h1>Minha carteira</h1><div class="search"><input id="qcart" type="search" placeholder="Nome, cidade, código ou CNPJ" value="${esc(S.q)}" aria-label="Filtrar carteira"></div>`)) +
  `<div class="main"><div class="chips" role="group" aria-label="Ordenar">${[['compras', 'Mais compram'], ['sem', 'Sem contato'], ['perto', 'Mais perto'], ['nome', 'A–Z']].map(([k, t]) => `<button class="chip" data-act="ordem" data-v="${k}" aria-pressed="${S.ordem === k}">${t}</button>`).join('')}</div>
  <div class="sub">${l.length} de ${minhaCarteira().length} clientes</div>
  ${l.slice(0, 150).map(c => { const d = dU(c); return `<button class="card" data-act="abrir" data-tipo="C" data-ref="${esc(c.codigo)}"><div class="row"><span class="name">${esc(c.nome)}</span>${segTag(c.segmento)}</div>
   <div class="sub">${esc(titulo(c.cidade))}/${esc(c.uf)}${c.km != null ? ' · ≈ ' + Math.round(c.km) + ' km' : ''} · Faixa ${esc(c.faixa || '–')} · cód. ${esc(c.codigo)}</div>
   <div class="row txt"><span>${c.vendas_2026 ? '2026: ' + brl(c.vendas_2026) : 'Sem compras em 2026'}</span><span class="sub">${d ? 'Contato ' + dm(d) : 'Nunca contatado'}</span></div></button>`; }).join('')}
  ${l.length > 150 ? '<p class="note">Mostrando 150. Use a busca acima para achar os outros.</p>' : ''}
  ${!l.length ? '<div class="empty"><b>Nenhum cliente encontrado</b><span>Confira a grafia ou use a aba Buscar para ver se a empresa está com outro vendedor.</span></div>' : ''}</div>`;
}

function telaBusca() {
  const r = S.busca; let res = '';
  if (S.buscando) res = '<div class="empty"><b>Procurando…</b></div>';
  else if (r && r.curta) res = '<div class="empty"><b>Digite pelo menos 3 letras</b><span>Ou o CNPJ completo.</span></div>';
  else if (r && r.erro) res = '<div class="alert bad"><span class="lbl">SEM CONEXÃO</span><span class="txt">Não foi possível consultar agora. Confira a internet e tente de novo.</span></div>';
  else if (r) {
    const rq = esc(r.q.toUpperCase());
    res += r.meus.map(c => `<button class="card" data-act="abrir" data-tipo="C" data-ref="${esc(c.codigo)}" style="border-left:4px solid var(--petrol)"><div class="row"><span class="name">${esc(c.nome)}</span><span class="tag">NA SUA CARTEIRA</span></div><div class="sub">${esc(titulo(c.cidade))}/${esc(c.uf)} · código ${esc(c.codigo)}</div></button>`).join('');
    res += r.prosp.map(p => `<button class="card" data-act="abrir" data-tipo="P" data-ref="${esc(p.id)}" style="border-left:4px solid var(--gold)"><div class="row"><span class="name">${esc(p.nome)}</span><span class="tag p">SUA PROSPECÇÃO</span></div><div class="sub">${esc(p.etapa || '')}${p.criado ? ' · desde ' + dm(p.criado) : ''}</div></button>`).join('');
    res += r.outros.map(o => `<div class="card" style="border-left:4px solid ${o.k === 'pro' ? 'var(--gold)' : o.k === 'sua' ? 'var(--petrol)' : 'var(--bad)'}"><div class="row"><span class="name">${rq}</span><span class="tag ${o.k === 'pro' ? 'p' : o.k === 'sua' ? '' : 'bad'}">${esc(o.txt)}</span></div><div class="txt">${esc(o.sub)}</div>${o.k === 'pro' || o.k === 'cli' ? '<div class="sub">Combine com o responsável antes de ligar.</div>' : ''}</div>`).join('');
    if (r.comum) res += '<div class="alert"><span class="lbl">NOME MUITO COMUM</span><span class="txt">Esse nome aparece em várias carteiras. Digite a razão social completa ou o CNPJ.</span></div>';
    if (r.livre) res += `<div class="card" style="border-left:4px solid var(--ok)"><div class="row"><span class="name">${rq}</span><span class="tag ok">LIVRE</span></div><div class="txt">Não encontramos cliente nem prospecção com esse nome ou CNPJ.</div><button class="btn gold sm" data-act="novaprosp" style="align-self:flex-start">Começar prospecção</button></div>`;
  } else res = '<div class="empty"><b>Antes de prospectar, consulte aqui</b><span>Você vê se a empresa já é cliente ou se alguém já está prospectando. Os dados dos clientes de outros vendedores não aparecem.</span></div>';
  return head(topo(`<h1>Buscar empresa</h1><form class="search" id="fbusca"><input id="qbusca" type="search" placeholder="Nome, razão social ou CNPJ" value="${esc(r ? r.q : '')}" aria-label="Buscar empresa" autocomplete="off"><button class="btn gold" type="submit">Buscar</button></form>`)) +
  `<div class="main">${res}<button class="btn ghost" data-act="novaprosp">${svg('plus', 18)} Cadastrar nova prospecção</button></div>`;
}

function numerosDe(vend) {
  const h = new Date(), mes = h.getFullYear() + '-' + pad(h.getMonth() + 1);
  const ant = new Date(h.getFullYear(), h.getMonth() - 1, 1), mesAnt = ant.getFullYear() + '-' + pad(ant.getMonth() + 1);
  const P = S.pedidos.filter(p => !vend || p.vendedor === vend);
  const pm = P.filter(p => p.data.slice(0, 7) === mes);
  const pend = pendencias(vend), hj = hoje(), sem = addDias(-6);
  return { pm, tot: pm.reduce((s, p) => s + Number(p.valor || 0), 0), totAnt: P.filter(p => p.data.slice(0, 7) === mesAnt).reduce((s, p) => s + Number(p.valor || 0), 0),
    atr: pend.filter(p => p.prox < hj).length, hoje: pend.filter(p => p.prox === hj).length,
    cont7: S.contatos.filter(c => (!vend || c.vendedor === vend) && c.data >= sem && c.data <= hj).length,
    prosp: S.prosp.filter(p => (!vend || p.vendedor === vend) && ![...FIM, 'Pedido fechado'].includes(p.etapa)).length };
}
function cabecalhoMes(tot, n, totAnt, titulo1) {
  const h = new Date(), fim = new Date(h.getFullYear(), h.getMonth() + 1, 0).getDate(), pct = Math.round(h.getDate() / fim * 100);
  const ultPed = S.pedidos.reduce((m, p) => p.data > m ? p.data : m, '');
  return `<div class="hi">Pedidos emitidos até ${dm(ultPed)}</div><h1>${titulo1}</h1>
   <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap"><span style="font-family:var(--f-display);font-size:26px;font-weight:700" class="num">${brl(tot)}</span><span class="hi">${n} pedidos em ${MESES[h.getMonth()]}</span></div>
   <div class="bar" role="img" aria-label="Mês ${pct}% decorrido"><i style="width:${pct}%"></i></div>
   <div class="hi">Mês ${pct}% decorrido · mês anterior: ${brl(totAnt)}</div>`;
}
function telaNumeros() {
  const n = numerosDe(S.eu), cart = minhaCarteira(), ult = ultimosPorCliente(S.eu);
  const ativos = cart.filter(c => (c.vendas_2026 || 0) > 0).length, nunca = cart.filter(c => !ult.has(S.eu + '|' + c.codigo)).length;
  return head(topo(cabecalhoMes(n.tot, n.pm.length, n.totAnt, 'Meus números'))) +
  `<div class="main"><div class="card"><div class="stats"><div class="stat"><span>Clientes na carteira</span><b>${cart.length}</b></div><div class="stat"><span>Compraram em 2026</span><b>${ativos}</b></div><div class="stat"><span>Nunca contatados</span><b>${nunca}</b></div></div>
   <div class="stats"><div class="stat"><span>Contatos em 7 dias</span><b>${n.cont7}</b></div><div class="stat"><span>Prospecções ativas</span><b>${n.prosp}</b></div><div class="stat"><span>Atrasadas</span><b>${n.atr}</b></div></div></div>
   <div class="sec">Pedidos do mês</div>
   ${n.pm.length ? n.pm.slice().sort((a, b) => b.numero - a.numero).map(p => `<div class="card"><div class="row"><span class="name">${esc(p.cliente)}</span><b class="num">${brl(p.valor)}</b></div><div class="sub">Pedido ${esc(p.numero)} · ${dm(p.data)}</div></div>`).join('') : '<div class="empty"><b>Nenhum pedido no mês ainda</b><span>Os pedidos entram a cada atualização do CRM.</span></div>'}</div>`;
}
function telaEquipe() {
  const g = numerosDe(null);
  const nomes = [...new Set(S.clientes.map(c => c.resp).concat(S.pedidos.map(p => p.vendedor)).filter(Boolean))].sort();
  const linhas = nomes.map(v => Object.assign({ v }, numerosDe(v))).sort((a, b) => b.tot - a.tot);
  const conflitos = S.prosp.filter(p => !FIM.includes(p.etapa) && p.cnpj && S.clientes.some(c => c.resp !== p.vendedor && dig(c.cnpj).slice(0, 8) === dig(p.cnpj).slice(0, 8) && dig(p.cnpj).length >= 8));
  return head(topo(cabecalhoMes(g.tot, g.pm.length, g.totAnt, 'Equipe'))) +
  `<div class="main"><div class="card"><div class="stats"><div class="stat"><span>Atrasadas</span><b style="color:var(--bad)">${g.atr}</b></div><div class="stat"><span>Contatos em 7 dias</span><b>${g.cont7}</b></div><div class="stat"><span>Prospecções ativas</span><b>${g.prosp}</b></div></div></div>
   <div class="card"><div class="h2">Vendedores no mês</div><div class="scroll"><table class="tbl"><thead><tr><th>Vendedor</th><th style="text-align:right">Vendas</th><th style="text-align:right">Ped.</th><th style="text-align:right">Contatos 7d</th><th style="text-align:right">Atras.</th></tr></thead><tbody>
   ${linhas.map(l => `<tr><td>${esc(titulo(l.v))}</td><td class="n">${brl(l.tot)}</td><td class="n">${l.pm.length}</td><td class="n">${l.cont7}</td><td class="n"${l.atr ? ' style="color:var(--bad);font-weight:600"' : ''}>${l.atr}</td></tr>`).join('')}
   </tbody></table></div></div>
   ${conflitos.length ? `<div class="alert"><span class="lbl">PROSPECÇÃO EM CLIENTE DE OUTRO VENDEDOR · ${conflitos.length}</span>${conflitos.slice(0, 8).map(p => `<span class="txt">${esc(p.nome)} · ${esc(titulo(p.vendedor))}</span>`).join('')}</div>` : ''}
   <div class="sec">Pedidos e faturamento</div>
   <button class="btn ghost" data-act="irtab" data-v="entregas">${svg('truck', 18)} Entregas com saldo</button>
   <button class="btn ghost" data-act="irtab" data-v="nfs">${svg('doc', 18)} Notas fiscais</button>
   <div class="sec">Administração</div>
   <button class="btn ghost" data-act="acessos">Acessos da equipe</button>
   <button class="btn ghost" data-act="importar">Importar dados (clientes e pedidos)</button>
   <button class="btn ghost" data-act="correcoes">Correções enviadas pelos vendedores · ${S.corr.length}</button></div>`;
}
function telaAcessos() {
  const l = S.vendedores.slice().sort((a, b) => a.nome < b.nome ? -1 : 1);
  return head(`${voltar()}<div class="hi">Quem pode entrar no app</div><h1>Acessos da equipe</h1>`) +
  `<form class="main" id="facessos"><p class="sub">Coloque o e-mail de cada pessoa. No primeiro acesso, ela entra com esse e-mail em "Primeiro acesso? Criar senha". Sem e-mail, a pessoa não entra.</p>
   ${l.map((v, i) => `<div class="card"><div class="row"><span class="name">${esc(titulo(v.nome))}</span><span class="tag${v.papel !== 'vendedor' ? ' p' : ''}">${v.papel === 'gestor' ? 'Gestor' : v.papel === 'suporte' ? 'Suporte' : 'Vendedor'}</span></div>
     <div class="field"><label for="ac_${i}">E-mail</label><input id="ac_${i}" type="email" data-nome="${esc(v.nome)}" value="${esc(v.email || '')}" placeholder="nome@fermani.com.br"></div>
     <label class="sub" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="at_${i}" ${v.ativo ? 'checked' : ''}> Acesso liberado</label></div>`).join('')}
   <button class="btn" type="submit">Salvar acessos</button></form>`;
}
function telaImportar() {
  return head(`${voltar()}<div class="hi">Clientes, pedidos e contatos das planilhas</div><h1>Importar dados</h1>`) +
  `<form class="main" id="fimport"><div class="card"><span class="txt">Escolha o arquivo <b>dados_fermani.json</b> que o Claude preparou. Os clientes e pedidos são atualizados. O que os vendedores registraram no app não é apagado.</span>
    <div class="field"><label for="arq">Arquivo</label><input id="arq" type="file" accept=".json,application/json" required></div>
    <label class="sub" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="remover"> Remover clientes que saíram da lista nova</label></div>
   <div id="progresso" class="sub" role="status"></div>
   <button class="btn" type="submit">Importar</button></form>`;
}
function telaCorrecoes() {
  const l = S.corr.slice().sort((a, b) => a.quando < b.quando ? 1 : -1);
  const nomeC = (c, v) => (S.clientes.find(x => x.codigo === c && x.resp === v) || {}).nome || c;
  const rot = { cidade: 'Cidade', telefone: 'Telefone', contato: 'Contato', cnpj: 'CNPJ' };
  return head(`${voltar()}<div class="hi">Para corrigir no sistema da empresa</div><h1>Correções</h1>`) +
  `<div class="main">${l.length ? l.map(x => `<div class="card"><div class="row"><span class="name">${esc(nomeC(x.cliente_codigo, x.vendedor))}</span><span class="sub">${dm((x.quando || '').slice(0, 10))}</span></div><div class="txt">${esc(rot[x.campo] || x.campo)}: <s>${esc(x.antes || '–')}</s> → <b>${esc(x.depois || '–')}</b></div><div class="sub">Cód. ${esc(x.cliente_codigo)} · ${esc(titulo(x.vendedor))}</div></div>`).join('') : '<div class="empty"><b>Nenhuma correção enviada</b></div>'}</div>`;
}

function telaFicha(tipo, ref) {
  if (tipo === 'C') {
    const c = cliente(ref, (S.view && S.view.resp) || S.eu); if (!c) return telaPend();
    const hist = contatosDe('C', c.codigo, c.resp), u = hist[0], dono = c.resp === S.eu;
    return head(`${voltar()}<div style="display:flex;flex-direction:column;gap:4px"><div class="hi">Código ${esc(c.codigo)} · Faixa ${esc(c.faixa || '–')} · ${esc(c.segmento || '')}</div><h1>${esc(c.nome)}</h1><div class="hi">${esc(titulo(c.cidade))}/${esc(c.uf)}${c.km != null ? ' · ≈ ' + Math.round(c.km) + ' km da Fermani' : ''}</div></div>${acoes(c.nome, c.cidade, c.uf, c.telefone)}`) +
    `<div class="main"><div class="card"><div class="stats"><div class="stat"><span>Vendas 2026</span><b>${c.vendas_2026 ? brl(c.vendas_2026) : '–'}</b></div><div class="stat"><span>Última compra</span><b>${c.ultima_compra ? dmy(c.ultima_compra) : '–'}</b></div><div class="stat"><span>Contatos</span><b>${hist.length}</b></div></div></div>
     ${u ? proximo(u.prox, u.hora, u.acao || u.obs) : ''}
     <div class="card"><div class="h2">Contato e cadastro</div>
      <div class="kv"><span>Contato</span><span>${esc(c.contato || '–')}</span></div>
      <div class="kv"><span>Telefone</span><span class="num">${esc(c.telefone || '–')}</span></div>
      <div class="kv"><span>CNPJ</span><span class="num">${esc(c.cnpj || '–')}</span></div>
      <div class="kv"><span>Cidade</span><span>${esc(titulo(c.cidade))}/${esc(c.uf)}</span></div>
      ${c._corr.length ? '<div class="sub">Você corrigiu: ' + c._corr.map(k => ({ cidade: 'cidade', telefone: 'telefone', contato: 'contato', cnpj: 'CNPJ' }[k])).join(', ') + '. A gestão recebe a correção.</div>' : ''}
      ${dono ? `<button class="btn ghost sm" data-act="corrigir" data-ref="${esc(c.codigo)}" style="align-self:flex-start">Corrigir dados</button>` : ''}</div>
     ${blocoClientePedidos(c)}
     ${historico(hist)}
     ${dono ? `<button class="btn" data-act="registrar" data-tipo="C" data-ref="${esc(c.codigo)}">Registrar contato</button>` : `<p class="note">Carteira de ${esc(titulo(c.resp))}</p>`}</div>`;
  }
  const p = S.prosp.find(x => x.id === ref); if (!p) return telaPend();
  const hist = contatosDe('P', p.id, p.vendedor);
  return head(`${voltar()}<div style="display:flex;flex-direction:column;gap:4px"><div class="hi">${p.origem === 'Pré-vendas' ? 'Cliente novo' : 'Prospecção'}${p.criado ? ' · cadastrada em ' + dmy(p.criado) : ''}</div><h1>${esc(p.nome)}</h1><div class="hi">${p.cidade ? esc(titulo(p.cidade)) + (p.uf ? '/' + esc(p.uf) : '') : ''}</div></div>${acoes(p.nome, p.cidade, p.uf, p.tel)}`) +
  `<div class="main"><div class="card"><div class="stats"><div class="stat"><span>Etapa</span><b style="font-size:14px">${esc(p.etapa || '–')}</b></div><div class="stat"><span>Último contato</span><b>${p.ult ? dm(p.ult) : '–'}</b></div><div class="stat"><span>Contatos</span><b>${hist.length}</b></div></div></div>
   ${proximo(p.prox, p.hora, p.acao)}
   <div class="card"><div class="h2">Dados da empresa</div>
    <div class="kv"><span>Contato</span><span>${esc(p.contato || '–')}</span></div><div class="kv"><span>Telefone</span><span class="num">${esc(p.tel || '–')}</span></div>
    <div class="kv"><span>E-mail</span><span>${esc(p.email || '–')}</span></div><div class="kv"><span>CNPJ</span><span class="num">${esc(p.cnpj || '–')}</span></div><div class="kv"><span>Origem</span><span>${esc(p.origem || '–')}</span></div></div>
   ${historico(hist, p.obs || 'Nenhum contato registrado ainda.')}
   <button class="btn" data-act="registrar" data-tipo="P" data-ref="${esc(p.id)}">Registrar contato</button></div>`;
}
function telaContato(tipo, ref) {
  const nome = tipo === 'C' ? (cliente(ref) || {}).nome : (S.prosp.find(x => x.id === ref) || {}).nome;
  const u = tipo === 'C' ? contatosDe('C', ref)[0] : S.prosp.find(x => x.id === ref), f = S.form;
  return head(`${voltar()}<div class="hi">Registrar contato</div><h1>${esc(nome)}</h1>`) +
  `<form class="main" id="fcont">
   <div class="field"><label>Como foi o contato</label><div class="chips" role="group">${CANAIS.map(c => `<button type="button" class="chip" data-act="canal" data-v="${esc(c)}" aria-pressed="${f.canal === c}">${esc(c)}</button>`).join('')}</div></div>
   <div class="field"><label for="falou">Falou com</label><input id="falou" value="${esc(f.falou ?? (u && (u.falou || u.contato)) ?? '')}" placeholder="Nome e cargo"></div>
   <div class="field"><label for="etapa">Resultado / etapa</label><select id="etapa">${opts(ETAPAS, f.etapa || (u && u.etapa) || 'Em contato')}</select></div>
   <div class="field"><label for="obs">O que conversaram</label><textarea id="obs" placeholder="Ex.: aprovou a amostra, pediu proposta de 5.000 caixas">${esc(f.obs || '')}</textarea></div>
   <div class="field"><label>Próximo contato</label><div class="two"><input id="prox" type="date" value="${esc(f.prox ?? addDias(3))}" aria-label="Data do próximo contato"><input id="hora" type="time" value="${esc(f.hora || '')}" aria-label="Hora"></div>
    <div class="chips">${[['Amanhã', 1], ['3 dias', 3], ['1 semana', 7], ['15 dias', 15], ['1 mês', 30]].map(([t, n]) => `<button type="button" class="chip" data-act="atalho" data-v="${n}" style="height:32px;font-size:12px">${t}</button>`).join('')}<button type="button" class="chip" data-act="semdata" style="height:32px;font-size:12px">Sem retorno</button></div></div>
   <div class="field"><label for="acao">Próxima ação</label><input id="acao" value="${esc(f.acao || '')}" placeholder="Ex.: cobrar retorno da proposta"></div>
   ${tipo === 'C' ? `<div class="two"><div class="field"><label for="ped">Nº do pedido</label><input id="ped" inputmode="numeric" value="${esc(f.ped || '')}"></div><div class="field"><label for="valor">Valor sem IPI</label><input id="valor" inputmode="decimal" value="${esc(f.valor || '')}" placeholder="R$"></div></div>` : ''}
   <p class="note">${f.prox === '' ? 'Sem data: não volta para as Pendências.' : 'Aparece nas Pendências no dia marcado.'}</p>
   <button class="btn" type="submit">Salvar contato</button></form>`;
}
function telaCorrigir(ref) {
  const c = cliente(ref);
  return head(`${voltar()}<div class="hi">Corrigir dados · a gestão recebe a correção</div><h1>${esc(c.nome)}</h1>`) +
  `<form class="main" id="fcorr">
   <div class="field"><label for="c_contato">Contato</label><input id="c_contato" value="${esc(c.contato)}"></div>
   <div class="field"><label for="c_telefone">Telefone</label><input id="c_telefone" inputmode="tel" value="${esc(c.telefone)}"></div>
   <div class="field"><label for="c_cidade">Cidade</label><input id="c_cidade" value="${esc(c.cidade)}"></div>
   <div class="field"><label for="c_cnpj">CNPJ</label><input id="c_cnpj" inputmode="numeric" value="${esc(c.cnpj)}"></div>
   <button class="btn" type="submit">Enviar correção</button></form>`;
}
function telaNovaProsp() {
  const f = S.form, chk = S.chk;
  const conflito = chk && (chk.outros.filter(o => o.k !== 'sua').length || chk.meus.length || chk.prosp.length);
  return head(`${voltar()}<div class="hi">Empresa que ainda não compra da Fermani</div><h1>Nova prospecção</h1>`) +
  `<form class="main" id="fprosp">
   <div class="field"><label for="p_nome">Empresa (razão social ou nome)</label><input id="p_nome" required value="${esc(f.nome || '')}"></div>
   <div class="field"><label for="p_cnpj">CNPJ</label><input id="p_cnpj" inputmode="numeric" value="${esc(f.cnpj || '')}"></div>
   ${conflito ? `<div class="alert bad"><span class="lbl">ATENÇÃO</span>${[...chk.meus.map(() => 'Já está na sua carteira'), ...chk.prosp.map(() => 'Você já cadastrou essa prospecção'), ...chk.outros.filter(o => o.k !== 'sua').map(o => o.txt + ' · ' + o.sub)].map(t => `<span class="txt">${esc(t)}</span>`).join('')}</div>` : chk && chk.livre ? '<div class="alert ok"><span class="lbl">LIVRE</span><span class="txt">Ninguém está com essa empresa.</span></div>' : ''}
   <div class="field"><label for="p_contato">Contato (nome e cargo)</label><input id="p_contato" value="${esc(f.contato || '')}"></div>
   <div class="two"><div class="field"><label for="p_tel">Telefone</label><input id="p_tel" inputmode="tel" value="${esc(f.tel || '')}"></div><div class="field"><label for="p_uf">UF</label><input id="p_uf" maxlength="2" value="${esc(f.uf || 'SP')}"></div></div>
   <div class="field"><label for="p_cidade">Cidade</label><input id="p_cidade" value="${esc(f.cidade || '')}"></div>
   <div class="field"><label for="p_email">E-mail</label><input id="p_email" type="email" value="${esc(f.email || '')}"></div>
   <div class="two"><div class="field"><label for="p_origem">Origem</label><select id="p_origem">${opts(ORIGENS, f.origem || 'Prospecção')}</select></div><div class="field"><label for="p_etapa">Etapa</label><select id="p_etapa">${opts(ETAPAS, f.etapa || 'Em contato')}</select></div></div>
   <div class="field"><label>Próximo contato</label><div class="two"><input id="p_prox" type="date" value="${esc(f.prox || addDias(3))}" aria-label="Data"><input id="p_hora" type="time" value="${esc(f.hora || '')}" aria-label="Hora"></div></div>
   <div class="field"><label for="p_acao">Próxima ação</label><input id="p_acao" value="${esc(f.acao ?? 'Apresentar a Fermani e pedir o consumo mensal')}"></div>
   <div class="field"><label for="p_obs">Observação</label><textarea id="p_obs">${esc(f.obs || '')}</textarea></div>
   <button class="btn gold" type="submit">Salvar prospecção</button></form>`;
}

/* ================= PEDIDOS · ENTREGA FRACIONADA · SALDOS · NOTAS FISCAIS ================= */
const suporte = () => S.papel === 'suporte';
const veTudo = () => gestor() || suporte();
function variacaoDe(codigo) {
  const v = S.variacao.find(x => x.codigo === String(codigo));
  return v ? { aceita: v.aceita, pct: Number(v.pct) } : { aceita: true, pct: 10, padrao: true };
}
const pedidoDe = n => S.pedidos.find(p => p.numero === Number(n));
const itensDe = n => S.itens.filter(i => i.pedido === Number(n)).sort((a, b) => a.of < b.of ? -1 : 1);
const parcelasDe = of => S.parcelas.filter(p => p.of === of).sort((a, b) => a.data < b.data ? -1 : a.data > b.data ? 1 : 0);
const nfItensDe = of => S.nfItens.filter(x => x.of === of);
const fmtQ = q => (Number(q) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
/* situação de um item: faturado, saldo, tolerância, parcelas e atraso */
function situacao(it) {
  const ped = pedidoDe(it.pedido) || {}, v = variacaoDe(ped.cliente_codigo);
  const qtd = Number(it.qtd) || 0, fat = nfItensDe(it.of).reduce((s, x) => s + (Number(x.qtd) || 0), 0);
  const pct = v.aceita ? v.pct : 0, min = qtd * (1 - pct / 100), max = qtd * (1 + pct / 100), saldo = qtd - fat, h = hoje();
  let resto = fat;
  const parc = (it.fracionado ? parcelasDe(it.of) : []).map(p => {
    const q = Number(p.qtd) || 0, coberto = Math.min(q, Math.max(resto, 0)); resto -= q;
    const st = coberto >= q ? 'Entregue' : coberto > 0 ? 'Parcial' : p.data < h ? 'Atrasada' : 'A entregar';
    return Object.assign({}, p, { coberto, st });
  });
  const proxParc = parc.find(p => p.st !== 'Entregue');
  const proxData = it.fracionado && parc.length ? (proxParc ? proxParc.data : null) : (fat >= min && fat > 0 ? null : it.entrega);
  let st, cls;
  if (it.baixado) { st = 'Baixado'; cls = ''; }
  else if (fat > max && fat > 0) { st = 'Acima da tolerância'; cls = 'p'; }
  else if (fat >= qtd && qtd > 0) { st = 'Concluído'; cls = 'ok'; }
  else if (fat >= min && fat > 0) { st = 'Atendido · confirmar baixa'; cls = 'p'; }
  else if (fat > 0) { st = 'Parcial'; cls = 'p'; }
  else { st = 'Em aberto'; cls = ''; }
  const aberto = !it.baixado && !(fat >= qtd && qtd > 0) && !(fat >= min && fat > 0);
  const atrasado = aberto && proxData && proxData < h;
  if (atrasado) cls = 'bad';
  const somaParc = parc.reduce((s, p) => s + (Number(p.qtd) || 0), 0);
  return { qtd, fat, saldo, pct, aceita: v.aceita, padrao: v.padrao, min, max, parc, proxData, st, cls, aberto, atrasado, somaParc,
    precisaBaixa: !it.baixado && fat > 0 && fat < qtd && !(fat > max) };
}
function itensAbertos(filtroPed) {
  return S.itens.filter(i => (!filtroPed || filtroPed(pedidoDe(i.pedido) || {}))).map(i => ({ it: i, s: situacao(i), p: pedidoDe(i.pedido) || {} }))
    .filter(x => x.s.aberto || x.s.precisaBaixa);
}
const nomeCli = p => { const c = S.clientes.find(x => x.codigo === p.cliente_codigo && x.resp === p.vendedor) || S.clientes.find(x => x.codigo === p.cliente_codigo); return c ? c.nome : p.cliente; };
function chipSit(s) { return `<span class="tag ${s.cls}">${s.atrasado ? 'Atrasado · ' : ''}${esc(s.st)}</span>`; }
function barra(fat, qtd) { const pct = qtd ? Math.min(100, Math.round(fat / qtd * 100)) : 0; return `<div class="bar" style="background:var(--chip)" role="img" aria-label="${pct}% faturado"><i style="width:${pct}%"></i></div>`; }

/* ---------- lista de pedidos ---------- */
function telaPedidos() {
  const meusPeds = veTudo() ? S.pedidos : S.pedidos.filter(p => p.vendedor === S.eu);
  const fv = S.fvend || '', q = norm(S.qped || '');
  let l = meusPeds.filter(p => (!fv || p.vendedor === fv) && (!q || norm(p.cliente).includes(q) || String(p.numero).includes(q) || norm(nomeCli(p)).includes(q)));
  const fs = S.fped || 'todos';
  const sit = p => { const its = itensDe(p.numero).map(situacao); return { its, aberto: its.some(s => s.aberto), atr: its.some(s => s.atrasado), baixa: its.some(s => s.precisaBaixa) }; };
  let ls = l.map(p => Object.assign({ p }, sit(p)));
  if (fs === 'abertos') ls = ls.filter(x => x.aberto || x.baixa);
  if (fs === 'atrasados') ls = ls.filter(x => x.atr);
  ls.sort((a, b) => b.p.numero - a.p.numero);
  const n = numerosDe(veTudo() ? (fv || null) : S.eu);
  const vends = [...new Set(S.pedidos.map(p => p.vendedor))].sort();
  return head(topo(cabecalhoMes(n.tot, n.pm.length, n.totAnt, veTudo() ? 'Pedidos' : 'Meus pedidos')) +
    `<div class="search"><input id="qped" type="search" placeholder="Cliente ou nº do pedido" value="${esc(S.qped || '')}" aria-label="Filtrar pedidos"></div>`) +
  `<div class="main">${veTudo() ? `<div class="field"><label for="fvend">Vendedor</label><select id="fvend"><option value="">Todos</option>${vends.map(v => `<option value="${esc(v)}"${v === fv ? ' selected' : ''}>${esc(titulo(v))}</option>`).join('')}</select></div>` : ''}
   <div class="chips" role="group" aria-label="Filtrar">${[['todos', 'Todos'], ['abertos', 'Com saldo'], ['atrasados', 'Atrasados']].map(([k, t]) => `<button class="chip" data-act="fped" data-v="${k}" aria-pressed="${fs === k}">${t}</button>`).join('')}</div>
   <div class="sub">${ls.length} pedidos</div>
   ${ls.slice(0, 200).map(x => { const tot = x.its.reduce((s, i) => s + i.qtd, 0), fat = x.its.reduce((s, i) => s + Math.min(i.fat, i.qtd), 0);
     return `<button class="card${x.atr ? ' over' : ''}" data-act="pedido" data-ref="${x.p.numero}"><div class="row"><span class="name">${esc(nomeCli(x.p))}</span><b class="num">${brl(x.p.valor)}</b></div>
     <div class="sub">Pedido ${x.p.numero} · ${dm(x.p.data)}${veTudo() ? ' · ' + esc(primeiro(x.p.vendedor)) : ''} · ${x.its.length ? x.its.length + (x.its.length === 1 ? ' item' : ' itens') : 'sem itens'}</div>
     ${x.its.length ? barra(fat, tot) + `<div class="row sub"><span>${x.atr ? '<b style="color:var(--bad)">Entrega atrasada</b>' : x.baixa ? 'Confirmar baixa' : x.aberto ? 'Com saldo a entregar' : 'Atendido'}</span><span>${fmtQ(fat)} de ${fmtQ(tot)}</span></div>` : `<div class="sub">${x.p.data >= '2026-10-01' ? 'Pedido sem itens no relatório' : 'Itens disponíveis a partir de outubro/2026'}</div>`}</button>`; }).join('')}
   ${!ls.length ? '<div class="empty"><b>Nenhum pedido aqui</b></div>' : ''}</div>`;
}

/* ---------- um pedido ---------- */
function telaPedido(n) {
  const p = pedidoDe(n); if (!p) return telaPedidos();
  const its = itensDe(n), podeEditar = veTudo() || p.vendedor === S.eu;
  const v = variacaoDe(p.cliente_codigo);
  return head(`${voltar()}<div style="display:flex;flex-direction:column;gap:4px"><div class="hi">Pedido ${p.numero} · emitido em ${dmy(p.data)}${veTudo() ? ' · ' + esc(titulo(p.vendedor)) : ''}</div><h1>${esc(nomeCli(p))}</h1><div class="hi">${esc(p.cliente)}</div></div>`) +
  `<div class="main"><div class="card"><div class="stats"><div class="stat"><span>Valor s/ IPI</span><b>${brl(p.valor)}</b></div><div class="stat"><span>Peso</span><b>${p.kg ? fmtQ(p.kg) + ' kg' : '–'}</b></div><div class="stat"><span>R$/kg</span><b>${p.pm ? fmtQ(p.pm) : '–'}</b></div></div>
    <div class="kv"><span>Condição</span><span>${esc(p.cond || '–')}</span></div>
    <div class="kv"><span>Variação aceita</span><span>${v.aceita ? '±' + fmtQ(v.pct) + '%' + (v.padrao ? ' (padrão)' : '') : '<b style="color:var(--bad)">Não aceita</b>'}</span></div>
    ${p.cliente_codigo ? `<button class="link" data-act="fichacli" data-ref="${esc(p.cliente_codigo)}" data-v="${esc(p.vendedor)}">Ver cliente</button>` : ''}</div>
   ${its.length ? its.map(it => cardItem(it, podeEditar)).join('') : '<div class="empty"><b>Sem itens</b><span>Pedidos anteriores a outubro/2026 vieram do relatório sem itens.</span></div>'}</div>`;
}
function cardItem(it, podeEditar) {
  const s = situacao(it), nfs = nfItensDe(it.of);
  const bloq = !podeEditar ? 'disabled' : '';
  let barraBaixa = '';
  if (veTudo() && s.precisaBaixa) {
    const txt = s.fat >= s.min ? `Faturado ${fmtQ(s.fat)} de ${fmtQ(s.qtd)}: dentro da tolerância de ${fmtQ(s.pct)}%.` : s.aceita ? `Faltam ${fmtQ(s.saldo)}, fora da tolerância de ${fmtQ(s.pct)}%.` : `Cliente não aceita variação: faltam ${fmtQ(s.saldo)}.`;
    barraBaixa = `<div class="alert${s.fat >= s.min ? ' ok' : ''}"><span class="lbl">PEDIDO ATENDIDO? DESEJA BAIXAR?</span><span class="txt">${txt}</span>
      ${S.confBaixa === it.of ? `<div class="field"><label for="bx_${esc(it.of)}">Motivo (opcional)</label><input id="bx_${esc(it.of)}" placeholder="Ex.: cliente aceitou a quantidade entregue"></div><div class="confirm"><button class="btn sm" data-act="baixar" data-ref="${esc(it.of)}">Confirmar baixa</button><button class="btn ghost sm" data-act="cancbaixa">Cancelar</button></div>`
        : `<div class="confirm"><button class="btn sm" data-act="pedebaixa" data-ref="${esc(it.of)}">Sim, baixar o saldo</button></div>`}</div>`;
  }
  return `<div class="card${s.atrasado ? ' over' : ''}"><div class="row"><span class="name">${esc(it.produto || 'Item')}</span>${chipSit(s)}</div>
    <div class="sub">O.F. ${esc(it.of)} · entrega ${it.entrega ? dmy(it.entrega) : '–'}${it.kg ? ' · ' + fmtQ(it.kg) + ' kg' : ''}${it.pm ? ' · R$ ' + fmtQ(it.pm) + '/kg' : ''}</div>
    ${barra(Math.min(s.fat, s.qtd), s.qtd)}
    <div class="stats"><div class="stat"><span>Pedido</span><b>${fmtQ(s.qtd)}</b></div><div class="stat"><span>Faturado</span><b>${fmtQ(s.fat)}</b></div><div class="stat"><span>Saldo</span><b${s.saldo > 0 && s.aberto ? '' : ' style="color:var(--muted)"'}>${fmtQ(Math.max(s.saldo, 0))}</b></div></div>
    ${it.baixado ? `<div class="sub">Baixado por ${esc(primeiro(it.baixa_por))}${it.baixa_em ? ' em ' + dm(it.baixa_em.slice(0, 10)) : ''}${it.baixa_motivo ? ': ' + esc(it.baixa_motivo) : ''}${veTudo() ? ` · <button class="link" data-act="desfazbaixa" data-ref="${esc(it.of)}">Desfazer</button>` : ''}</div>` : ''}
    <div class="row" style="align-items:center"><span class="txt"><b>Entrega fracionada?</b></span><span class="chips"><button class="chip" data-act="frac" data-ref="${esc(it.of)}" data-v="1" aria-pressed="${it.fracionado}" ${bloq} style="height:32px">Sim</button><button class="chip" data-act="frac" data-ref="${esc(it.of)}" data-v="0" aria-pressed="${!it.fracionado}" ${bloq} style="height:32px">Não</button></span></div>
    ${it.fracionado ? `<div style="display:flex;flex-direction:column;gap:6px">${s.parc.length ? s.parc.map(pc => `<div class="kv"><span>${dmy(pc.data)} · ${fmtQ(pc.qtd)}</span><span class="tag ${pc.st === 'Entregue' ? 'ok' : pc.st === 'Atrasada' ? 'bad' : pc.st === 'Parcial' ? 'p' : ''}">${pc.st}</span></div>`).join('') : '<span class="sub">Nenhuma data informada ainda.</span>'}
      ${s.parc.length && Math.abs(s.somaParc - s.qtd) > 0.001 ? `<span class="err">As parcelas somam ${fmtQ(s.somaParc)}; o item tem ${fmtQ(s.qtd)}.</span>` : ''}
      ${podeEditar ? `<button class="btn ghost sm" data-act="parcelas" data-ref="${esc(it.of)}" style="align-self:flex-start">${s.parc.length ? 'Alterar datas e quantidades' : 'Informar datas e quantidades'}</button>` : ''}</div>` : ''}
    ${nfs.length ? `<div class="sub"><b>Notas fiscais:</b> ${nfs.map(x => { const nf = S.nfs.find(n => n.chave === x.chave) || {}; return `<button class="link" data-act="nf" data-ref="${esc(x.chave)}">NF ${esc(nf.numero || '?')}</button> (${dm(nf.data)} · ${fmtQ(x.qtd)})`; }).join(', ')}</div>` : ''}
    ${barraBaixa}</div>`;
}
function telaParcelas(of) {
  const it = S.itens.find(i => i.of === of); if (!it) return telaPedidos();
  const linhas = S.form.linhas || (parcelasDe(of).length ? parcelasDe(of).map(p => ({ data: p.data, qtd: p.qtd })) : [{ data: it.entrega || addDias(7), qtd: it.qtd }]);
  S.form.linhas = linhas;
  const soma = linhas.reduce((s, l) => s + (Number(l.qtd) || 0), 0), dif = (Number(it.qtd) || 0) - soma;
  return head(`${voltar()}<div class="hi">Entrega fracionada · O.F. ${esc(of)}</div><h1>${esc(it.produto || 'Item')}</h1><div class="hi">Pedido ${it.pedido} · ${fmtQ(it.qtd)} no total</div>`) +
  `<form class="main" id="fparc"><p class="sub">Informe cada entrega: data e quantidade. A soma precisa fechar com o total do item.</p>
   ${linhas.map((l, i) => `<div class="card"><div class="row"><span class="h2">${i + 1}ª entrega</span>${linhas.length > 1 ? `<button type="button" class="link" data-act="remparc" data-v="${i}">Remover</button>` : ''}</div>
     <div class="two"><div class="field"><label for="pd_${i}">Data</label><input id="pd_${i}" type="date" value="${esc(l.data || '')}" required></div><div class="field"><label for="pq_${i}">Quantidade</label><input id="pq_${i}" inputmode="decimal" value="${esc(l.qtd ?? '')}" required></div></div></div>`).join('')}
   <button type="button" class="btn ghost" data-act="addparc">${svg('plus', 18)} Adicionar entrega</button>
   <p class="${Math.abs(dif) > 0.001 ? 'err' : 'note'}" id="somaparc">${Math.abs(dif) > 0.001 ? `Soma ${fmtQ(soma)} · ${dif > 0 ? 'faltam ' + fmtQ(dif) : 'passou ' + fmtQ(-dif)}` : 'Soma confere com o pedido.'}</p>
   <button class="btn" type="submit">Salvar entregas</button></form>`;
}
function lerParcelas() { const n = (S.form.linhas || []).length, l = []; for (let i = 0; i < n; i++) l.push({ data: val('pd_' + i), qtd: parseFloat(val('pq_' + i).replace(/\./g, '').replace(',', '.')) || 0 }); S.form.linhas = l; return l; }

/* ---------- entregas (suporte e gestor) ---------- */
function telaEntregas() {
  const fv = S.fvend || '', h = hoje(), sem = addDias(7);
  const l = itensAbertos(p => !fv || p.vendedor === fv).map(x => Object.assign(x, { d: x.s.proxData || x.it.entrega || '9999' })).sort((a, b) => a.d < b.d ? -1 : 1);
  const atr = l.filter(x => x.s.atrasado), baixa = l.filter(x => !x.s.aberto && x.s.precisaBaixa), prox7 = l.filter(x => x.s.aberto && !x.s.atrasado && x.d <= sem), depois = l.filter(x => x.s.aberto && !x.s.atrasado && x.d > sem);
  const vends = [...new Set(S.pedidos.map(p => p.vendedor))].sort();
  const linha = x => `<button class="card${x.s.atrasado ? ' over' : ''}" data-act="pedido" data-ref="${x.it.pedido}"><div class="item"><div class="when"><b>${x.d === '9999' ? '–' : dm(x.d)}</b><small>${x.d !== '9999' && x.s.atrasado ? 'há ' + diasEntre(x.d, h) + 'd' : x.d !== '9999' ? semana(x.d) : ''}</small></div>
    <div class="grow"><div class="row"><span class="name">${esc(nomeCli(x.p))}</span>${chipSit(x.s)}</div><div class="txt">${esc(x.it.produto || '')} · saldo ${fmtQ(Math.max(x.s.saldo, 0))} de ${fmtQ(x.s.qtd)}</div>
    <div class="sub">Pedido ${x.it.pedido} · O.F. ${esc(x.it.of)} · ${esc(primeiro(x.p.vendedor))}${x.it.fracionado ? ' · fracionada' : ''}</div></div></div></button>`;
  const bloco = (t, a, cls) => a.length ? `<div class="sec ${cls || ''}">${t} · ${a.length}</div>` + a.map(linha).join('') : '';
  return head(topo(`<div class="hi">Itens com saldo a entregar</div><h1>Entregas</h1><div class="kpis"><div class="kpi${atr.length ? ' bad' : ''}"><strong>${atr.length}</strong><span>atrasadas</span></div><div class="kpi"><strong>${prox7.length}</strong><span>próximos 7 dias</span></div><div class="kpi gold"><strong>${baixa.length}</strong><span>confirmar baixa</span></div></div>`)) +
  `<div class="main"><div class="field"><label for="fvend">Vendedor</label><select id="fvend"><option value="">Todos</option>${vends.map(v => `<option value="${esc(v)}"${v === fv ? ' selected' : ''}>${esc(titulo(v))}</option>`).join('')}</select></div>
   ${bloco('Atrasadas', atr, 'bad')}${bloco('Confirmar baixa', baixa)}${bloco('Próximos 7 dias', prox7)}${bloco('Depois', depois)}
   ${!l.length ? '<div class="empty"><b>Nenhum item com saldo</b><span>Os itens entram com a importação do relatório de pedidos.</span></div>' : ''}
   <button class="btn ghost sm" data-act="sair" style="align-self:center">${svg('out', 16)} Sair</button></div>`;
}

/* ---------- notas fiscais ---------- */
function telaNFs() {
  const q = norm(S.qnf || ''), dq = dig(S.qnf || '');
  let l = S.nfs.slice();
  if (q) l = l.filter(n => norm(n.cliente).includes(q) || String(n.numero).includes(q) || (dq.length >= 8 && dig(n.cnpj).startsWith(dq.slice(0, 8))));
  l.sort((a, b) => (b.data + b.numero) > (a.data + a.numero) ? 1 : -1);
  const pend = S.nfItens.filter(x => !x.of).length;
  return head(topo(`<div class="hi">Faturamento</div><h1>Notas fiscais</h1><div class="search"><input id="qnf" type="search" placeholder="Cliente, nº da NF ou CNPJ" value="${esc(S.qnf || '')}" aria-label="Filtrar notas"></div>`)) +
  `<div class="main">${veTudo() ? `<div class="card"><div class="h2">Lançar notas</div><span class="sub">Importe os arquivos XML das NF-e (pode escolher vários de uma vez) ou lance uma nota à mão.</span>
     <div class="field"><label for="xmls">Arquivos XML</label><input id="xmls" type="file" accept=".xml,text/xml" multiple></div>
     <div class="confirm"><button class="btn sm" data-act="importxml">Importar XML</button><button class="btn ghost sm" data-act="nfmanual">Lançar NF à mão</button></div><div id="progxml" class="sub" role="status"></div></div>` : ''}
   ${pend ? `<div class="alert"><span class="lbl">ITENS SEM O.F. · ${pend}</span><span class="txt">Abra a nota e ligue cada item ao pedido certo.</span></div>` : ''}
   <div class="sub">${l.length} notas</div>
   ${l.slice(0, 200).map(n => { const its = S.nfItens.filter(x => x.chave === n.chave), sem = its.filter(x => !x.of).length;
     return `<button class="card" data-act="nf" data-ref="${esc(n.chave)}"><div class="row"><span class="name">NF ${esc(n.numero)} · ${esc(n.cliente || '')}</span><b class="num">${n.valor ? brl(n.valor) : ''}</b></div><div class="sub">${dmy(n.data)} · ${its.length} ${its.length === 1 ? 'item' : 'itens'}${sem ? ' · <b style="color:var(--bad)">' + sem + ' sem O.F.</b>' : ''} · ${n.origem === 'manual' ? 'lançada à mão' : 'XML'}</div></button>`; }).join('')}
   ${!l.length ? '<div class="empty"><b>Nenhuma nota ainda</b><span>' + (veTudo() ? 'Importe os XML das notas emitidas.' : 'As notas aparecem quando o suporte lança o faturamento.') + '</span></div>' : ''}</div>`;
}
function telaNF(chave) {
  const n = S.nfs.find(x => x.chave === chave); if (!n) return telaNFs();
  const its = S.nfItens.filter(x => x.chave === chave).sort((a, b) => (a.item || 0) - (b.item || 0));
  const raiz = dig(n.cnpj).slice(0, 8);
  const candidatos = S.itens.filter(i => { const p = pedidoDe(i.pedido) || {}; const c = S.clientes.find(x => x.codigo === p.cliente_codigo); return raiz.length === 8 && c && dig(c.cnpj).slice(0, 8) === raiz; });
  const lista = (candidatos.length ? candidatos : S.itens).filter(i => situacao(i).aberto || situacao(i).precisaBaixa);
  return head(`${voltar()}<div class="hi">${dmy(n.data)} · ${n.origem === 'manual' ? 'lançada à mão' : 'importada do XML'}</div><h1>NF ${esc(n.numero)}${n.serie ? '-' + esc(n.serie) : ''}</h1><div class="hi">${esc(n.cliente || '')}${n.cnpj ? ' · ' + esc(n.cnpj) : ''}</div>`) +
  `<div class="main"><div class="card"><div class="kv"><span>Valor da nota</span><span>${n.valor ? brlFull(n.valor) : '–'}</span></div>${n.chave.length === 44 ? `<div class="kv"><span>Chave</span><span class="num" style="font-size:12px">${esc(n.chave)}</span></div>` : ''}</div>
   ${its.map(x => `<div class="card${x.of ? '' : ' over'}"><div class="row"><span class="name">${esc(x.produto || 'Item ' + x.item)}</span><b class="num">${fmtQ(x.qtd)} ${esc(x.unidade || '')}</b></div>
     ${x.of ? `<div class="sub">Pedido ${esc(x.pedido || '')} · O.F. ${esc(x.of)}${x.valor ? ' · ' + brlFull(x.valor) : ''}</div>${x.pedido ? `<button class="link" data-act="pedido" data-ref="${esc(x.pedido)}">Ver pedido</button>` : ''}`
       : veTudo() ? `<div class="field"><label for="lig_${esc(x.id)}">Ligar ao item do pedido</label><select id="lig_${esc(x.id)}"><option value="">Escolha a O.F.</option>${lista.map(i => `<option value="${esc(i.of)}">Ped. ${i.pedido} · O.F. ${esc(i.of)} · ${esc((i.produto || '').slice(0, 28))} · saldo ${fmtQ(Math.max(situacao(i).saldo, 0))}</option>`).join('')}</select></div><button class="btn sm" data-act="ligar" data-ref="${esc(x.id)}" style="align-self:flex-start">Ligar</button>` : '<div class="sub">Item ainda não ligado a um pedido.</div>'}</div>`).join('')}
   ${veTudo() ? (S.confNF === chave ? `<div class="alert bad"><span class="lbl">EXCLUIR ESTA NOTA?</span><span class="txt">Os saldos dos itens voltam a ficar em aberto.</span><div class="confirm"><button class="btn sm" data-act="excnf" data-ref="${esc(chave)}">Excluir</button><button class="btn ghost sm" data-act="cancexc">Cancelar</button></div></div>` : `<button class="btn ghost sm" data-act="pedeexc" data-ref="${esc(chave)}" style="align-self:center">Excluir nota</button>`) : ''}</div>`;
}
function telaNFManual() {
  const f = S.form, p = f.pedido ? pedidoDe(f.pedido) : null, its = p ? itensDe(p.numero) : [];
  return head(`${voltar()}<div class="hi">Quando não houver o XML</div><h1>Lançar NF à mão</h1>`) +
  `<form class="main" id="fnfman"><div class="two"><div class="field"><label for="nm_num">Nº da NF</label><input id="nm_num" inputmode="numeric" required value="${esc(f.num || '')}"></div><div class="field"><label for="nm_data">Data</label><input id="nm_data" type="date" required value="${esc(f.data || hoje())}"></div></div>
   <div class="field"><label for="nm_ped">Nº do pedido</label><input id="nm_ped" inputmode="numeric" value="${esc(f.pedido || '')}" placeholder="Ex.: 19161"></div>
   ${f.pedido && !p ? '<p class="err">Pedido não encontrado.</p>' : ''}
   ${p ? `<div class="sub">${esc(nomeCli(p))} · ${esc(titulo(p.vendedor))}</div>` + its.map((i, k) => { const s = situacao(i); return `<div class="card"><span class="name">${esc(i.produto)}</span><span class="sub">O.F. ${esc(i.of)} · saldo ${fmtQ(Math.max(s.saldo, 0))} de ${fmtQ(s.qtd)}</span><div class="field"><label for="nm_q_${k}">Quantidade faturada</label><input id="nm_q_${k}" inputmode="decimal" data-of="${esc(i.of)}" placeholder="0"></div></div>`; }).join('') : ''}
   <button class="btn" type="submit"${p && its.length ? '' : ' disabled'}>Salvar nota</button></form>`;
}

/* leitura de XML de NF-e (layout 4.00) */
function lerXML(txt) {
  const doc = new DOMParser().parseFromString(txt, 'application/xml');
  const t = (el, tag) => { const x = el && el.getElementsByTagName(tag)[0]; return x ? x.textContent.trim() : ''; };
  const inf = doc.getElementsByTagName('infNFe')[0]; if (!inf) throw new Error('não é uma NF-e');
  const chave = (t(doc, 'chNFe') || (inf.getAttribute('Id') || '').replace(/^NFe/, '')).replace(/\D/g, '');
  const ide = inf.getElementsByTagName('ide')[0], dest = inf.getElementsByTagName('dest')[0];
  if (t(ide, 'tpNF') === '0') throw new Error('nota de entrada');
  const infCpl = t(inf, 'infCpl');
  const itens = [...inf.getElementsByTagName('det')].map(d => {
    const pr = d.getElementsByTagName('prod')[0], ad = t(d, 'infAdProd'), xped = t(pr, 'xPed');
    return { item: Number(d.getAttribute('nItem')) || null, produto: t(pr, 'xProd'), qtd: parseFloat(t(pr, 'qCom')) || 0, unidade: t(pr, 'uCom'), valor: parseFloat(t(pr, 'vProd')) || null, xped, ad, cprod: t(pr, 'cProd') };
  });
  return { chave, numero: t(ide, 'nNF'), serie: t(ide, 'serie'), data: (t(ide, 'dhEmi') || t(ide, 'dEmi')).slice(0, 10), cnpj: t(dest, 'CNPJ') || t(dest, 'CPF'), cliente: t(dest, 'xNome'), valor: parseFloat(t(inf, 'vNF')) || null, infCpl, itens };
}
/* descobre o pedido e a O.F. de cada item da nota */
function ligarItem(x, nf) {
  const ofs = new Set(S.itens.map(i => i.of)), peds = new Set(S.pedidos.map(p => p.numero));
  const textos = [x.ad, x.xped, nf.infCpl].join(' ');
  let of = null, pedido = null;
  const mOF = textos.match(/O\.?\s*F\.?\s*(?:N[ºo°.]*)?\s*[:\-]?\s*(\d{4,7})/i); if (mOF && ofs.has(mOF[1])) of = mOF[1];
  if (!of && ofs.has(dig(x.xped))) of = dig(x.xped);
  const mP = textos.match(/PED(?:IDO)?\.?\s*(?:N[ºo°.]*)?\s*[:\-]?\s*(\d{4,7})/i);
  if (mP && peds.has(Number(mP[1]))) pedido = Number(mP[1]);
  if (!pedido && peds.has(Number(dig(x.xped)))) pedido = Number(dig(x.xped));
  if (of) pedido = (S.itens.find(i => i.of === of) || {}).pedido || pedido;
  if (!of) {
    const raiz = dig(nf.cnpj).slice(0, 8);
    let cand = S.itens.filter(i => (pedido ? i.pedido === pedido : (() => { const p = pedidoDe(i.pedido) || {}; const c = S.clientes.find(y => y.codigo === p.cliente_codigo); return c && raiz.length === 8 && dig(c.cnpj).slice(0, 8) === raiz; })()) && situacao(i).aberto);
    const nx = norm(x.produto), porNome = cand.filter(i => norm(i.produto) && (norm(i.produto) === nx || nx.includes(norm(i.produto)) || norm(i.produto).includes(nx)));
    if (porNome.length === 1) { of = porNome[0].of; pedido = porNome[0].pedido; }          // mesmo produto do mesmo cliente
    else if (pedido && cand.length === 1) { of = cand[0].of; }                           // pedido informado na nota e só um item aberto
  }
  return { of, pedido };
}
async function importarXML(files) {
  const st = t => { const el = document.getElementById('progxml'); if (el) el.textContent = t; };
  let ok = 0, rep = 0, erro = [], semOF = 0;
  for (const f of files) {
    try {
      const nf = lerXML(await f.text());
      if (S.nfs.some(n => n.chave === nf.chave)) { rep++; continue; }
      st(`Lendo NF ${nf.numero}…`);
      const cab = { chave: nf.chave, numero: nf.numero, serie: nf.serie, data: nf.data, cnpj: nf.cnpj, cliente: nf.cliente, valor: nf.valor, origem: 'xml', por: S.eu };
      const r1 = await sb.from('nfs').insert(cab).select().single(); if (r1.error) throw r1.error;
      const linhas = nf.itens.map(x => { const l = ligarItem(x, nf); if (!l.of) semOF++; return { chave: nf.chave, item: x.item, pedido: l.pedido, of: l.of, produto: x.produto, qtd: x.qtd, unidade: x.unidade, valor: x.valor }; });
      const r2 = await sb.from('nf_itens').insert(linhas).select(); if (r2.error) throw r2.error;
      S.nfs.push(r1.data); S.nfItens = S.nfItens.concat(r2.data); ok++;
    } catch (e) { console.error(e); erro.push(f.name); }
  }
  S._keep = true; render();
  toast(`${ok} nota(s) importada(s)${rep ? ', ' + rep + ' já existia(m)' : ''}${erro.length ? ', ' + erro.length + ' com erro' : ''}${semOF ? '. ' + semOF + ' item(ns) sem O.F.: ligue na nota.' : '.'}`);
}

/* ---------- ficha do cliente: variação e notas ---------- */
function blocoClientePedidos(c) {
  const v = variacaoDe(c.codigo), raiz = dig(c.cnpj).slice(0, 8);
  const peds = S.pedidos.filter(p => p.cliente_codigo === String(c.codigo)).sort((a, b) => b.numero - a.numero);
  const nfs = raiz.length === 8 ? S.nfs.filter(n => dig(n.cnpj).slice(0, 8) === raiz).sort((a, b) => b.data > a.data ? 1 : -1) : [];
  return `<div class="card"><div class="h2">Variação de quantidade</div>
    <div class="row" style="align-items:center"><span class="txt">Aceita variação?</span><span class="chips"><button class="chip" data-act="var" data-ref="${esc(c.codigo)}" data-v="1" aria-pressed="${v.aceita}" style="height:32px">Sim</button><button class="chip" data-act="var" data-ref="${esc(c.codigo)}" data-v="0" aria-pressed="${!v.aceita}" style="height:32px">Não</button></span></div>
    ${v.aceita ? `<div class="row" style="align-items:center"><label class="txt" for="vpct">Tolerância (%)</label><input id="vpct" data-ref="${esc(c.codigo)}" inputmode="decimal" value="${fmtQ(v.pct)}" style="width:80px;height:38px;border-radius:10px;border:1px solid var(--line);background:var(--input);padding:0 10px"></div>` : '<span class="sub">O pedido só fecha com a quantidade exata.</span>'}
    ${v.padrao ? '<span class="sub">Ainda não confirmado com o cliente (padrão ±10%).</span>' : ''}</div>
   <div class="card"><div class="h2">Pedidos · ${peds.length}</div>${peds.length ? peds.slice(0, 8).map(p => { const its = itensDe(p.numero).map(situacao); const ab = its.some(s => s.aberto); return `<button class="kv link" data-act="pedido" data-ref="${p.numero}" style="width:100%"><span>Pedido ${p.numero} · ${dm(p.data)}</span><span>${brl(p.valor)}${its.length ? (ab ? ' · com saldo' : ' · atendido') : ''}</span></button>`; }).join('') : '<span class="sub">Nenhum pedido no período importado.</span>'}</div>
   <div class="card"><div class="h2">Notas fiscais · ${nfs.length}</div>${nfs.length ? nfs.slice(0, 8).map(n => `<button class="kv link" data-act="nf" data-ref="${esc(n.chave)}" style="width:100%"><span>NF ${esc(n.numero)} · ${dm(n.data)}</span><span>${n.valor ? brl(n.valor) : ''}</span></button>`).join('') : '<span class="sub">Nenhuma nota lançada para este CNPJ.</span>'}</div>`;
}

/* ---------------- render ---------------- */
function render() {
  const y = window.scrollY, v = S.view;
  let html;
  if (S.tela === 'login' || S.tela === 'primeiro') { html = telaLogin(); $nav.innerHTML = ''; }
  else if (S.tela === 'semacesso') { html = telaSemAcesso(); $nav.innerHTML = ''; }
  else if (!S.carregado) { html = head(topo('<h1>Carregando sua carteira…</h1>')) + '<div class="main"><div class="empty"><b>Um instante</b></div></div>'; }
  else {
    if (v && v.t === 'ficha') html = telaFicha(v.tipo, v.ref);
    else if (v && v.t === 'contato') html = telaContato(v.tipo, v.ref);
    else if (v && v.t === 'corrigir') html = telaCorrigir(v.ref);
    else if (v && v.t === 'nova') html = telaNovaProsp();
    else if (v && v.t === 'acessos') html = telaAcessos();
    else if (v && v.t === 'importar') html = telaImportar();
    else if (v && v.t === 'correcoes') html = telaCorrecoes();
    else if (v && v.t === 'pedido') html = telaPedido(v.ref);
    else if (v && v.t === 'parcelas') html = telaParcelas(v.ref);
    else if (v && v.t === 'nf') html = telaNF(v.ref);
    else if (v && v.t === 'nfmanual') html = telaNFManual();
    else html = ({ pend: telaPend, cart: telaCarteira, busca: telaBusca, ped: telaPedidos, num: gestor() ? telaEquipe : telaNumeros, entregas: telaEntregas, nfs: telaNFs })[S.tab]();
    const abas = suporte() ? [['entregas', 'truck', 'Entregas'], ['ped', 'box', 'Pedidos'], ['nfs', 'doc', 'Notas fiscais']]
      : [['pend', 'cal', 'Pendências'], ['cart', 'users', 'Carteira'], ['busca', 'search', 'Buscar'], ['ped', 'box', 'Pedidos'], ['num', 'chart', gestor() ? 'Equipe' : 'Números']];
    $nav.style.gridTemplateColumns = `repeat(${abas.length},minmax(0,1fr))`;
    $nav.innerHTML = abas.map(([k, i, t]) => `<button data-act="tab" data-v="${k}"${!v && S.tab === k ? ' aria-current="page"' : ''}>${svg(i)}${t}</button>`).join('');
  }
  const ae = document.activeElement, foco = ae && ae.id, sel = foco && ae.selectionStart;
  $app.innerHTML = html + (S.carregado && !v && S.tab === 'pend' && S.tela === 'app' ? `<button class="fab" data-act="novaprosp" aria-label="Nova prospecção">${svg('plus', 24)}</button>` : '') + (S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : '');
  if (foco) { const el = document.getElementById(foco); if (el) { el.focus(); try { if (sel != null) el.setSelectionRange(sel, sel); } catch (e) {} } }
  if (S._keep) window.scrollTo(0, y); S._keep = false;
}
function ir(view, troca) { if (view && S.view && !troca) S.hist.push(S.view); if (!view) S.hist = []; S.view = view; S.form = {}; S.chk = null; S.confBaixa = null; S.confNF = null; window.scrollTo(0, 0); render(); }
function voltarTela() { S.view = S.hist.pop() || null; S.form = {}; S.chk = null; S.confBaixa = null; S.confNF = null; window.scrollTo(0, 0); render(); }
function toast(t) { S.toast = t; S._keep = true; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = null; S._keep = true; render(); }, 2800); }
const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
function lerForm(ids) { ids.forEach(i => { const e = document.getElementById(i); if (e) S.form[i.replace(/^[pc]_/, '')] = e.value; }); }
const CAMPOS_CONT = ['falou', 'etapa', 'obs', 'prox', 'hora', 'acao', 'ped', 'valor'];
const CAMPOS_PROSP = ['p_nome', 'p_cnpj', 'p_contato', 'p_tel', 'p_uf', 'p_cidade', 'p_email', 'p_origem', 'p_etapa', 'p_prox', 'p_hora', 'p_acao', 'p_obs'];

/* ---------------- eventos ---------------- */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, v = b.dataset.v;
  if (a === 'tab') { S.tab = v; S.view = null; S.hist = []; window.scrollTo(0, 0); render(); }
  else if (a === 'irtab') { S.tab = v; S.view = null; S.hist = []; window.scrollTo(0, 0); render(); }
  else if (a === 'fped') { S.fped = v; S._keep = true; render(); }
  else if (a === 'pedido') ir({ t: 'pedido', ref: b.dataset.ref });
  else if (a === 'fichacli') ir({ t: 'ficha', tipo: 'C', ref: b.dataset.ref, resp: v });
  else if (a === 'nf') ir({ t: 'nf', ref: b.dataset.ref });
  else if (a === 'nfmanual') ir({ t: 'nfmanual' });
  else if (a === 'parcelas') ir({ t: 'parcelas', ref: b.dataset.ref });
  else if (a === 'addparc') { lerParcelas(); S.form.linhas.push({ data: '', qtd: '' }); S._keep = true; render(); }
  else if (a === 'remparc') { lerParcelas(); S.form.linhas.splice(+v, 1); S._keep = true; render(); }
  else if (a === 'pedebaixa') { S.confBaixa = b.dataset.ref; S._keep = true; render(); }
  else if (a === 'cancbaixa') { S.confBaixa = null; S._keep = true; render(); }
  else if (a === 'pedeexc') { S.confNF = b.dataset.ref; S._keep = true; render(); }
  else if (a === 'cancexc') { S.confNF = null; S._keep = true; render(); }
  else if (['frac', 'baixar', 'desfazbaixa', 'ligar', 'excnf', 'var', 'importxml'].includes(a)) { await acaoPedidos(a, b); }
  else if (a === 'filtro') { S.filtro = v; S._keep = true; render(); }
  else if (a === 'ordem') { S.ordem = v; S._keep = true; render(); }
  else if (a === 'abrir') ir({ t: 'ficha', tipo: b.dataset.tipo, ref: b.dataset.ref, resp: b.dataset.resp });
  else if (a === 'voltar') voltarTela();
  else if (a === 'registrar') ir({ t: 'contato', tipo: b.dataset.tipo, ref: b.dataset.ref });
  else if (a === 'corrigir') ir({ t: 'corrigir', ref: b.dataset.ref, tipo: 'C' });
  else if (a === 'acessos' || a === 'importar' || a === 'correcoes') ir({ t: a });
  else if (a === 'novaprosp') {
    const q = S.busca && S.busca.livre ? S.busca.q : ''; ir({ t: 'nova' });
    if (q) { S.form = /^[\d.\/\s-]+$/.test(q) ? { cnpj: q } : { nome: q.toUpperCase() }; S.chk = S.busca; render(); }
  }
  else if (a === 'canal') { lerForm(CAMPOS_CONT); S.form.canal = v; S._keep = true; render(); }
  else if (a === 'atalho') { lerForm(CAMPOS_CONT); S.form.prox = addDias(+v); S._keep = true; render(); }
  else if (a === 'semdata') { lerForm(CAMPOS_CONT); S.form.prox = ''; S._keep = true; render(); }
  else if (a === 'primeiro' || a === 'login') { S.form.email = val('l_email'); S.tela = a; S.msg = ''; render(); }
  else if (a === 'sair') { await sb.auth.signOut(); Object.assign(S, { tela: 'login', carregado: false, eu: null, papel: null, view: null, tab: 'pend', msg: '' }); render(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'qcart') { S.q = e.target.value; S._keep = true; render(); }
  if (e.target.id === 'qped') { S.qped = e.target.value; S._keep = true; render(); }
  if (e.target.id === 'qnf') { S.qnf = e.target.value; S._keep = true; render(); }
});
document.addEventListener('change', async e => {
  if (e.target.id === 'fvend') { S.fvend = e.target.value; S._keep = true; render(); return; }
  if (e.target.id === 'nm_ped') { S.form.num = val('nm_num'); S.form.data = val('nm_data'); S.form.pedido = val('nm_ped'); S._keep = true; render(); return; }
  if (e.target.id === 'vpct') { await acaoPedidos('vpct', e.target); return; }
  if (e.target.id === 'p_nome' || e.target.id === 'p_cnpj') {
    lerForm(CAMPOS_PROSP);
    const q = dig(S.form.cnpj).length >= 8 ? S.form.cnpj : S.form.nome;
    S.chk = q ? await buscar(q) : null; S._keep = true; render();
  }
});
document.addEventListener('submit', async e => {
  e.preventDefault();
  const id = e.target.id, btn = e.target.querySelector('[type=submit]');
  if (id === 'fbusca') { const q = val('qbusca'); S.busca = { q }; S.buscando = true; render(); S.busca = await buscar(q); S.buscando = false; render(); return; }
  if (btn) btn.disabled = true;
  try {
    if (id === 'flogin') {
      const email = val('l_email').toLowerCase(), senha = document.getElementById('l_senha').value;
      S.form.email = email;
      const r = S.tela === 'primeiro' ? await sb.auth.signUp({ email, password: senha }) : await sb.auth.signInWithPassword({ email, password: senha });
      if (r.error) {
        const m = r.error.message || '';
        S.msg = /Invalid login/i.test(m) ? 'E-mail ou senha incorretos. No primeiro acesso, use "Criar senha".' : /registered|exists/i.test(m) ? 'Este e-mail já tem senha. Use "Já tenho senha".' : /Password/i.test(m) ? 'A senha precisa ter pelo menos 8 caracteres.' : /confirm/i.test(m) ? 'Falta confirmar o e-mail. Avise o Cristiano.' : 'Não foi possível entrar: ' + m;
        render(); return;
      }
      if (!r.data.session) { S.msg = 'Senha criada. Falta confirmar o e-mail: avise o Cristiano.'; S.tela = 'login'; render(); return; }
      await entrar(); return;
    }
    if (id === 'fcont') {
      const v = S.view, prox = val('prox');
      const doc = { tipo: v.tipo, vendedor: S.eu, data: hoje(), canal: S.form.canal || null, falou: val('falou') || null, etapa: val('etapa'), obs: val('obs') || null, prox: prox || null, hora: val('hora') || null, acao: val('acao') || null,
        pedido: val('ped') || null, valor: parseFloat(val('valor').replace(/\./g, '').replace(',', '.')) || null, origem: 'app' };
      if (v.tipo === 'C') doc.cliente_codigo = String(v.ref); else { doc.prospeccao_id = v.ref; doc.vendedor = (S.prosp.find(x => x.id === v.ref) || {}).vendedor || S.eu; }
      const { data, error } = await sb.from('contatos').insert(doc).select().single(); if (error) throw error;
      S.contatos.push(data);
      if (v.tipo === 'P') {
        const up = { etapa: doc.etapa, ult: doc.data, prox: doc.prox, hora: doc.hora, acao: doc.acao };
        const r2 = await sb.from('prospeccoes').update(up).eq('id', v.ref); if (r2.error) throw r2.error;
        Object.assign(S.prosp.find(x => x.id === v.ref), up);
      }
      voltarTela(); toast(prox ? 'Contato salvo. Volta nas Pendências em ' + dm(prox) + '.' : 'Contato salvo.');
    } else if (id === 'fcorr') {
      const c = cliente(S.view.ref), novos = { contato: val('c_contato'), telefone: val('c_telefone'), cidade: val('c_cidade'), cnpj: val('c_cnpj') }, ins = [];
      Object.keys(novos).forEach(k => { if (novos[k] !== String(c[k] || '')) ins.push({ cliente_codigo: c.codigo, vendedor: S.eu, campo: k, antes: String(c[k] || ''), depois: novos[k] }); });
      if (ins.length) { const { data, error } = await sb.from('correcoes').insert(ins).select(); if (error) throw error; S.corr = S.corr.concat(data); }
      voltarTela(); toast(ins.length ? 'Correção enviada para a gestão.' : 'Nada mudou.');
    } else if (id === 'fprosp') {
      const nome = val('p_nome'); if (!nome) { toast('Preencha o nome da empresa.'); if (btn) btn.disabled = false; return; }
      const doc = { vendedor: S.eu, nome, cnpj: val('p_cnpj') || null, contato: val('p_contato') || null, tel: val('p_tel') || null, uf: val('p_uf').toUpperCase() || null, cidade: val('p_cidade').toUpperCase() || null, email: val('p_email') || null,
        origem: val('p_origem'), etapa: val('p_etapa'), criado: hoje(), ult: hoje(), prox: val('p_prox') || null, hora: val('p_hora') || null, acao: val('p_acao') || null, obs: val('p_obs') || null };
      const { data, error } = await sb.from('prospeccoes').insert(doc).select().single(); if (error) throw error;
      S.prosp.push(data); ir({ t: 'ficha', tipo: 'P', ref: data.id }, true); toast('Prospecção salva no seu nome.');
    } else if (id === 'fparc') {
      const it = S.itens.find(i => i.of === S.view.ref), l = lerParcelas().filter(x => x.data && x.qtd > 0);
      const soma = l.reduce((s, x) => s + x.qtd, 0);
      if (!l.length) { toast('Informe pelo menos uma entrega.'); if (btn) btn.disabled = false; return; }
      if (Math.abs(soma - (Number(it.qtd) || 0)) > 0.001) { toast('A soma (' + fmtQ(soma) + ') precisa fechar com ' + fmtQ(it.qtd) + '.'); S._keep = true; render(); return; }
      const r1 = await sb.from('parcelas').delete().eq('of', it.of); if (r1.error) throw r1.error;
      const { data, error } = await sb.from('parcelas').insert(l.map(x => ({ of: it.of, data: x.data, qtd: x.qtd, por: S.eu }))).select(); if (error) throw error;
      S.parcelas = S.parcelas.filter(p => p.of !== it.of).concat(data);
      if (!it.fracionado) { const r2 = await sb.from('pedido_itens').update({ fracionado: true }).eq('of', it.of); if (r2.error) throw r2.error; it.fracionado = true; }
      voltarTela(); toast('Entregas salvas: ' + l.length + ' datas.');
    } else if (id === 'fnfman') {
      const p = pedidoDe(val('nm_ped')), num = val('nm_num'), data = val('nm_data');
      const linhas = [...document.querySelectorAll('[id^=nm_q_]')].map((el, k) => ({ of: el.dataset.of, qtd: parseFloat(el.value.replace(/\./g, '').replace(',', '.')) || 0, k })).filter(x => x.qtd > 0);
      if (!p || !num || !linhas.length) { toast('Preencha o nº da NF, o pedido e ao menos uma quantidade.'); if (btn) btn.disabled = false; return; }
      const c = S.clientes.find(x => x.codigo === p.cliente_codigo) || {};
      const chave = 'manual-' + num;
      if (S.nfs.some(n => n.chave === chave)) { toast('A NF ' + num + ' já foi lançada.'); if (btn) btn.disabled = false; return; }
      const r1 = await sb.from('nfs').insert({ chave, numero: num, data, cnpj: c.cnpj || null, cliente: c.nome || p.cliente, origem: 'manual', por: S.eu }).select().single(); if (r1.error) throw r1.error;
      const r2 = await sb.from('nf_itens').insert(linhas.map((x, i) => { const it = S.itens.find(y => y.of === x.of) || {}; return { chave, item: i + 1, pedido: p.numero, of: x.of, produto: it.produto, qtd: x.qtd }; })).select(); if (r2.error) throw r2.error;
      S.nfs.push(r1.data); S.nfItens = S.nfItens.concat(r2.data);
      ir({ t: 'nf', ref: chave }, true); toast('NF ' + num + ' lançada. Saldos atualizados.');
    } else if (id === 'facessos') {
      const ups = [];
      S.vendedores.slice().sort((a, b) => a.nome < b.nome ? -1 : 1).forEach((v, i) => {
        const em = (val('ac_' + i) || '').toLowerCase() || null, at = document.getElementById('at_' + i).checked;
        if (em !== (v.email || null) || at !== v.ativo) ups.push({ nome: v.nome, email: em, ativo: at, papel: v.papel });
      });
      for (const u of ups) { const { error } = await sb.from('vendedores').update({ email: u.email, ativo: u.ativo }).eq('nome', u.nome); if (error) throw error; }
      S.vendedores = await todos('vendedores'); ir(null); toast(ups.length ? 'Acessos salvos.' : 'Nada mudou.');
    } else if (id === 'fimport') {
      await importar(document.getElementById('arq').files[0], document.getElementById('remover').checked);
    }
  } catch (err) {
    if (btn) btn.disabled = false;
    console.error(err);
    toast(/duplicate|unique/i.test(err.message || '') ? 'Esse e-mail já está em outra pessoa.' : 'Não salvou. Confira a internet e tente de novo.');
  }
});

/* ---------------- ações de pedidos, saldos e notas ---------------- */
async function acaoPedidos(a, b) {
  try {
    if (a === 'frac') {
      const it = S.itens.find(i => i.of === b.dataset.ref), sim = b.dataset.v === '1';
      if (it.fracionado === sim) return;
      const { error } = await sb.from('pedido_itens').update({ fracionado: sim }).eq('of', it.of); if (error) throw error;
      it.fracionado = sim;
      if (sim && !parcelasDe(it.of).length) { ir({ t: 'parcelas', ref: it.of }); return; }
      S._keep = true; render();
    } else if (a === 'baixar' || a === 'desfazbaixa') {
      const it = S.itens.find(i => i.of === b.dataset.ref), sim = a === 'baixar';
      const motivo = sim ? (val('bx_' + it.of) || null) : null;
      const { data, error } = await sb.from('pedido_itens').update({ baixado: sim, baixa_motivo: motivo }).eq('of', it.of).select().single(); if (error) throw error;
      Object.assign(it, data); S.confBaixa = null; S._keep = true; render(); toast(sim ? 'Saldo baixado. Item atendido.' : 'Baixa desfeita.');
    } else if (a === 'ligar') {
      const x = S.nfItens.find(y => y.id === b.dataset.ref), of = val('lig_' + x.id);
      if (!of) { toast('Escolha a O.F.'); return; }
      const ped = (S.itens.find(i => i.of === of) || {}).pedido;
      const { data, error } = await sb.from('nf_itens').update({ of, pedido: ped }).eq('id', x.id).select().single(); if (error) throw error;
      Object.assign(x, data); S._keep = true; render(); toast('Item ligado à O.F. ' + of + '.');
    } else if (a === 'excnf') {
      const k = b.dataset.ref, { error } = await sb.from('nfs').delete().eq('chave', k); if (error) throw error;
      S.nfs = S.nfs.filter(n => n.chave !== k); S.nfItens = S.nfItens.filter(x => x.chave !== k); voltarTela(); toast('Nota excluída.');
    } else if (a === 'importxml') {
      const fs = document.getElementById('xmls').files; if (!fs.length) { toast('Escolha os arquivos XML.'); return; }
      await importarXML([...fs]);
    } else if (a === 'var' || a === 'vpct') {
      const cod = b.dataset.ref, atual = variacaoDe(cod);
      const reg = { codigo: String(cod), aceita: a === 'var' ? b.dataset.v === '1' : atual.aceita, pct: a === 'vpct' ? (parseFloat(String(b.value).replace(',', '.')) || 0) : atual.pct, por: S.eu, em: new Date().toISOString() };
      const { data, error } = await sb.from('cliente_variacao').upsert(reg, { onConflict: 'codigo' }).select().single(); if (error) throw error;
      S.variacao = S.variacao.filter(x => x.codigo !== reg.codigo).concat(data); S._keep = true; render(); toast('Variação salva.');
    }
  } catch (err) { console.error(err); toast(/suporte/i.test(err.message || '') ? 'Só o suporte pode dar baixa.' : 'Não salvou. Confira a internet e tente de novo.'); }
}

/* ---------------- importação (só gestor) ---------------- */
async function importar(arq, remover) {
  const st = t => { const el = document.getElementById('progresso'); if (el) el.textContent = t; };
  const d = JSON.parse(await arq.text());
  const lotes = async (tab, linhas, opc) => { for (let i = 0; i < linhas.length; i += 500) { st(`${tab}: ${Math.min(i + 500, linhas.length)} de ${linhas.length}`); const { error } = await sb.from(tab).upsert(linhas.slice(i, i + 500), opc); if (error) throw error; } };
  const existentes = new Set((await todos('vendedores')).map(v => v.nome));
  const novosV = (d.vendedores || []).filter(v => !existentes.has(v.nome));
  if (novosV.length) await lotes('vendedores', novosV, { onConflict: 'nome', ignoreDuplicates: true });
  await lotes('clientes', d.clientes || [], { onConflict: 'id' });
  await lotes('pedidos', d.pedidos || [], { onConflict: 'numero' });
  await lotes('pedido_itens', d.pedido_itens || [], { onConflict: 'of' });
  await lotes('prospeccoes', d.prospeccoes || [], { onConflict: 'id', ignoreDuplicates: true });
  await lotes('contatos', d.contatos || [], { onConflict: 'id', ignoreDuplicates: true });
  if (remover && d.clientes && d.clientes.length > 100) {
    const ids = new Set(d.clientes.map(c => c.id)), sair = (await todos('clientes')).filter(c => !ids.has(c.id)).map(c => c.id);
    for (let i = 0; i < sair.length; i += 200) { const { error } = await sb.from('clientes').delete().in('id', sair.slice(i, i + 200)); if (error) throw error; }
  }
  st('Recarregando…'); await carregar(); ir(null); toast('Dados importados: ' + (d.clientes || []).length + ' clientes, ' + (d.pedidos || []).length + ' pedidos e ' + (d.pedido_itens || []).length + ' itens.');
}

/* ---------------- início ---------------- */
async function entrar() {
  const { data, error } = await sb.rpc('meu_perfil');
  if (error || !data || !data.length) { S.tela = 'semacesso'; render(); return; }
  S.eu = data[0].nome; S.papel = data[0].papel; S.tela = 'app'; S.carregado = false; if (S.papel === 'suporte') S.tab = 'entregas'; render();
  try { await carregar(); } catch (e) { console.error(e); S.tela = 'app'; toast('Não foi possível carregar. Recarregue a página.'); }
  render();
}
(async function () {
  if (!window.supabase || !CFG.supabaseUrl || /COLE_AQUI/.test(CFG.supabaseUrl)) {
    $app.innerHTML = '<div class="head"><div class="brand"><b>FERMANI</b></div><h1>App em configuração</h1></div><div class="main"><div class="empty"><b>Falta ligar o banco de dados</b><span>O Cristiano está terminando a instalação.</span></div></div>';
    return;
  }
  sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
  const { data } = await sb.auth.getSession();
  if (data && data.session) await entrar(); else { S.tela = 'login'; render(); }
  document.addEventListener('visibilitychange', async () => { if (document.visibilityState === 'visible' && S.tela === 'app' && S.carregado && !S.view) { try { await carregar(); S._keep = true; render(); } catch (e) {} } });
})();
})();
