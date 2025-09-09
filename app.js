'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ====== Estado ====== */
  const S = {
    size: 'grande',    // 'grande' | 'muy-grande'
    pairs: 8,          // 6 | 8 | 10
    attempts: 0,
    found: 0,
    sel: [],           // cartas volteadas (máx. 2)
    lock: false,
  };

  /* ====== Refs ====== */
  const $tablero     = document.getElementById('tablero');
  const $btnStart    = document.getElementById('btnComenzar');
  const $selTam      = document.getElementById('tamano');
  const $selDif      = document.getElementById('dificultad');
  const $hudInt      = document.getElementById('intentos');
  const $hudFound    = document.getElementById('encontradas');

  const $aboutBtn    = document.getElementById('aboutBtn');
  const $aboutModal  = document.getElementById('aboutModal');
  const $aboutClose  = document.getElementById('aboutClose');
  const $themeBtn    = document.getElementById('themeToggle');

  /* ====== Util ====== */
  const shuffle = a => { for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const nPairs  = v => parseInt(String(v),10) || 8;

  const SYMBOLS = [
    '🍎','🍌','🍒','🍇','🍋','🍉','🍑','🥝','🍐','🥥',
    '⭐','🌙','☀️','🌈','🔥','❄️','⚽','🏀','🎾','🏈',
    '🚗','🚕','🚲','🚀','✈️','🚁','🚤','🛵','🚂','🚜',
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐸','🦋',
    '🎻','🥁','🎺','🎹','🎷','🪗','🎸','🎲','🧩','🧸'
  ];

  const setHUD = () => {
    $hudInt.textContent = String(S.attempts);
    $hudFound.textContent = `${S.found}/${S.pairs}`;
  };

  function makeCard(sym){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card';                // TAPADA (sin is-flipped)
    b.dataset.symbol = sym;
    b.setAttribute('aria-pressed','false');
    b.setAttribute('aria-label','Carta boca abajo');

    const span = document.createElement('span');
    span.className = 'emoji';
    span.textContent = sym;
    span.setAttribute('aria-hidden','true');

    b.appendChild(span);
    b.addEventListener('click', () => onFlip(b));
    return b;
  }

  function buildDeck(pairs){
    const pool = shuffle([...SYMBOLS]).slice(0, pairs);
    return shuffle([...pool, ...pool]);
  }

  function renderBoard(){
    $tablero.innerHTML = '';
    S.attempts = 0; S.found = 0; S.sel = []; S.lock = false;
    const deck = buildDeck(S.pairs);
    const frag = document.createDocumentFragment();
    for (const s of deck) frag.appendChild(makeCard(s));
    $tablero.appendChild(frag);
    setHUD();
    $tablero.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function onFlip(card){
    if (S.lock) return;
    if (card.classList.contains('is-flipped') || card.classList.contains('is-matched')) return;

    card.classList.add('is-flipped');
    card.setAttribute('aria-pressed','true');
    S.sel.push(card);

    if (S.sel.length === 2){
      S.lock = true;
      S.attempts++; setHUD();
      const [a,b] = S.sel;
      const ok = a.dataset.symbol === b.dataset.symbol;

      if (ok){
        a.classList.add('is-matched');
        b.classList.add('is-matched');
        a.style.pointerEvents = 'none';
        b.style.pointerEvents = 'none';
        S.found++; S.sel = []; S.lock = false; setHUD();
        if (S.found >= S.pairs){
          setTimeout(()=> alert(`¡Muy bien! Encontraste las ${S.pairs} parejas en ${S.attempts} intentos.`), 150);
        }
      } else {
        setTimeout(()=>{
          a.classList.remove('is-flipped'); b.classList.remove('is-flipped');
          a.setAttribute('aria-pressed','false'); b.setAttribute('aria-pressed','false');
          S.sel = []; S.lock = false;
        }, 700);
      }
    }
  }

  /* ====== Preferencias / Tema ====== */
  function applySize(){
    const xl = S.size === 'muy-grande';
    document.documentElement.classList.toggle('muy-grande', xl);
    try { localStorage.setItem('mem_size', S.size); } catch {}
  }

  function applyTheme(mode){
    const m = (mode === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', m);
    try{ localStorage.setItem('theme', m); }catch{}
    if ($themeBtn){
      $themeBtn.textContent = (m==='dark' ? '🌞' : '🌙');
      $themeBtn.setAttribute('aria-pressed', String(m==='dark'));
      $themeBtn.setAttribute('aria-label', m==='dark' ? 'Usar modo claro' : 'Usar modo oscuro');
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', m==='dark' ? '#0b0b0b' : '#f8fbf4');
  }

  // Restaurar preferencias
  (function initPrefs(){
    try{
      const t = localStorage.getItem('theme');
      applyTheme(t === 'dark' ? 'dark' : 'light');

      const s = localStorage.getItem('mem_size');
      if (s === 'grande' || s === 'muy-grande'){
        S.size = s; if ($selTam) $selTam.value = s;
      }
      const p = localStorage.getItem('mem_pairs');
      if (p){ const n = nPairs(p); if (n){ S.pairs = n; if ($selDif) $selDif.value = String(n); } }
    }catch{}
    applySize();
    setHUD();
  })();

  /* ====== Eventos ====== */
  $btnStart?.addEventListener('click', () => {
    if ($selTam) S.size = $selTam.value;
    if ($selDif) S.pairs = nPairs($selDif.value);
    try{
      localStorage.setItem('mem_size', S.size);
      localStorage.setItem('mem_pairs', String(S.pairs));
    }catch{}
    applySize();
    renderBoard();
  });

  $selTam?.addEventListener('change', e => { S.size = e.target.value; applySize(); });
  $selDif?.addEventListener('change', e => { S.pairs = nPairs(e.target.value); try{ localStorage.setItem('mem_pairs', String(S.pairs)); }catch{} });

  $themeBtn?.addEventListener('click', ()=>{
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  // Modal ayuda
  function openAbout(){ if (!$aboutModal) return; $aboutModal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open'); $aboutClose?.focus(); }
  function closeAbout(){ if (!$aboutModal) return; $aboutModal.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); }
  $aboutBtn?.addEventListener('click', openAbout);
  $aboutClose?.addEventListener('click', closeAbout);
  $aboutModal?.addEventListener('click', (e)=>{ if(e.target === $aboutModal) closeAbout(); });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeAbout(); });

  /* ====== No generar tablero al cargar ====== */
});
