/* Avisos e treinamentos nas telas da fábrica e da consulta técnica (Paula · PCP, 16/11/2026).
   Usa as mesmas tabelas do CRM: treinamentos (público por departamento) e treinamento_registros (assinatura).
   Só aparece de segunda a sexta, das 06:20 às 15:30. "Ver depois" vale uma vez, por 24 horas. */
(function () {
  'use strict';
  const CFG = window.CRM_CONFIG || {};
  const TOL_H = 24;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tx = s => esc(s).replace(/&lt;(\/?)b&gt;/g, '<$1b>');
  const quando = d => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' às');
  function expediente(d) {
    d = d || new Date();
    const dia = d.getDay(), m = d.getHours() * 60 + d.getMinutes();
    return dia >= 1 && dia <= 5 && m >= 380 && m <= 930;
  }
  const st = document.createElement('style');
  st.textContent = `#trv{position:fixed;inset:0;z-index:9999;background:#F4F1EA;overflow:auto;font-family:Figtree,system-ui,sans-serif;color:#0A3440}
#trv .hd{background:#0A3440;color:#fff;padding:18px 18px 14px}#trv .hd small{color:#E8C27A;font-weight:700;letter-spacing:.06em;font-size:12px;text-transform:uppercase}
#trv .hd h1{font-family:Archivo,sans-serif;font-size:22px;margin:6px 0 0}#trv .bd{max-width:640px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:12px}
#trv .sl{background:#fff;border-radius:16px;padding:20px 18px;border-top:5px solid #0E4C5C;display:flex;flex-direction:column;gap:10px;min-height:48vh}
#trv .sl.esc{background:#0E4C5C;color:#fff;border-top-color:#C8963E}#trv .eye{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#C8963E}
#trv h2{font-family:Archivo,sans-serif;font-size:21px;margin:0}#trv .it{display:flex;flex-direction:column;gap:2px;padding:9px 0;border-bottom:1px solid rgba(10,52,64,.1);font-size:16px;line-height:1.4}
#trv .sl.esc .it{border-color:rgba(255,255,255,.18)}#trv .it b{font-size:15px}#trv .prog{display:flex;gap:4px}#trv .prog i{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.25)}
#trv .prog i.ok{background:#E8C27A}#trv .prog i.at{background:#fff}#trv .nav{display:flex;gap:10px}#trv button{font:inherit;font-weight:700;font-size:16px;border-radius:12px;padding:14px;border:0;background:#0E4C5C;color:#fff;flex:1;cursor:pointer}
#trv button.gh{background:#fff;color:#0E4C5C;border:2px solid #0E4C5C}#trv button:disabled{opacity:.45}#trv .cd{background:#fff;border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px}
#trv label{font-weight:600}#trv input[type=text]{font:inherit;font-size:16px;padding:12px;border:1.5px solid #BFD3D8;border-radius:10px}#trv canvas{width:100%;height:170px;border:1.5px dashed #0E4C5C;border-radius:10px;background:#fff;touch-action:none}
#trv .sub{font-size:14px;color:#4A6470}#trv .bal{background:#fff;border-left:5px solid #C8963E;border-radius:12px;padding:14px 16px;font-size:16px;line-height:1.45}`;
  document.head.appendChild(st);

  let sb, eu, depto, T, reg = [], V = {};
  const meus = t => reg.filter(r => r.treinamento_id === t.id);
  const tem = (t, tipo) => meus(t).find(r => r.tipo === tipo);
  function pendente() {
    for (const t of T) {
      if (tem(t, 'assinado')) continue;
      const ad = tem(t, 'adiado'), ate = ad ? new Date(new Date(ad.criado).getTime() + TOL_H * 3600e3) : null;
      return { t, ad, ate, bloqueia: !ad || ate <= new Date() };
    }
    return null;
  }
  async function gravar(t, tipo, extra) {
    const { data, error } = await sb.from('treinamento_registros').insert(Object.assign({ treinamento_id: t.id, nome: eu, departamento: depto, tipo, aparelho: (navigator.userAgent || '').slice(0, 200) }, extra || {})).select();
    if (error) throw error;
    reg = reg.concat(data && data.length ? data : [Object.assign({ treinamento_id: t.id, nome: eu, tipo, criado: new Date().toISOString() }, extra || {})]);
  }
  function caixa() { let d = document.getElementById('trv'); if (!d) { d = document.createElement('div'); d.id = 'trv'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); document.body.appendChild(d); } return d; }
  function fechar() { const d = document.getElementById('trv'); if (d) d.remove(); document.body.style.overflow = ''; }
  function quem(t) { return t.tipo === 'pcp' ? 'Paula · PCP' : 'Treinamento Fermani'; }
  function telaAviso(p) {
    const t = p.t, n = (t.slides || []).length, ate = new Date(Date.now() + TOL_H * 3600e3);
    caixa().innerHTML = `<div class="hd"><small>📣 Aviso · ${esc(quem(t))}</small><h1>${esc(t.titulo)}</h1></div><div class="bd">
      <div class="bal">${esc((eu || '').split(' ')[0])}, ${t.tipo === 'pcp' ? 'a programação mudou. Veja o resumo' : 'temos novidades. Veja a apresentação'} (${n} telas, cerca de ${t.carga_min || 10} min) e assine no fim.${p.ad ? ` <b>O prazo para ver depois acabou${p.ate > new Date() ? ' em ' + quando(p.ate) : ''}.</b>` : ''}</div>
      <button data-tr="ver">Ver agora</button>${p.bloqueia && p.ad ? '' : `<button class="gh" data-tr="adiar">Ver depois (uma vez só, até ${quando(ate)})</button>`}
      <div class="sub">Fica registrado em Cursos e treinamentos da Fermani.</div></div>`;
    document.body.style.overflow = 'hidden';
  }
  function telaSlide() {
    const t = V.t, sl = t.slides || [], n = sl.length, i = V.i;
    const prog = `<div class="prog">${sl.map((_, k) => `<i class="${k < i ? 'ok' : k === i ? 'at' : ''}"></i>`).join('')}<i class="${i === n ? 'at' : ''}"></i></div>`;
    const hd = `<div class="hd"><small>${i < n ? `Tela ${i + 1} de ${n}` : 'Assinatura'}</small><h1>${esc(t.titulo)}</h1>${prog}</div>`;
    if (i < n) {
      const s = sl[i];
      caixa().innerHTML = hd + `<div class="bd"><div class="sl${s.escuro ? ' esc' : ''}">${s.eye ? `<div class="eye">${tx(s.eye)}</div>` : ''}<h2>${tx(s.tit || '')}</h2>${(s.itens || []).map(x => Array.isArray(x) ? `<div class="it"><b>${tx(x[0])}</b><span>${tx(x[1])}</span></div>` : `<div class="it"><span>${tx(x)}</span></div>`).join('')}</div>
        <div class="nav"><button class="gh" data-tr="ir" data-v="${i - 1}"${i === 0 ? ' disabled' : ''}>‹ Anterior</button><button data-tr="ir" data-v="${i + 1}">${i === n - 1 ? 'Ir para a assinatura ›' : 'Próximo ›'}</button></div></div>`;
    } else {
      caixa().innerHTML = hd + `<div class="bd"><div class="cd"><b>✍️ Assinatura</b><div>Declaro que vi <b>${esc(t.titulo)}</b>${t.versao ? ' (versão ' + esc(t.versao) + ')' : ''} e entendi as mudanças.</div>
        <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="trok" style="width:22px;height:22px"> Li e entendi</label>
        <label for="trnm">Seu nome completo</label><input type="text" id="trnm" autocomplete="name" placeholder="Nome e sobrenome">
        <label for="trcv">Assine com o dedo</label><canvas id="trcv" aria-label="Área para assinar"></canvas>
        <button class="gh" data-tr="limpa" style="flex:none;align-self:flex-start;padding:8px 14px;font-size:14px">Limpar assinatura</button></div>
        <button id="trbt" data-tr="assina" disabled>Assinar e concluir</button><button class="gh" data-tr="ir" data-v="${n - 1}">‹ Voltar</button>
        <div class="sub">Fica registrado: nome, data e hora, tempo na apresentação e a assinatura.</div></div>`;
      ligar();
    }
    caixa().scrollTop = 0;
  }
  function ligar() {
    const cv = document.getElementById('trcv'), ok = document.getElementById('trok'), nm = document.getElementById('trnm'), bt = document.getElementById('trbt');
    V.img = null; V.traco = 0;
    const chk = () => { bt.disabled = !(ok.checked && nm.value.trim().split(/\s+/).length >= 2 && V.traco >= 12); };
    ok.addEventListener('change', chk); nm.addEventListener('input', chk);
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    const g = cv.getContext('2d'); g.scale(dpr, dpr); g.lineWidth = 2.6; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#0A3440';
    let on = false, last = null;
    const pt = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    cv.addEventListener('pointerdown', e => { on = true; last = pt(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (!on) return; const p = pt(e); g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p; V.traco++; });
    const fim = () => { if (!on) return; on = false; V.img = cv.toDataURL('image/png'); chk(); };
    cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim); cv.addEventListener('pointerleave', fim);
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest && e.target.closest('#trv [data-tr]'); if (!b) return;
    const a = b.dataset.tr, p = pendente();
    if (a === 'ver' && p) { V = { t: p.t, i: 0, t0: Date.now() }; telaSlide(); }
    else if (a === 'ir') { const n = +b.dataset.v; if (n < 0) return; V.i = n; telaSlide(); }
    else if (a === 'limpa') { telaSlide(); }
    else if (a === 'adiar' && p) { b.disabled = true; try { await gravar(p.t, 'adiado'); fechar(); } catch (er) { b.disabled = false; alert('Não foi possível adiar. Confira a internet.'); } }
    else if (a === 'assina') {
      const nome = (document.getElementById('trnm').value || '').trim();
      if (!V.img || V.traco < 12) return;
      b.disabled = true;
      try { await gravar(V.t, 'assinado', { nome_digitado: nome.slice(0, 120), assinatura: V.img, tempo_seg: Math.round((Date.now() - V.t0) / 1000) }); }
      catch (er) { b.disabled = false; alert('Não foi possível gravar a assinatura. Confira a internet.'); return; }
      fechar(); const q = pendente(); if (q && expediente()) telaAviso(q);
    }
  });
  async function checar() {
    if (!expediente() || document.getElementById('trv')) return;
    try {
      if (!sb) {
        if (!window.supabase || !CFG.supabaseUrl) return;
        sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
        const { data: ss } = await sb.auth.getSession(); if (!ss || !ss.session) { sb = null; return; }
        const { data: p } = await sb.rpc('meu_perfil'); if (!p || !p.length) { sb = null; return; }
        eu = p[0].nome; const d = await sb.rpc('meu_depto'); depto = d.error ? null : d.data;
      }
      if (!depto) return;
      const { data: tr, error } = await sb.from('treinamentos').select('*').neq('ativo', false).order('publicado');
      if (error) return;
      T = (tr || []).filter(t => (t.departamentos || []).some(x => String(x).toLowerCase() === String(depto).toLowerCase()));
      if (!T.length) return;
      const { data: rg } = await sb.from('treinamento_registros').select('id,treinamento_id,tipo,criado').eq('nome', eu).in('treinamento_id', T.map(t => t.id));
      reg = rg || [];
      const p = pendente(); if (p) telaAviso(p);
    } catch (e) { console.error(e); }
  }
  window.addEventListener('load', () => setTimeout(checar, 1500));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checar(); });
  setInterval(() => { if (document.visibilityState === 'visible') checar(); }, 15 * 60e3);
})();
