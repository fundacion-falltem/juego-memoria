'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===== Versión ===== */
  const VERSION = "Memoria v2.4.0";
  const versionEl = document.getElementById('versionLabel');
  if (versionEl) versionEl.textContent = VERSION;

  /* ===== Refs ===== */
  const tablero = document.getElementById('tablero');
  const selTam  = document.getElementById('tamano');
  const selDif  = document.getElementById('dificultad');
  const btnStart= document.getElementById('btnComenzar');

  const intentosEl   = document.getElementById('intentos');
  const encontradasEl= document.getElementById('encontradas');
  const totalEl      = document.getElementById('total');

  // FABs / Modal
  const themeBtn   = document.getElementById('themeToggle');
  const aboutBtn   = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const aboutClose = document.getElementById('aboutClose');

  /* ===== Estado ===== */
  const EMOJIS = [
    "🍎","🍐","🍊","🍋","🍓","🍇","🍌","🍒","🍉","🥝",
    "🚗","🚕","🚌","🚑","🚒","🚜","🚀","🚁","🛵","✈️",
    "⭐️","🌙","☀️","🌈","⛄️","🔥","🌸","🍀","🎈","🎁",
    "🐶","🐱","🐭","🐹","🐰","🐼","🐸","🐷","🐔","🐟"
  ];

  let totalPairs = 0;
  let foundPairs = 0;
  let attempts   = 0;

  let firstCard = null;
  let lockBoard = false;

  /* ===== Utils ===== */
  const shuffle = (arr) => {
    for (let i = arr.length-1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const setHUD = () => {
    intentosEl.textContent    = String(attempts);
    encontradasEl.textContent = String(foundPairs);
    totalEl.textContent       = String(totalPairs);
  };

  const clearNode = (node) => { while(node.firstChild) node.removeChild(node.firstChild); };

  /* ===== Lógica del juego ===== */
  function buildDeck(pairs) {
    const pool = shuffle(EMOJIS.slice());
    const chosen = pool.slice(0, pairs);
    const deck = shuffle(chosen.concat(chosen));
    return deck;
  }

  function renderBoard(deck) {
    clearNode(tablero);
    // tamaño de carta: solo altura; la fuente se escala con clamp
    tablero.classList.toggle('tablero--big', selTam.value === 'mg');

    deck.forEach((emoji, idx) => {
      const card = document.createElement('button');
      card.className = 'card';
      card.type = 'button';
      card.setAttribute('aria-label', `Carta ${idx+1}`);
      card.dataset.value = emoji;

      const span = document.createElement('span');
      span.className = 'emoji';
      span.textContent = emoji;
      card.appendChild(span);

      card.addEventListener('click', () => onCardClick(card));
      tablero.appendChild(card);
    });
  }

  function onCardClick(card) {
    if (lockBoard) return;
    if (card.classList.contains('is-matched')) return;
    if (card === firstCard) return;

    card.classList.add('is-flipped');

    if (!firstCard) {
      firstCard = card;
      return;
    }

    // segundo click
    attempts += 1;
    setHUD();

    const match = (firstCard.dataset.value === card.dataset.value);
    if (match) {
      firstCard.classList.remove('is-flipped');
      card.classList.remove('is-flipped');
      firstCard.classList.add('is-matched');
      card.classList.add('is-matched');
      firstCard = null;

      foundPairs += 1;
      setHUD();

      if (foundPairs === totalPairs) {
        setTimeout(renderEndCard, 250);
      }
      return;
    }

    // no match -> destapar y volver a tapar
    lockBoard = true;
    setTimeout(() => {
      firstCard.classList.remove('is-flipped');
      card.classList.remove('is-flipped');
      firstCard = null;
      lockBoard = false;
    }, 520);
  }

  /* ===== Mensaje positivo según desempeño ===== */
  function feedbackFor(attempts, pairs) {
    const optimo = 2 * pairs;           // 2 destapes por pareja (óptimo teórico)
    const bueno  = optimo + Math.ceil(pairs * 0.5);
    const ok     = optimo + Math.ceil(pairs * 1.0);

    if (attempts <= optimo) {
      return { titulo: "🎉 ¡Excelente!", texto: "Resolviste con muy pocos intentos. ¡Memoria afilada!" };
    } else if (attempts <= bueno) {
      return { titulo: "👏 ¡Muy bien!", texto: "Vas con gran ritmo. Mantené la estrategia que te funciona." };
    } else if (attempts <= ok) {
      return { titulo: "👍 ¡Bien!", texto: "Vas encaminado. Probá recordar bloques y posiciones cercanas." };
    }
    return { titulo: "🌟 ¡Gran práctica!", texto: "En la próxima, fijate en pequeñas zonas y repasá mentalmente." };
  }

  /* ===== Tarjeta final ===== */
  function renderEndCard() {
    clearNode(tablero);

    const { titulo, texto } = feedbackFor(attempts, totalPairs);

    const card = document.createElement('div');
    card.className = 'tarjeta';
    const h = document.createElement('p');
    h.className = 'pregunta';
    h.textContent = titulo;

    const p1 = document.createElement('p');
    p1.textContent = `Encontraste ${totalPairs} parejas en ${attempts} intentos.`;
    const p2 = document.createElement('p');
    p2.textContent = texto;

    const acciones = document.createElement('div');
    acciones.className = 'acciones';

    const btnReplay = document.createElement('button');
    btnReplay.className = 'btn principal';
    btnReplay.textContent = 'Volver a jugar';
    btnReplay.addEventListener('click', startGame);

    const aOtros = document.createElement('a');
    aOtros.className = 'btn secundario';
    aOtros.href = 'https://falltem.org/juegos/#games-cards';
    aOtros.target = '_blank'; aOtros.rel = 'noopener noreferrer';
    aOtros.textContent = 'Elegir otro juego';

    acciones.appendChild(btnReplay);
    acciones.appendChild(aOtros);

    card.appendChild(h);
    card.appendChild(p1);
    card.appendChild(p2);
    card.appendChild(acciones);

    tablero.appendChild(card);
    card.scrollIntoView({ behavior:'smooth', block:'start' });
    btnReplay.focus({ preventScroll:true });
  }

  /* ===== Inicio de juego ===== */
  function startGame() {
    // tamaño fuente global (muy grande opcional)
    document.documentElement.classList.toggle('muy-grande', selTam.value === 'mg');

    totalPairs = Number(selDif.value);
    foundPairs = 0;
    attempts   = 0;
    firstCard  = null;
    lockBoard  = false;
    setHUD();

    const deck = buildDeck(totalPairs);
    renderBoard(deck);
  }

  /* ===== Eventos ===== */
  btnStart?.addEventListener('click', startGame);

  // ===== Modal
  function openAbout(){ aboutModal?.setAttribute('aria-hidden','false'); aboutClose?.focus(); }
  function closeAbout(){ aboutModal?.setAttribute('aria-hidden','true'); }
  aboutBtn?.addEventListener('click', openAbout);
  aboutClose?.addEventListener('click', closeAbout);
  aboutModal?.addEventListener('click', (e)=>{ if(e.target===aboutModal) closeAbout(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeAbout(); });

  // ===== Tema (persistente)
  function applyTheme(mode){
    const m = (mode==='dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', m);
    if (themeBtn){
      themeBtn.textContent = (m==='dark' ? '🌞' : '🌙');
      themeBtn.setAttribute('aria-pressed', String(m==='dark'));
      themeBtn.setAttribute('aria-label', m==='dark' ? 'Usar modo claro' : 'Usar modo oscuro');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', m==='dark' ? '#0b0b0b' : '#f8fbf4');
  }
  (function initTheme(){
    let mode = 'light';
    try{
      const stored = localStorage.getItem('theme');
      if (stored==='dark' || stored==='light') mode = stored;
    }catch{}
    applyTheme(mode);
  })();
  themeBtn?.addEventListener('click', ()=>{
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    try{ localStorage.setItem('theme', next); }catch{}
    applyTheme(next);
  });

  // HUD inicial coherente
  setHUD();
});
