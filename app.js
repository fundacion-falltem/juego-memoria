'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===== Versión ===== */
  const VERSION = "v1.0";
  const versionEl = document.getElementById('versionLabel');
  if (versionEl) versionEl.textContent = VERSION;

  /* ===== Refs ===== */
  const juegoEl     = document.getElementById('juego');
  const estadoEl    = document.getElementById('estado');
  const intentosEl  = document.getElementById('intentos');
  const aciertosEl  = document.getElementById('aciertos');
  const totalEl     = document.getElementById('total');

  const selTam      = document.getElementById('tamano');
  const selDif      = document.getElementById('dificultad');
  const btnComenzar = document.getElementById('btnComenzar');
  const btnReiniciar= document.getElementById('btnReiniciar');

  const themeBtn    = document.getElementById('themeToggle');
  const aboutBtn    = document.getElementById('aboutBtn');
  const aboutModal  = document.getElementById('aboutModal');
  const aboutClose  = document.getElementById('aboutClose');

  /* ===== Util ===== */
  const el = (tag, cls, text) => { const n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=String(text); return n; };
  const barajar = arr => { for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; };

  /* ===== Tema ===== */
  function applyTheme(mode){
    const m=(mode==='light'||mode==='dark')?mode:'dark';
    document.documentElement.setAttribute('data-theme', m);
    if (themeBtn){
      const isDark = (m === 'dark');
      themeBtn.textContent = isDark ? '🌞 Cambiar a claro' : '🌙 Cambiar a oscuro';
      themeBtn.setAttribute('aria-pressed', String(isDark));
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', m === 'dark' ? '#0b0b0b' : '#ffffff');
  }
  (function initTheme(){
    let mode='dark';
    try{
      const stored=localStorage.getItem('theme');
      if(stored==='light'||stored==='dark') mode=stored;
      else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) mode='light';
    }catch{}
    applyTheme(mode);
  })();
  themeBtn?.addEventListener('click', ()=>{
    const cur=document.documentElement.getAttribute('data-theme')||'dark';
    const next=cur==='dark'?'light':'dark';
    try{ localStorage.setItem('theme', next);}catch{}
    applyTheme(next);
  });

  /* ===== Tamaño ===== */
  function aplicarTam(){
    const muy = selTam?.value === 'muy-grande';
    document.documentElement.classList.toggle('muy-grande', !!muy);
    try{ localStorage.setItem('mem_tamano', muy ? 'muy-grande' : 'grande'); }catch{}
  }
  selTam?.addEventListener('change', aplicarTam);
  try{ const pref=localStorage.getItem('mem_tamano'); if(pref==='muy-grande') selTam.value='muy-grande'; }catch{} aplicarTam();

  /* ===== Modal ayuda ===== */
  function openAbout(){ aboutModal?.setAttribute('aria-hidden','false'); aboutClose?.focus(); }
  function closeAbout(){ aboutModal?.setAttribute('aria-hidden','true'); }
  aboutBtn?.addEventListener('click', openAbout);
  aboutClose?.addEventListener('click', closeAbout);
  aboutModal?.addEventListener('click', (e)=>{ if(e.target===aboutModal) closeAbout(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeAbout(); });

  /* ===== Juego de memoria ===== */
  const EMOJIS = ["🍎","🍐","🍊","🍌","🍇","🍋","🍓","🍉","🍈","🍑",
                  "🐶","🐱","🐭","🐹","🐰","🐻","🐼","🐨","🐯","🦊",
                  "🚗","🚌","🚲","🚕","🚑","🚒","🚜","✈️","⛵","🚆",
                  "🎵","🎹","🥁","🎺","🎻","🎸","🎧","📚","🖥️","📷"];

  let totalParejas = 8;
  let intentos = 0;
  let aciertos = 0;
  let primera = null;   // {el, valor}
  let bloqueo = false;  // evita clicks mientras se comparan

  function actualizarEstado(){
    intentosEl.textContent = String(intentos);
    aciertosEl.textContent = String(aciertos);
    totalEl.textContent = String(totalParejas);
  }

  function crearCarta(valor, idx){
    const btn = el('button','carta');
    btn.type = 'button';
    btn.setAttribute('data-estado','oculta');
    btn.setAttribute('aria-label','Carta oculta');
    btn.setAttribute('data-valor', valor);
    btn.setAttribute('data-idx', String(idx));

    const front = el('div','cara-front', valor);
    const back  = el('div','cara-back','?');
    btn.appendChild(front); btn.appendChild(back);

    btn.addEventListener('click', ()=> voltear(btn));
    btn.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); btn.click(); }});
    return btn;
  }

  function voltear(btn){
    if (bloqueo) return;
    if (btn.getAttribute('data-estado') !== 'oculta') return;

    btn.setAttribute('data-estado','visible');
    btn.setAttribute('aria-label',`Carta: ${btn.getAttribute('data-valor')}`);

    if (!primera){
      primera = { el: btn, valor: btn.getAttribute('data-valor') };
      return;
    }

    const segunda = { el: btn, valor: btn.getAttribute('data-valor') };
    bloqueo = true;
    intentos++;

    if (primera.valor === segunda.valor){
      setTimeout(()=>{
        primera.el.setAttribute('data-estado','resuelta');
        segunda.el.setAttribute('data-estado','resuelta');
        primera.el.setAttribute('aria-label',`Pareja: ${primera.valor} (resuelta)`);
        segunda.el.setAttribute('aria-label',`Pareja: ${segunda.valor} (resuelta)`);
        aciertos++;
        primera = null; bloqueo = false; actualizarEstado();
        if (aciertos === totalParejas) finDeJuego();
      }, 200);
    } else {
      setTimeout(()=>{
        primera.el.setAttribute('data-estado','oculta');
        primera.el.setAttribute('aria-label','Carta oculta');
        segunda.el.setAttribute('data-estado','oculta');
        segunda.el.setAttribute('aria-label','Carta oculta');
        primera = null; bloqueo = false; actualizarEstado();
      }, 600);
    }
  }

  function finDeJuego(){
    while (juegoEl.firstChild) juegoEl.removeChild(juegoEl.firstChild);
    const card = el('div','tarjeta');
    card.appendChild(el('p','pregunta','🎉 ¡Completaste todas las parejas!'));
    card.appendChild(el('p',null,`Intentos: ${intentos} · Parejas: ${aciertos}/${totalParejas}`));
    const acciones = el('div','acciones');
    const btnOtra = el('button','btn principal','Jugar de nuevo');
    btnOtra.addEventListener('click', iniciar);
    acciones.appendChild(btnOtra);
    card.appendChild(acciones);
    juegoEl.appendChild(card);

    btnReiniciar.hidden = false;
    btnComenzar.hidden  = true;
  }

  function iniciar(){
    intentos = 0; aciertos = 0; primera = null; bloqueo = false;
    totalParejas = Number(selDif.value || 8);

    const pool = barajar(EMOJIS.slice()).slice(0, totalParejas);
    const mazo = barajar([...pool, ...pool]);

    while (juegoEl.firstChild) juegoEl.removeChild(juegoEl.firstChild);
    const grid = el('div','juego-grid');
    mazo.forEach((v, i)=> grid.appendChild(crearCarta(v, i)));
    juegoEl.appendChild(grid);

    btnComenzar.hidden = true;
    btnReiniciar.hidden = false;
    estadoEl.hidden = false;
    actualizarEstado();
  }

  /* ===== Botones ===== */
  btnComenzar?.addEventListener('click', iniciar);
  btnReiniciar?.addEventListener('click', ()=>{
    btnComenzar.hidden = false;
    btnReiniciar.hidden = true;
    while (juegoEl.firstChild) juegoEl.removeChild(juegoEl.firstChild);
    intentos = 0; aciertos = 0; actualizarEstado();
  });
});
