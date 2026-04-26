// Hero typewriter — types and deletes characters from a phrase list
const PHRASES_DESKTOP = [
  'the new way to revise.',
  'built for GCSEs.',
  'built for A-Levels.',
  'smarter than a textbook.',
  'your unfair advantage.',
  'every subject. every board.',
];
const PHRASES_MOBILE = [
  'the new way to revise.',
  'built for GCSEs & A-Levels.',
  'your unfair advantage.',
];

export function initTypewriter(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const phrases = window.matchMedia('(max-width: 640px)').matches
    ? PHRASES_MOBILE : PHRASES_DESKTOP;

  let i = 0;
  let txt = '';
  let deleting = false;

  const tick = () => {
    const phrase = phrases[i];
    if (!deleting) {
      txt = phrase.slice(0, txt.length + 1);
      el.textContent = txt;
      if (txt === phrase) {
        deleting = true;
        return setTimeout(tick, 2400);
      }
      return setTimeout(tick, 55 + Math.random() * 25);
    } else {
      txt = phrase.slice(0, txt.length - 1);
      el.textContent = txt;
      if (txt === '') {
        deleting = false;
        i = (i + 1) % phrases.length;
        return setTimeout(tick, 280);
      }
      return setTimeout(tick, 28);
    }
  };
  tick();
}
