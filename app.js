'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===== Versión ===== */
  const VERSION = "v1.3 (FALLTEM light + a11y grid)";
  const versionEl = document.getElementById('versionLabel');
  if (versionEl) versionEl.textContent = VERSION;

  /* ===== Refs ===== */
  const juegoEl     = document.getElementById('juego');
  const estadoEl    = document.getElementById('estado');
  const intentosEl  = document.getElementById('intentos');
  const aciertosEl  = document.getElementById('aciertos');
  const totalEl     = document.getElementById('total');
  const pbFill      = document.getElementById('pbFill');

  const selTam      = document.getElementById('tamano');
  const selDif      = document.getElementById('dificultad');
  const btnComenzar = document.getElementById('btnComenzar');
  const btnReiniciar= document.getElementById('btnReiniciar');

  const themeBtn    = document.getElementById('themeToggle');
  const aboutBtn    = document.getElementById('aboutBtn');
  const aboutModal  = document.getElementById('aboutModal');
  const aboutClose  = document.getElementById('aboutClose');

  // Audio de victoria
  const sndWin = document.getElementById('sndWin');
  let audioDesbloqueado = false;

  /* ===== Util ===== */
  const el = (tag, cls, text) => { const n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=String(text); return n; };
  const barajar = arr => { for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; };

  /* ===== Tema (LIGHT por defecto) ===== */
  function labelFor(mode){
    return mode === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro';
  }
  function applyTheme(mode){
    const m = (mode==='dark') ? 'dark' : 'light'; // default light
    document.documentElement.setAttribute('data-theme', m);
    if (themeBtn){
      themeBtn.textContent = labelFor(m);
      themeBtn.setAttribute('aria-pressed', String(m==='dark'));
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', m === 'dark' ? '#0b0b0b' : '#f8fbf4');
  }
  (function initTheme(){
    let mode='light';
    try{
      const stored=localStorage.getItem('theme');
      if(stored==='light'||stored==='dark') mode=stored;
    }catch{}
    applyTheme(mode);
  })();
  themeBtn?.addEventListener('click', ()=>{
    const cur=document.documentElement.getAttribute('data-theme')||'light';
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
    if (pbFill && totalParejas > 0){
      const pct = Math.round((aciertos / totalParejas) * 100);
      pbFill.style.width = pct + '%';
    }
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

  // helper: obtiene el grid actual (si existe)
  function getGrid(){
    return juegoEl.querySelector('.juego-grid');
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
    // bloqueamos accesible el grid durante la comparación
    const grid = getGrid();
    grid?.setAttribute('aria-busy','true');

    intentos++;

    if (primera.valor === segunda.valor){
      // feedback positivo
      primera.el.classList.add('fx-ok');
      segunda.el.classList.add('fx-ok');

      setTimeout(()=>{
        primera.el.setAttribute('data-estado','resuelta');
        segunda.el.setAttribute('data-estado','resuelta');
        primera.el.setAttribute('aria-label',`Pareja: ${primera.valor} (resuelta)`);
        segunda.el.setAttribute('aria-label',`Pareja: ${segunda.valor} (resuelta)`);
        aciertos++;

        // limpiar efecto
        setTimeout(()=>{
          primera.el.classList.remove('fx-ok');
          segunda.el.classList.remove('fx-ok');
        }, 200);

        primera = null; bloqueo = false; actualizarEstado();
        grid?.removeAttribute('aria-busy');
        if (aciertos === totalParejas) finDeJuego();
      }, 200);
    } else {
      // feedback de no-coincidencia (suave)
      primera.el.classList.add('fx-bad');
      segunda.el.classList.add('fx-bad');

      setTimeout(()=>{
        primera.el.classList.remove('fx-bad');
        segunda.el.classList.remove('fx-bad');

        primera.el.setAttribute('data-estado','oculta');
        primera.el.setAttribute('aria-label','Carta oculta');
        segunda.el.setAttribute('data-estado','oculta');
        segunda.el.setAttribute('aria-label','Carta oculta');

        primera = null; bloqueo = false; actualizarEstado();
        grid?.removeAttribute('aria-busy');
      }, 600);
    }
  }

  function finDeJuego(){
    if (pbFill) pbFill.style.width = '100%';

    // Reproducir sonido de victoria si está disponible
    if (sndWin) {
      try {
        sndWin.currentTime = 0;
        sndWin.play().catch(()=>{});
      } catch {}
    }

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
    totalParejas = Number(selDif?.value || 8);

    const pool = barajar(EMOJIS.slice()).slice(0, totalParejas);
    const mazo = barajar([...pool, ...pool]);

    while (juegoEl.firstChild) juegoEl.removeChild(juegoEl.firstChild);
    const grid = el('div','juego-grid');
    grid.setAttribute('role','grid');
    grid.setAttribute('aria-label','Tablero de cartas');
    grid.setAttribute('aria-busy','false');

    mazo.forEach((v, i)=> grid.appendChild(crearCarta(v, i)));
    juegoEl.appendChild(grid);

    // UI
    btnComenzar.hidden = true;
    btnReiniciar.hidden = false;
    estadoEl.hidden = false;
    if (pbFill) pbFill.style.width = '0%';
    actualizarEstado();

    // Foco inicial a la primera carta para teclado
    const first = grid.querySelector('.carta');
    first?.focus({ preventScroll:true });

    // Intento de “desbloqueo” de audio en el primer gesto del usuario (iOS/Safari)
    if (!audioDesbloqueado && sndWin){
      sndWin.play().then(()=>{
        sndWin.pause();
        sndWin.currentTime = 0;
        audioDesbloqueado = true;
      }).catch(()=>{ /* ignorar: se desbloqueará en el siguiente gesto */ });
    }
  }

  /* ===== Navegación con flechas en el grid ===== */
  document.addEventListener('keydown', (e)=>{
    const grid = getGrid();
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll('.carta'));
    const idx = items.indexOf(document.activeElement);
    if (idx < 0) return;

    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    let next = null;

    if (e.key==='ArrowRight') next = items[idx+1];
    if (e.key==='ArrowLeft')  next = items[idx-1];
    if (e.key==='ArrowDown')  next = items[idx+cols];
    if (e.key==='ArrowUp')    next = items[idx-cols];

    if (next){ e.preventDefault(); next.focus(); }
  });

  /* ===== Botones ===== */
  btnComenzar?.addEventListener('click', iniciar);
  btnReiniciar?.addEventListener('click', ()=>{
    btnComenzar.hidden = false;
    btnReiniciar.hidden = true;
    while (juegoEl.firstChild) juegoEl.removeChild(juegoEl.firstChild);
    intentos = 0; aciertos = 0;
    if (pbFill) pbFill.style.width = '0%';
    actualizarEstado();
  });
});
