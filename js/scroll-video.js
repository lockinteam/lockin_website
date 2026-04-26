// Scroll-driven video scrubbing engine
// Each .scene element wraps a tall outer scroll container with a sticky inner.
// Progress 0..1 across the outer drives video.currentTime + overlay phase visibility.

export function initScrollScenes(selector) {
  const elements = [...document.querySelectorAll(selector)];
  if (!elements.length) return;

  const scenes = elements.map(el => new ScrollScene(el));
  let ticking = false;

  const tick = () => {
    scenes.forEach(s => s.update());
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(tick);
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', tick, { passive: true });
  tick();
}

class ScrollScene {
  constructor(el) {
    this.el = el;
    this.video = el.querySelector('video');
    this.overlays = [...el.querySelectorAll('.scene__overlay')];
    this.dots = [...el.querySelectorAll('.scene__phase-dot')];
    this.progressFill = el.querySelector('.scene__progress-fill');
    this.progress = -1;
    this.activeIndex = -1;

    if (this.video) {
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.preload = 'auto';
      // Some browsers require a tiny play+pause to unlock currentTime scrubbing.
      this.video.addEventListener('loadedmetadata', () => {
        this.video.currentTime = 0;
      }, { once: true });
    }
  }

  getProgress() {
    const rect = this.el.getBoundingClientRect();
    const total = this.el.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return Math.max(0, Math.min(1, -rect.top / total));
  }

  update() {
    const p = this.getProgress();
    if (Math.abs(p - this.progress) < 0.0005) return;
    this.progress = p;

    if (this.video && this.video.duration && this.video.readyState >= 2) {
      const target = p * (this.video.duration - 0.05);
      // Throttle currentTime writes to avoid stutter
      if (Math.abs(this.video.currentTime - target) > 0.04) {
        try { this.video.currentTime = target; } catch (_) { /* ignore */ }
      }
    }

    if (this.progressFill) {
      this.progressFill.style.width = (p * 100).toFixed(2) + '%';
    }

    const count = this.overlays.length;
    if (!count) return;
    const fade = 0.07; // fraction of total scroll for fade-in/out

    let activeIdx = -1;
    this.overlays.forEach((overlay, i) => {
      const segStart = i / count;
      const segEnd = (i + 1) / count;
      let opacity = 0;
      let ty = 24;
      if (p >= segStart - 0.001 && p < segEnd + 0.001) {
        const inP = (p - segStart) / fade;
        const outP = (segEnd - p) / fade;
        opacity = Math.max(0, Math.min(1, Math.min(inP, outP)));
        ty = (1 - opacity) * 24;
        if (opacity > 0.5) activeIdx = i;
      }
      overlay.style.opacity = opacity.toFixed(3);
      overlay.style.transform = `translateY(${ty.toFixed(2)}px)`;
    });

    if (activeIdx !== this.activeIndex) {
      this.activeIndex = activeIdx;
      this.dots.forEach((d, i) => d.classList.toggle('is-active', i === activeIdx));
    }
  }
}
