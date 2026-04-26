// js/main.js — entry point
import { initNav } from './nav.js';
import { initTypewriter } from './hero-typewriter.js';
import { initScrollScenes } from './scroll-video.js';
import { initReveal } from './reveal.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal('.reveal-up');
  initTypewriter('#heroTypewriter');
  initScrollScenes('[data-scene]');

  // Year in footer
  const y = document.getElementById('footerYear');
  if (y) y.textContent = new Date().getFullYear();
});
