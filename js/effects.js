// Decorative extras. Each is independent: delete a call in main.js to remove that effect.
import { $, el, rand, reducedMotion } from './dom.js';
import { CONFIG } from './config.js';

/** Ransom-note title: every letter becomes its own cut-out scrap (styled by `h1 span` in style.css). */
export function ransomTitle() {
  const h1 = $('h1');
  const text = h1.textContent;
  h1.setAttribute('aria-label', text); // screen readers read the real words
  h1.replaceChildren(...[...text].map((c) => (c === ' ' ? ' ' : el('span', '', c))));
}

/** Soft pixelation for every element with class "ico" (emoji/icons).
 *  Pixel size = the --pixel number in style.css. Builds an SVG filter once, which CSS applies via filter:url(#pixelate). */
export function pixelFilter() {
  const px = Math.max(1, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pixel')) || 2);
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs, ...kids) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    n.append(...kids);
    return n;
  };
  const dot = Math.max(1, Math.round(px / 5)); // size of the sampled dot inside each pixel cell
  const filter = make('filter', { id: 'pixelate', 'color-interpolation-filters': 'sRGB' },
    make('feFlood', { x: Math.floor((px - dot) / 2), y: Math.floor((px - dot) / 2), width: dot, height: dot }), // 1. one sample dot...
    make('feComposite', { width: px, height: px }),                                  // 2. ...in a px-by-px cell
    make('feTile', { result: 'grid' }),                                               // 3. repeat the cell everywhere
    make('feComposite', { in: 'SourceGraphic', in2: 'grid', operator: 'in' }),        // 4. keep the icon only at the dots
    make('feMorphology', { operator: 'dilate', radius: px / 2 }));                    // 5. grow each dot back into a square
  const svg = make('svg', { class: 'defs', 'aria-hidden': 'true' }, filter);
  document.body.append(svg);
}

/** Every so often a leaf drifts across the screen (the animation itself is @keyframes leaf in style.css). */
export function leaves() {
  if (reducedMotion) return;
  const spawn = () => {
    const leaf = el('span', 'leaf ico', CONFIG.leafEmoji[Math.floor(Math.random() * CONFIG.leafEmoji.length)]);
    leaf.style.top = rand(0, 80) + 'vh';
    leaf.style.setProperty('--d', rand(...CONFIG.leafSeconds) + 's');
    leaf.setAttribute('aria-hidden', 'true');
    leaf.onanimationend = () => leaf.remove();
    document.body.append(leaf);
    setTimeout(spawn, rand(...CONFIG.leafGapMs));
  };
  setTimeout(spawn, 3000);
}

/** Sound toggle. Plays audio/windchimes-birds.WAV; if that file is missing, falls back to synthesised soft wind. */
/** Toggle sky ambience using the existing footer audio element. */
export function ambience() {
    const audio = document.querySelector('audio[src="audio/windchimes-birds.wav"]');
    if (!audio) return;

    audio.loop = true;
    audio.volume = CONFIG.ambienceVolume;

    const button = el('button', 'snd ico', audio.paused ? '🔊' : '🔇');
    button.type = 'button';
    button.title = 'Sky ambience on/off';
    button.setAttribute('aria-label', 'Sky ambience');
    button.setAttribute('aria-pressed', String(!audio.paused));

    button.onclick = async () => {
        if (audio.paused) {
            try {
                await audio.play();
                button.textContent = '🔊';
                button.setAttribute('aria-pressed', 'true');
            } catch (error) {
                console.warn('Could not play ambience:', error);
            }
        } else {
            audio.pause();
            button.textContent = '🔇';
            button.setAttribute('aria-pressed', 'false');
        }
    };

    document.body.append(button);
}

/** Early-internet visitor counter (counts this browser's visits; the footer markup is in each page). */
export function visitorCounter() {
  const out = $('#count');
  if (!out) return;
  let n = 1;
  try { n = Number(localStorage.visits || 0) + 1; localStorage.visits = n; } catch (e) { /* storage blocked: fine */ }
  out.textContent = String(41 + n).padStart(6, '0');
}

/** Easter egg: up up down down left right left right b a. */
export function konami() {
  const code = 'ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a';
  let keys = [];
  addEventListener('keydown', (e) => {
    keys = [...keys, e.key].slice(-10);
    if (keys.join() === code) document.body.classList.toggle('party');
  });
  console.log('%c Hello, curious one! Try the Konami code. ', 'background:#f2c14e;font-size:16px');
}
