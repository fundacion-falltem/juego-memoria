'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===== Versión centralizada ===== */
  const VERSION = "plantilla-1.0";
  const versionEl = document.getElementById('versionLabel');
  if (versionEl) versionEl.textContent = VERSION;
  console.log("VERSIÓN ACTIVA:", VERSION);

  /* ===== Refs UI ===== */
  const juegoEl     = document.getElementById('juego');
  const estadoEl    = document.getElementById('estado');
  const selTam      = document.getElementById('tamano');
  const btnComenzar = document.getElementById('btnComenzar');
  const btnReiniciar= document.getElementById('btnReiniciar');
  const themeBtn    = document.getElementById('themeToggle');
  const aboutBtn    = document.getElementById('aboutBtn');
  const aboutModal  = document.getElementById('aboutModal');
  const aboutClose  = document.getElementById('aboutClose');

  /* ===== Utilidades pequeñas ===== */
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  };

  /* ===== Tema claro/oscuro ===== */
  function applyTheme(mode){
    const m = (mode === 'light' || mode === 'dark') ? mode : 'dark';
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
    let mode = 'dark';
    try{
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') mode = stored;
      else if (window.matchMedia?.('(prefers-color-scheme: light)').matches) mode = 'light';
    }catch{}
    applyTheme(mode);
  })();
  themeBtn?.addEventListener('click', ()=>{
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    try{ localStorage.setItem('theme', next); }catch{}
    applyTheme(next);
  });

  /* ===== Tamaño accesible ===== */
  function aplicarTam(){
    const muy = selTam?.value === 'muy-grande';
    document.documentElement.classList.toggle('muy-grande', !!muy);
    try{ localStorage.setItem('plantilla_tamano', muy ? 'muy-grande' : 'grande'); }catch{}
  }
  selTam?.addEventListener('change', aplicarTam);
  try{
    const prefTam = localStorage.getItem('plantilla_tamano');
    if (prefTam === 'muy-grande') { selTam.value = 'muy-grande'; }
    aplicarTam();
  }catch{}

  /* ===== Modal ayuda ===== */
  function openAbout(){ aboutModal?.setAttribute('aria-hidden','false'); aboutClose?.focus(); }
  function closeAbout(){ aboutModal?.setAttribute('aria-hidden','true'); }
  aboutBtn?.addEventListener('click', openAbout);
  aboutClose?.addEventListener('click', closeAbout);
  aboutModal?.addEventListener('click', (e)=>{ if(e.target===aboutModal) closeAbout(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeAbout(); });

  /* ===== Hook del juego =====
     Reemplazá SOLO esta función en cada proyecto.
     Debe: limpiar #juego, crear una tarjeta, y montar la lógica. */
  function iniciarJuego(){
    // Limpieza
    while (juegoEl.firstChild) juegoEl.removeChild(juegoEl.firstChild);
    estadoEl?.removeAttribute('hidden');

    // Tarjeta base
    const card = el('div','tarjeta');
    card.appendChild(el('p','pregunta','👋 Plantilla lista'));
    card.appendChild(el('p',null,'Reemplazá esta función con la lógica del juego.'));
    // Acciones de ejemplo
    const acciones = el('div','acciones');
    const btnEj = el('button','btn principal','Acción de ejemplo');
    btnEj.addEventListener('click', ()=> alert('¡Funcionando! Reemplazá por tu juego.'));
    acciones.appendChild(btnEj);
    card.appendChild(acciones);

    juegoEl.appendChild(card);
  }

  /* ===== Botones Comenzar / Reiniciar ===== */
  btnComenzar?.addEventListener('click', ()=>{
    btnComenzar.hidden = true;
    btnReiniciar.hidden = false;
    iniciarJuego();
  });
  btnReiniciar?.addEventListener('click', ()=>{
    btnComenzar.hidden = false;
    btnReiniciar.hidden = true;
    while (juegoEl.firstChild) juegoEl.removeChild(juegoEl.firstChild);
    estadoEl?.setAttribute('hidden','');
  });
});
