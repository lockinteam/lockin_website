'Entries: 9/999999 (Not Modified Often)'

// js/main.js — entry point
import { initNav } from './nav.js';
import { initTypewriter } from './hero-typewriter.js';
import { initScrollScenes } from './scroll-video.js';
import { initReveal } from './reveal.js';
import { initLaunchPicker } from './launch-picker.js';
import { initPricing } from './pricing.js?v=5';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initLaunchPicker();
  initReveal('.reveal-up');
  initTypewriter('#heroTypewriter');
  initScrollScenes('[data-scene]');
  initPricing();

  // Year in footer
  const y = document.getElementById('footerYear');
  if (y) y.textContent = new Date().getFullYear();
});
