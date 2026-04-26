// js/launch-picker.js
// Platform picker popup for "Launch app" buttons.

const PICKER_HTML = `
<div class="launch-picker" id="launchPicker" role="dialog" aria-label="Open Lockin on" hidden>
  <span class="launch-picker__label">Open on</span>
  <div class="launch-picker__opts">

    <a class="launch-picker__opt" href="https://lockin.tech/online">
      <span class="launch-picker__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/>
          <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>
        </svg>
      </span>
      <span class="launch-picker__body">
        <strong class="launch-picker__name">Web</strong>
        <span class="launch-picker__desc">Any browser · no download</span>
      </span>
      <svg class="launch-picker__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>

    <div class="launch-picker__divider" aria-hidden="true"></div>

    <a class="launch-picker__opt" href="https://apps.apple.com/us/app/lockin-revise-gcse-a-level/id6761141519" target="_blank" rel="noopener">
      <span class="launch-picker__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.05 12.04c-.03-2.79 2.28-4.13 2.39-4.2-1.3-1.91-3.34-2.17-4.06-2.2-1.73-.18-3.38 1.02-4.26 1.02-.88 0-2.24-.99-3.69-.96-1.9.03-3.65 1.1-4.62 2.8-1.97 3.42-.5 8.48 1.42 11.26.94 1.36 2.05 2.89 3.5 2.83 1.41-.06 1.94-.91 3.65-.91 1.7 0 2.18.91 3.66.88 1.51-.03 2.47-1.39 3.39-2.76 1.07-1.58 1.51-3.11 1.53-3.19-.03-.01-2.94-1.13-2.97-4.47zm-2.78-8.21c.78-.94 1.3-2.25 1.16-3.55-1.12.05-2.47.74-3.27 1.68-.72.83-1.35 2.16-1.18 3.43 1.24.1 2.51-.63 3.29-1.56z"/>
        </svg>
      </span>
      <span class="launch-picker__body">
        <strong class="launch-picker__name">iOS</strong>
        <span class="launch-picker__desc">iPhone &amp; iPad · App Store</span>
      </span>
      <svg class="launch-picker__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>

    <a class="launch-picker__opt" href="https://play.google.com/store/apps/details?id=tech.lockin.app" target="_blank" rel="noopener">
      <span class="launch-picker__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3.6 2.3c-.3.3-.5.7-.5 1.3v17c0 .5.2 1 .5 1.3l9.5-9.5L3.6 2.3zM14.4 13.4l2.5 2.5 4.4-2.5c.5-.3.8-.7.8-1.4 0-.6-.3-1.1-.8-1.4l-4.4-2.5-2.5 2.5 0 2.8zM4.8 1.7l9.6 9.6 2.5-2.5L5.5 1.4c-.2-.1-.5-.1-.7 0-.1.1-.1.2-.1.3zM4.8 22.3c.1.1.5.1.7 0l11.4-7.4-2.5-2.5L4.8 22z"/>
        </svg>
      </span>
      <span class="launch-picker__body">
        <strong class="launch-picker__name">Android</strong>
        <span class="launch-picker__desc">Google Play</span>
      </span>
      <svg class="launch-picker__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>

  </div>
</div>
`;

export function initLaunchPicker() {
  document.body.insertAdjacentHTML('beforeend', PICKER_HTML);
  const picker = document.getElementById('launchPicker');
  const triggers = document.querySelectorAll('.js-launch-app');
  let activeTrigger = null;

  // Scrim (mobile only, rendered by CSS media query)
  const scrim = document.createElement('div');
  scrim.className = 'launch-picker-scrim launch-picker-scrim--hidden';
  document.body.appendChild(scrim);

  const isMobile = () => window.matchMedia('(max-width: 540px)').matches;

  function position(trigger) {
    if (isMobile()) return; // CSS bottom-sheet handles layout
    const rect = trigger.getBoundingClientRect();
    const W = 288;
    const vw = window.innerWidth;
    let top = rect.bottom + 10;
    let left = rect.right - W;

    if (left < 8) left = 8;
    if (left + W > vw - 8) left = vw - 8 - W;

    // Flip upward if near bottom of viewport
    picker.style.top = '';
    picker.style.bottom = '';
    const estH = 220;
    if (top + estH > window.innerHeight - 8) {
      picker.style.bottom = `${window.innerHeight - rect.top + 10}px`;
    } else {
      picker.style.top = `${top}px`;
    }
    picker.style.left = `${left}px`;
  }

  function open(trigger) {
    activeTrigger = trigger;
    picker.hidden = false;
    picker.classList.add('launch-picker--entering');
    position(trigger);
    trigger.setAttribute('aria-expanded', 'true');
    if (isMobile()) scrim.classList.remove('launch-picker-scrim--hidden');
    requestAnimationFrame(() => picker.classList.remove('launch-picker--entering'));
  }

  function close() {
    picker.hidden = true;
    scrim.classList.add('launch-picker-scrim--hidden');
    triggers.forEach(t => t.setAttribute('aria-expanded', 'false'));
    activeTrigger = null;
  }

  scrim.addEventListener('click', close);

  triggers.forEach(trigger => {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'launchPicker');

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      if (!picker.hidden && activeTrigger === trigger) {
        close();
      } else {
        open(trigger);
      }
    });
  });

  document.addEventListener('click', e => {
    if (!picker.hidden && !picker.contains(e.target)) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !picker.hidden) {
      close();
      if (activeTrigger) activeTrigger.focus();
    }
  });
}
