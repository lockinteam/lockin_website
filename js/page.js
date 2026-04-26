// js/page.js — entry point for subpages
// Provides shared nav (sticky + burger) behaviour and footer year.
import { initNav } from './nav.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  const y = document.getElementById('footerYear');
  if (y) y.textContent = new Date().getFullYear();
});
