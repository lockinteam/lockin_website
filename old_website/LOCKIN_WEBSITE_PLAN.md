# LOCKIN.TECH — COMPLETE WEBSITE REDESIGN PLAN
### Version 2.0 — Agent Build Specification

---

## TABLE OF CONTENTS
1. [Vision & Design Philosophy](#1-vision--design-philosophy)
2. [File Structure](#2-file-structure)
3. [Design Tokens & Theming](#3-design-tokens--theming)
4. [Typography System](#4-typography-system)
5. [Global Styles & Resets](#5-global-styles--resets)
6. [Navigation Bar](#6-navigation-bar)
7. [Section 1 — Hero (Landing)](#7-section-1--hero-landing)
8. [Section 2 — Social Proof Bar](#8-section-2--social-proof-bar)
9. [Section 3 — Scroll Showcase (Video Reel)](#9-section-3--scroll-showcase-video-reel)
   - 9.1 Login Scene
   - 9.2 Subject Selection Scene
   - 9.3 Subject Opening + Analytics Scene
   - 9.4 Notes Scene
   - 9.5 Questions + Flashcards Scene
   - 9.6 Past Papers Scene
   - 9.7 Leaderboard Scene
   - 9.8 Streaks Scene
10. [Section 4 — Pricing](#10-section-4--pricing)
11. [Section 5 — Footer](#11-section-5--footer)
12. [JavaScript Architecture](#12-javascript-architecture)
13. [Scroll-Driven Video Animation System](#13-scroll-driven-video-animation-system)
14. [Performance & Asset Notes](#14-performance--asset-notes)
15. [Responsive Breakpoints](#15-responsive-breakpoints)
16. [Animation Catalogue](#16-animation-catalogue)
17. [Full Page Flow Summary](#17-full-page-flow-summary)

---

## 1. VISION & DESIGN PHILOSOPHY

### The Feeling
This site should feel like arriving at something serious. Not playful, not corporate — **cinematic and authoritative**. Like a premium product that knows exactly what it does and who it's for. The student visiting this site should feel a jolt: *"This is what I've been missing."*

### Core Aesthetic: **Dark-Cinema Meets Academic Precision**
- **Background:** Near-black deep blue (`#060E1A`) — not pure black, it has depth
- **Foreground:** Crisp white (`#FFFFFF`) and muted grey (`#94A3B8`) for body
- **Primary accent:** Electric teal (`#53C0B8`) — used sparingly, hits hard
- **Secondary accent:** Steel blue (`#3678AE`) — for buttons and links
- **Highlights:** Subtle noise texture overlay on the whole page for tactile premium feel
- **Glassmorphism:** Used for cards — frosted glass effect with `backdrop-filter: blur()`
- **Gradients:** Deep blues to near-black; never rainbow, never purple

### The One Unforgettable Thing
The **scroll-driven video showcase**. As you scroll, the app literally plays in front of you — frame by frame — narrated by bold editorial text that appears and disappears in sync. It's not a demo video you click. **The scroll IS the demo.**

### No Generic AI Slop
- Font: **Clash Display** (display headings) + **Cabinet Grotesk** (body) — both from Fontshare, free
- Zero Inter. Zero Roboto. Zero purple gradients on white.
- No stock photos. Only the real app videos/frames.
- No rounded cards with drop shadows that look like a Notion template.

---

## 2. FILE STRUCTURE

```
lockin-site/
├── index.html                  # Main single-page site
├── assets/
│   ├── videos/
│   │   ├── login.mp4           # Converted from Login.mov
│   │   ├── subject-select.mp4  # Converted from Selecting a subject + subject selection.mov
│   │   ├── subject-open.mp4    # Converted from Opening a subject + analytics.mov
│   │   ├── notes.mp4           # Converted from All topics + notes.mov
│   │   ├── questions.mp4       # Converted from Questions + Flashcards.mov
│   │   ├── past-papers.mp4     # Converted from Past Papers.mov
│   │   ├── leaderboard.mp4     # Converted from Leaderboard.mov
│   │   └── streaks.mp4         # Converted from Streaks.mov
│   ├── images/
│   │   ├── logo.svg            # Lockin logo (extract from existing site)
│   │   ├── logo-mark.svg       # Icon only version
│   │   ├── noise.png           # Subtle noise texture (512x512, 3% opacity)
│   │   ├── app-store-badge.svg
│   │   └── google-play-badge.svg
│   └── fonts/                  # Self-hosted from Fontshare
│       ├── ClashDisplay-Variable.woff2
│       └── CabinetGrotesk-Variable.woff2
├── css/
│   ├── tokens.css              # Design tokens (based on existing variables.css, extended)
│   ├── reset.css               # Modern CSS reset
│   ├── global.css              # Base styles, body, typography
│   ├── nav.css                 # Navigation component
│   ├── hero.css                # Hero section
│   ├── social-proof.css        # Stats bar
│   ├── showcase.css            # Scroll video showcase
│   ├── pricing.css             # Pricing section
│   ├── footer.css              # Footer
│   └── animations.css          # Keyframes and animation utilities
├── js/
│   ├── main.js                 # Entry point, initialises modules
│   ├── nav.js                  # Nav scroll behaviour, mobile menu
│   ├── hero-typewriter.js      # Rotating headline text
│   ├── scroll-video.js         # Core scroll-driven video engine
│   ├── showcase-scenes.js      # Scene definitions & copy for each video segment
│   ├── reveal.js               # Intersection Observer scroll reveals
│   └── pricing.js              # Pricing tab / toggle interactions
└── README.md
```

### Video Conversion Command (run once via terminal)
```bash
# Convert all .mov files to .mp4 with web-optimised settings
for f in assets/*.mov; do
  ffmpeg -i "$f" \
    -vf "scale=1080:-2" \
    -c:v libx264 -preset slow -crf 23 \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    "assets/videos/$(basename "${f%.mov}" | tr '[:upper:]' '[:lower:]' | tr ' ' '-').mp4"
done
```

---

## 3. DESIGN TOKENS & THEMING

File: `css/tokens.css`

```css
:root {
  /* ─── BRAND COLOURS ──────────────────────────── */
  --c-bg:           #060E1A;   /* page background */
  --c-bg-1:         #0B1829;   /* slightly lighter panels */
  --c-bg-2:         #0F2035;   /* card backgrounds */
  --c-bg-3:         #193659;   /* elevated surfaces */

  --c-primary:      #3678AE;   /* steel blue */
  --c-primary-light:#4a8fc4;
  --c-primary-dark: #2a5f8a;

  --c-accent:       #53C0B8;   /* electric teal — USE SPARINGLY */
  --c-accent-light: #6fd4cc;
  --c-accent-glow:  rgba(83, 192, 184, 0.25);

  --c-white:        #FFFFFF;
  --c-text:         #E8EEF4;   /* near-white body text */
  --c-text-muted:   #64748B;
  --c-text-subtle:  #334155;

  --c-border:       rgba(255,255,255,0.08);
  --c-border-bright:rgba(255,255,255,0.15);

  --c-success:      #10B981;
  --c-warning:      #F59E0B;
  --c-error:        #EF4444;

  /* ─── RGB VERSIONS (for rgba()) ─────────────── */
  --c-accent-rgb:   83, 192, 184;
  --c-primary-rgb:  54, 120, 174;
  --c-bg-rgb:       6, 14, 26;

  /* ─── GRADIENTS ──────────────────────────────── */
  --grad-hero:      linear-gradient(160deg, #060E1A 0%, #0F2035 50%, #060E1A 100%);
  --grad-teal:      linear-gradient(135deg, #3678AE 0%, #53C0B8 100%);
  --grad-text:      linear-gradient(135deg, #FFFFFF 0%, #53C0B8 100%);
  --grad-card:      linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);

  /* ─── SPACING ────────────────────────────────── */
  --sp-1: 0.25rem;   --sp-2: 0.5rem;    --sp-3: 0.75rem;
  --sp-4: 1rem;      --sp-5: 1.25rem;   --sp-6: 1.5rem;
  --sp-8: 2rem;      --sp-10: 2.5rem;   --sp-12: 3rem;
  --sp-16: 4rem;     --sp-20: 5rem;     --sp-24: 6rem;
  --sp-32: 8rem;

  /* ─── LAYOUT ─────────────────────────────────── */
  --max-w:         1280px;
  --max-w-text:    720px;
  --gutter:        clamp(1.25rem, 4vw, 2.5rem);

  /* ─── BORDER RADIUS ──────────────────────────── */
  --r-sm:   0.375rem;
  --r-md:   0.75rem;
  --r-lg:   1.25rem;
  --r-xl:   2rem;
  --r-full: 9999px;

  /* ─── TYPOGRAPHY ─────────────────────────────── */
  --font-display: 'Clash Display', system-ui, sans-serif;
  --font-body:    'Cabinet Grotesk', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* Scale */
  --t-xs:   clamp(0.75rem,  0.7rem  + 0.25vw, 0.8125rem);
  --t-sm:   clamp(0.875rem, 0.82rem + 0.27vw, 0.9375rem);
  --t-base: clamp(1rem,     0.94rem + 0.3vw,  1.0625rem);
  --t-lg:   clamp(1.125rem, 1.04rem + 0.42vw, 1.25rem);
  --t-xl:   clamp(1.25rem,  1.1rem  + 0.75vw, 1.5rem);
  --t-2xl:  clamp(1.5rem,   1.25rem + 1.25vw, 1.875rem);
  --t-3xl:  clamp(2rem,     1.6rem  + 2vw,    2.75rem);
  --t-4xl:  clamp(2.5rem,   1.9rem  + 3vw,    3.75rem);
  --t-5xl:  clamp(3.25rem,  2.4rem  + 4.25vw, 5.5rem);
  --t-6xl:  clamp(4rem,     2.8rem  + 6vw,    7.5rem);

  /* ─── SHADOWS ────────────────────────────────── */
  --shadow-sm:  0 2px 8px rgba(0,0,0,0.3);
  --shadow-md:  0 8px 24px rgba(0,0,0,0.4);
  --shadow-lg:  0 20px 60px rgba(0,0,0,0.5);
  --shadow-accent: 0 0 60px rgba(var(--c-accent-rgb), 0.2);
  --shadow-glow:   0 0 120px rgba(var(--c-accent-rgb), 0.12);

  /* ─── TRANSITIONS ────────────────────────────── */
  --t-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1);
  --t-base-t: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --t-slow:   400ms cubic-bezier(0.4, 0, 0.2, 1);
  --t-bounce: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ─── Z-INDEX ─────────────────────────────────── */
  --z-base: 1;
  --z-above: 10;
  --z-nav: 100;
  --z-modal: 200;
  --z-toast: 300;
}
```

---

## 4. TYPOGRAPHY SYSTEM

### Font Loading (in `<head>` of index.html)
```html
<!-- Self-hosted from Fontshare CDN (free, no attribution required) -->
<link rel="preconnect" href="https://api.fontshare.com">
<style>
  @font-face {
    font-family: 'Clash Display';
    src: url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
    font-display: swap;
  }
</style>
<link
  rel="stylesheet"
  href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=cabinet-grotesk@400,500,700,800&display=swap"
/>
```

### Typography Classes
```css
/* In global.css */

/* Display — for hero headlines only */
.t-display {
  font-family: var(--font-display);
  font-size: var(--t-5xl);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

/* Heading 1 — section headlines */
.t-h1 {
  font-family: var(--font-display);
  font-size: var(--t-4xl);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.025em;
}

/* Heading 2 — sub-sections */
.t-h2 {
  font-family: var(--font-display);
  font-size: var(--t-3xl);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

/* Heading 3 — cards, labels */
.t-h3 {
  font-family: var(--font-body);
  font-size: var(--t-xl);
  font-weight: 700;
  line-height: 1.3;
}

/* Body */
.t-body {
  font-family: var(--font-body);
  font-size: var(--t-base);
  font-weight: 400;
  line-height: 1.65;
  color: var(--c-text);
}

/* Caption / label */
.t-label {
  font-family: var(--font-body);
  font-size: var(--t-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--c-accent);
}

/* Gradient text utility */
.t-gradient {
  background: var(--grad-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 5. GLOBAL STYLES & RESETS

File: `css/global.css`

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  scroll-behavior: smooth;
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}

body {
  background-color: var(--c-bg);
  color: var(--c-text);
  font-family: var(--font-body);
  font-size: var(--t-base);
  line-height: 1.65;
  overflow-x: hidden;
  /* Noise texture overlay for premium tactile feel */
  background-image: url('assets/images/noise.png');
  background-size: 200px 200px;
  background-repeat: repeat;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--c-bg); }
::-webkit-scrollbar-thumb { background: var(--c-bg-3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--c-primary); }

/* Container utility */
.container {
  width: 100%;
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.container--narrow {
  max-width: var(--max-w-text);
}

/* Section spacing */
section { position: relative; }

/* Link resets */
a { color: inherit; text-decoration: none; }

/* Image resets */
img, video { max-width: 100%; display: block; }

/* Focus styles */
:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: 3px;
  border-radius: var(--r-sm);
}

/* Selection */
::selection {
  background: rgba(var(--c-accent-rgb), 0.3);
  color: var(--c-white);
}
```

---

## 6. NAVIGATION BAR

### Layout & Behaviour
- **Position:** Fixed top, full width
- **Height:** 64px desktop / 56px mobile
- **Default state:** Fully transparent, no border
- **Scrolled state (after 80px):** `backdrop-filter: blur(20px)` + `background: rgba(6, 14, 26, 0.85)` + bottom border `1px solid rgba(255,255,255,0.06)`
- **Transition:** 250ms ease on background/blur

### Structure (HTML)
```html
<nav class="nav" id="nav" role="navigation" aria-label="Main navigation">
  <div class="container nav__inner">

    <!-- Logo -->
    <a href="/" class="nav__logo" aria-label="Lockin home">
      <img src="assets/images/logo.svg" alt="Lockin" height="28">
    </a>

    <!-- Desktop links (centre) -->
    <ul class="nav__links" role="list">
      <li><a href="#features"   class="nav__link">Features</a></li>
      <li><a href="#showcase"   class="nav__link">How It Works</a></li>
      <li><a href="#pricing"    class="nav__link">Pricing</a></li>
      <li><a href="https://lockin.tech/resources/" class="nav__link">Resources</a></li>
    </ul>

    <!-- CTA group (right) -->
    <div class="nav__cta">
      <a href="#pricing" class="btn btn--ghost btn--sm">Pricing</a>
      <a href="https://lockin.tech/online" class="btn btn--primary btn--sm">
        Launch App →
      </a>
    </div>

    <!-- Mobile hamburger -->
    <button class="nav__burger" id="navBurger" aria-label="Open menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>

  <!-- Mobile drawer -->
  <div class="nav__drawer" id="navDrawer" aria-hidden="true">
    <ul role="list">
      <li><a href="#features"  class="nav__drawer-link">Features</a></li>
      <li><a href="#showcase"  class="nav__drawer-link">How It Works</a></li>
      <li><a href="#pricing"   class="nav__drawer-link">Pricing</a></li>
      <li><a href="https://lockin.tech/resources/" class="nav__drawer-link">Resources</a></li>
    </ul>
    <div class="nav__drawer-cta">
      <a href="#pricing" class="btn btn--ghost btn--full">See Pricing</a>
      <a href="https://lockin.tech/online" class="btn btn--primary btn--full">Launch App →</a>
    </div>
  </div>
</nav>
```

### Button Styles
```css
/* Base button */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--t-sm);
  border-radius: var(--r-full);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--t-base-t);
  white-space: nowrap;
  text-decoration: none;
}

.btn--sm  { padding: 0.5rem 1.25rem; }
.btn--md  { padding: 0.75rem 1.75rem; font-size: var(--t-base); }
.btn--lg  { padding: 1rem 2.25rem; font-size: var(--t-lg); }
.btn--xl  { padding: 1.25rem 2.75rem; font-size: var(--t-xl); }
.btn--full { width: 100%; justify-content: center; }

/* Primary — teal gradient */
.btn--primary {
  background: var(--grad-teal);
  color: var(--c-bg);
  border-color: transparent;
  box-shadow: 0 0 30px rgba(var(--c-accent-rgb), 0.25);
}
.btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 50px rgba(var(--c-accent-rgb), 0.4);
}
.btn--primary:active { transform: translateY(0); }

/* Ghost */
.btn--ghost {
  background: transparent;
  color: var(--c-text);
  border-color: var(--c-border-bright);
}
.btn--ghost:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.25);
}

/* Outline accent */
.btn--outline {
  background: transparent;
  color: var(--c-accent);
  border-color: var(--c-accent);
}
.btn--outline:hover {
  background: rgba(var(--c-accent-rgb), 0.1);
}
```

---

## 7. SECTION 1 — HERO (LANDING)

### Purpose
Immediate "wow". The student lands here and in 3 seconds understands: *this is the serious study app for UK exams.*

### Full HTML Structure
```html
<section class="hero" id="hero">
  <!-- Ambient background glow blobs -->
  <div class="hero__bg" aria-hidden="true">
    <div class="hero__blob hero__blob--1"></div>  <!-- teal glow, top-right -->
    <div class="hero__blob hero__blob--2"></div>  <!-- blue glow, bottom-left -->
    <div class="hero__glow-line"></div>           <!-- horizontal scan line -->
  </div>

  <div class="container">
    <div class="hero__inner">

      <!-- Eyebrow label -->
      <div class="hero__eyebrow">
        <span class="hero__badge">
          <span class="hero__badge-dot"></span>
          GCSEs &amp; A-Levels
        </span>
      </div>

      <!-- Main headline with typewriter -->
      <h1 class="hero__headline t-display">
        <span class="hero__headline-static">Lockin —</span>
        <br>
        <span class="hero__typewriter" id="heroTypewriter" aria-live="polite"></span>
        <span class="hero__cursor" aria-hidden="true">|</span>
      </h1>

      <!-- Sub-headline -->
      <p class="hero__sub">
        The UK's most complete revision platform. Every subject,<br>
        every exam board, every specification point. Built for students<br>
        who want to actually improve — not just revise.
      </p>

      <!-- CTA row -->
      <div class="hero__cta-row">
        <a href="https://lockin.tech/online" class="btn btn--primary btn--xl">
          Start Revising Free →
        </a>
        <a href="#pricing" class="btn btn--ghost btn--xl hero__pricing-btn">
          See Pricing
        </a>
      </div>

      <!-- Platform links -->
      <div class="hero__platforms">
        <span class="hero__platforms-label">Also available on</span>
        <a href="https://apps.apple.com/us/app/lockin-revise-gcse-a-level/id6761141519"
           class="hero__platform-link" target="_blank" rel="noopener">
          <img src="assets/images/app-store-badge.svg" alt="Download on App Store" height="32">
        </a>
        <a href="https://play.google.com/store/apps/details?id=tech.lockin.app"
           class="hero__platform-link" target="_blank" rel="noopener">
          <img src="assets/images/google-play-badge.svg" alt="Get it on Google Play" height="32">
        </a>
      </div>

      <!-- Scroll indicator -->
      <div class="hero__scroll-hint" aria-hidden="true">
        <span class="hero__scroll-text">Scroll to explore</span>
        <div class="hero__scroll-arrow">↓</div>
      </div>

    </div>
  </div>
</section>
```

### Typewriter Phrases (in `hero-typewriter.js`)
The text after "Lockin —" cycles through the following phrases. Each phrase fades in letter by letter, waits 2.8s, then deletes backwards before the next one types in.

```javascript
const PHRASES = [
  "the new way to revise.",
  "built for GCSEs.",
  "built for A-Levels.",
  "smarter than a textbook.",
  "your unfair exam advantage.",
  "every subject. every board.",
];
```

**Typewriter Implementation:**
- Type speed: 55ms per character
- Delete speed: 28ms per character
- Pause between: 2800ms
- The cursor `|` blinks with a CSS animation (`opacity: 0` / `opacity: 1` at 0.7s interval)
- On mobile, only 3 phrases rotate to keep it snappy

### Hero CSS
```css
.hero {
  min-height: 100svh;
  display: flex;
  align-items: center;
  padding: calc(64px + var(--sp-20)) var(--sp-4) var(--sp-20);
  position: relative;
  overflow: hidden;
}

/* Background glow blobs */
.hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.hero__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  animation: blob-drift 12s ease-in-out infinite alternate;
}

.hero__blob--1 {
  width: 700px; height: 700px;
  top: -200px; right: -100px;
  background: radial-gradient(circle, rgba(83,192,184,0.12) 0%, transparent 70%);
}

.hero__blob--2 {
  width: 500px; height: 500px;
  bottom: -100px; left: -100px;
  background: radial-gradient(circle, rgba(54,120,174,0.15) 0%, transparent 70%);
  animation-delay: -6s;
}

@keyframes blob-drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, -20px) scale(1.05); }
}

/* Animated horizontal glow line */
.hero__glow-line {
  position: absolute;
  top: 40%;
  left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(83,192,184,0.3), transparent);
  animation: scan-line 8s ease-in-out infinite;
}

@keyframes scan-line {
  0%   { transform: translateY(-300px); opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(300px); opacity: 0; }
}

/* Hero content */
.hero__inner {
  position: relative;
  z-index: 1;
  max-width: 900px;
}

/* Eyebrow badge */
.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  background: rgba(83,192,184,0.1);
  border: 1px solid rgba(83,192,184,0.25);
  color: var(--c-accent);
  font-size: var(--t-sm);
  font-weight: 600;
  padding: 0.35rem 1rem;
  border-radius: var(--r-full);
  margin-bottom: var(--sp-6);
  letter-spacing: 0.05em;
}

.hero__badge-dot {
  width: 6px; height: 6px;
  background: var(--c-accent);
  border-radius: 50%;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.7); }
}

/* Headline */
.hero__headline {
  font-family: var(--font-display);
  font-size: var(--t-6xl);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.04em;
  color: var(--c-white);
  margin-bottom: var(--sp-6);
}

.hero__headline-static {
  color: var(--c-text-muted);  /* "Lockin —" is dimmer */
  display: block;
}

.hero__typewriter {
  color: var(--c-white);
  display: inline;
}

.hero__cursor {
  color: var(--c-accent);
  animation: cursor-blink 0.7s step-end infinite;
  font-weight: 300;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* Sub-headline */
.hero__sub {
  font-size: var(--t-lg);
  color: var(--c-text-muted);
  line-height: 1.7;
  max-width: 620px;
  margin-bottom: var(--sp-10);
  font-weight: 400;
}

/* CTA row */
.hero__cta-row {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  flex-wrap: wrap;
  margin-bottom: var(--sp-10);
}

/* Platforms */
.hero__platforms {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin-bottom: var(--sp-16);
}

.hero__platforms-label {
  font-size: var(--t-xs);
  color: var(--c-text-subtle);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero__platform-link {
  opacity: 0.6;
  transition: opacity var(--t-fast);
}
.hero__platform-link:hover { opacity: 1; }

/* Scroll hint */
.hero__scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-2);
  animation: fade-up 1s 1.5s both;
}

.hero__scroll-text {
  font-size: var(--t-xs);
  color: var(--c-text-subtle);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.hero__scroll-arrow {
  font-size: 1.25rem;
  color: var(--c-text-subtle);
  animation: bounce-down 2s ease-in-out infinite;
}

@keyframes bounce-down {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(8px); }
}
```

---

## 8. SECTION 2 — SOCIAL PROOF BAR

### Purpose
Instantly establishes credibility right below the hero fold. Short, punchy facts. No fluff.

### Content
```
[ 20+ Subjects ]  [ 5 Exam Boards ]  [ GCSEs & A-Levels ]  [ Questions + Flashcards + Notes + Past Papers ]
```

Exact copy for each stat:
- **"20+ Subjects"** — From Biology to Business Studies
- **"5 Exam Boards"** — AQA, Edexcel, OCR, WJEC, CCEA
- **"GCSEs & A-Levels"** — Foundation, Higher, AS & A2
- **"4 Study Modes"** — Notes · Questions · Flashcards · Past Papers

### HTML
```html
<section class="stats-bar" aria-label="Key statistics">
  <div class="container">
    <ul class="stats-bar__list" role="list">
      <li class="stats-bar__item">
        <span class="stats-bar__number">20+</span>
        <span class="stats-bar__label">Subjects covered</span>
      </li>
      <li class="stats-bar__divider" aria-hidden="true"></li>
      <li class="stats-bar__item">
        <span class="stats-bar__number">5</span>
        <span class="stats-bar__label">Exam boards</span>
      </li>
      <li class="stats-bar__divider" aria-hidden="true"></li>
      <li class="stats-bar__item">
        <span class="stats-bar__number">2</span>
        <span class="stats-bar__label">Qualifications — GCSEs &amp; A-Levels</span>
      </li>
      <li class="stats-bar__divider" aria-hidden="true"></li>
      <li class="stats-bar__item">
        <span class="stats-bar__number">4</span>
        <span class="stats-bar__label">Ways to study</span>
      </li>
    </ul>
  </div>
</section>
```

### CSS
```css
.stats-bar {
  padding: var(--sp-12) 0;
  border-top: 1px solid var(--c-border);
  border-bottom: 1px solid var(--c-border);
  background: rgba(255,255,255,0.01);
}

.stats-bar__list {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  list-style: none;
  flex-wrap: wrap;
}

.stats-bar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-4) var(--sp-10);
  gap: var(--sp-1);
}

.stats-bar__number {
  font-family: var(--font-display);
  font-size: var(--t-4xl);
  font-weight: 700;
  color: var(--c-white);
  line-height: 1;
  background: var(--grad-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-bar__label {
  font-size: var(--t-sm);
  color: var(--c-text-muted);
  text-align: center;
  max-width: 160px;
}

.stats-bar__divider {
  width: 1px;
  height: 48px;
  background: var(--c-border);
  align-self: center;
}

/* Mobile: stack into 2-col grid */
@media (max-width: 640px) {
  .stats-bar__list { display: grid; grid-template-columns: 1fr 1fr; }
  .stats-bar__divider { display: none; }
  .stats-bar__item { padding: var(--sp-6) var(--sp-4); }
}
```

---

## 9. SECTION 3 — SCROLL SHOWCASE (VIDEO REEL)

This is the centrepiece of the entire site. It works as follows:

### Technical Architecture

Each "scene" is a **sticky scroll block**:
1. A tall outer wrapper div (height: `300vh` for most scenes, `200vh` for quick ones)
2. Inside it, a sticky inner that sits at `position: sticky; top: 0; height: 100vh;`
3. A `<video>` element scrubbed by scroll progress
4. Overlaid text that fades in/out based on scroll position
5. A phone mockup frame around the video on desktop; full-bleed on mobile

### The Phone Mockup
On desktop, the video plays inside a floating phone mockup (CSS-drawn, no image needed):

```css
.phone-mockup {
  width: 300px;
  height: 620px;
  background: #0A0A0A;
  border-radius: 44px;
  border: 2px solid rgba(255,255,255,0.12);
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.8),
    0 40px 80px rgba(0,0,0,0.7),
    inset 0 1px 0 rgba(255,255,255,0.08);
  position: relative;
  overflow: hidden;
}

/* Notch */
.phone-mockup::before {
  content: '';
  position: absolute;
  top: 0; left: 50%; transform: translateX(-50%);
  width: 120px; height: 30px;
  background: #0A0A0A;
  border-radius: 0 0 20px 20px;
  z-index: 2;
}

/* Screen area */
.phone-mockup__screen {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 42px;
}

.phone-mockup__screen video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Scroll Video JS Engine (`scroll-video.js`)

```javascript
/**
 * For each scene:
 * - Calculate scroll progress (0–1) through the scene's outer wrapper
 * - Map progress to video.currentTime
 * - Fade/translate overlay text in phases: 
 *     0–0.15: text fades in
 *     0.15–0.75: text visible
 *     0.75–1.0: text fades out, next text fades in
 */

class ScrollScene {
  constructor(el) {
    this.outer = el;
    this.sticky = el.querySelector('.scene__sticky');
    this.video = el.querySelector('video');
    this.overlays = el.querySelectorAll('.scene__overlay');
    this.init();
  }

  init() {
    this.video.pause();
    this.video.currentTime = 0;
    // Load but don't play
    this.video.preload = 'auto';
  }

  update(scrollY) {
    const rect = this.outer.getBoundingClientRect();
    const totalScroll = this.outer.offsetHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, -rect.top / totalScroll));

    // Scrub video
    if (this.video.readyState >= 2) {
      this.video.currentTime = progress * this.video.duration;
    }

    // Update overlays
    this.overlays.forEach((overlay, i) => {
      const count = this.overlays.length;
      const start = i / count;
      const end = (i + 1) / count;
      const mid = (start + end) / 2;
      const fadeRange = 0.08;

      let opacity = 0;
      let translateY = 30;
      if (progress > start && progress < end) {
        const inFade = Math.min(1, (progress - start) / fadeRange);
        const outFade = Math.min(1, (end - progress) / fadeRange);
        opacity = Math.min(inFade, outFade);
        translateY = (1 - opacity) * 30;
      }
      overlay.style.opacity = opacity;
      overlay.style.transform = `translateY(${translateY}px)`;
    });
  }
}

// Init all scenes on DOMContentLoaded
// Tick via requestAnimationFrame reading window.scrollY
```

---

### 9.1 SCENE 1 — LOGIN

**Outer height:** `200vh`
**Video:** `login.mp4`

**Layout (desktop):** Video phone centred, text to the LEFT

**Text Overlays (2 phases):**
1. `"Sign in. Get ahead."` — label: `"Built for students"` — body: `"Create your free account in seconds. No credit card needed."`
2. `"Your revision, your rules."` — label: `"Completely free to start"` — body: `"Pick your subjects and exam boards. Lockin remembers your progress across every device."`

**Background:** Full bleed `--c-bg` with a faint teal glow at the top of the section

---

### 9.2 SCENE 2 — SUBJECT SELECTION

**Outer height:** `300vh`
**Video:** `subject-select.mp4`

**Layout (desktop):** Phone RIGHT, text LEFT

**Section header (appears before video sticky starts, fades in on scroll entry):**
```
[LABEL] Every exam board. Every subject.
[H2]    Most complete UK revision library.
[Body]  AQA, Edexcel, OCR, WJEC — pick your exact board and tier.
        Foundation or Higher. AS or A2. We've got you.
```

**Text Overlays (3 phases):**
1. Label: `"Choose your course"` — Headline: `"Every major exam board."` — Body: `"AQA, Edexcel, OCR, WJEC, CCEA. If it's on your spec, it's in Lockin."`
2. Label: `"Right tier, right content"` — Headline: `"Foundation & Higher tiers."` — Body: `"GCSE Maths Higher? Triple Science Foundation? We separate the content so you study exactly what you need."`
3. Label: `"Instant setup"` — Headline: `"Seconds to get started."` — Body: `"Pick your subject and year group. Your personalised revision hub is ready immediately."`

---

### 9.3 SCENE 3 — SUBJECT OPENING + ANALYTICS

**Outer height:** `400vh`
**Video:** `subject-open.mp4` (plays first half), then `analytics` content (second half — same video per naming convention: `subject-open.mp4` combines opening + analytics)

**Note to agent:** The file `Opening a subject + analytics.mov` should be split into two `<video>` elements OR the single combined video can be used with the overlay text timed to the two halves.

**Layout (desktop):** Phone LEFT, text RIGHT

**Section header (reveal on scroll):**
```
[LABEL] Understand exactly where you stand
[H2]    Analytics that actually tell you something.
```

**Text Overlays (4 phases):**
1. Label: `"Your subject hub"` — Headline: `"Everything for one subject."` — Body: `"Notes, questions, flashcards, and past papers — all in one place, organised by your exact spec."`
2. Label: `"Mastery score"` — Headline: `"Know your weaknesses."` — Body: `"Your Mastery metric combines accuracy, syllabus coverage, and confidence into a single score per topic."`
3. Label: `"Current form"` — Headline: `"Are you actually improving?"` — Body: `"Your EMA (Exponential Moving Average) tracks your recent sessions. If you're slipping, you'll know."`
4. Label: `"Daily breakdown"` — Headline: `"Every session recorded."` — Body: `"A heatmap calendar shows your study history at a glance. See exactly when you worked and how well."`

---

### 9.4 SCENE 4 — NOTES

**Outer height:** `300vh`
**Video:** `notes.mp4`

**Layout (desktop):** Phone RIGHT, text LEFT

**Section header:**
```
[LABEL] Written from the specification
[H2]    Notes that cover everything.
[Body]  Not copied from a textbook. Generated from your exact syllabus
        so nothing is missed and nothing is irrelevant.
```

**Text Overlays (3 phases):**
1. Label: `"Specification-accurate"` — Headline: `"Every topic. Zero gaps."` — Body: `"Every chapter in your syllabus has clear, structured notes. Read before you revise."`
2. Label: `"Organised by paper"` — Headline: `"Paper 1, Paper 2, Paper 3."` — Body: `"Content is split by exam paper so you know exactly what to revise for each sitting."`
3. Label: `"Downloadable (Pro)"` — Headline: `"Save. Print. Study offline."` — Body: `"Lockin Super lets you download and print your notes. Perfect for the final revision sprint."`

---

### 9.5 SCENE 5 — QUESTIONS + FLASHCARDS

**Outer height:** `400vh`
**Video:** `questions.mp4`

**Layout (desktop):** Phone LEFT, text RIGHT (alternates with scene 4)

**Section header:**
```
[LABEL] Active recall that works
[H2]    Stop reading. Start remembering.
[Body]  Passive revision doesn't stick. Questions and flashcards
        force your brain to retrieve information — the only way to truly learn it.
```

**Text Overlays (4 phases):**
1. Label: `"Exam-style questions"` — Headline: `"Real exam formats."` — Body: `"Multiple-choice questions modelled on past exam style. Immediate feedback and full explanations."`
2. Label: `"Smart question selection"` — Headline: `"Lockin finds your weak spots."` — Body: `"Our PPS algorithm analyses your history and serves the topics you struggle with more often. No more revising what you already know."`
3. Label: `"Flashcards"` — Headline: `"Flip. Think. Remember."` — Body: `"Classic flip-card interface for rapid active recall. Self-assess after each card and the algorithm adapts."`
4. Label: `"Unlimited practice (Pro)"` — Headline: `"40 questions free. Unlimited Pro."` — Body: `"Free users get 40 questions/flashcards per day. Lockin Pro removes the cap entirely."`

---

### 9.6 SCENE 6 — PAST PAPERS

**Outer height:** `300vh`
**Video:** `past-papers.mp4`

**Layout (desktop):** Phone RIGHT, text LEFT

**Section header:**
```
[LABEL] The final exam prep
[H2]    Every past paper. Organised.
[Body]  Don't search the internet for past papers. They're all here,
        sorted by year and paper number.
```

**Text Overlays (3 phases):**
1. Label: `"Real exam conditions"` — Headline: `"Practice like it's the real thing."` — Body: `"Access real past papers and mark schemes, organised by exam board, year, and paper type."`
2. Label: `"Sorted by year & paper"` — Headline: `"Paper 1, Paper 2, Higher, Foundation."` — Body: `"No more hunting online. Every paper is categorised so you can jump straight to what you need."`
3. Label: `"The exam prep routine"` — Headline: `"Learn → Practice → Paper."` — Body: `"Use notes to learn, questions to practice, then past papers to confirm you're exam-ready."`

---

### 9.7 SCENE 7 — LEADERBOARD

**Outer height:** `300vh`
**Video:** `leaderboard.mp4`

**Layout (desktop):** Phone LEFT, text RIGHT

**Section header:**
```
[LABEL] Compete. Climb. Win.
[H2]    Revision becomes a competition.
[Body]  Top students get featured. Rankings reset.
        The drive to climb keeps you coming back.
```

**Text Overlays (3 phases):**
1. Label: `"Global rankings"` — Headline: `"See where you rank."` — Body: `"Compete against students across the whole app. XP earned in study sessions pushes you up the board."`
2. Label: `"Course leaderboards"` — Headline: `"Your subject. Your rivals."` — Body: `"Each course has its own leaderboard. See who's top in AQA Biology or Edexcel Maths."`
3. Label: `"The podium"` — Headline: `"Top 3 get spotlighted."` — Body: `"The top three students sit on a winner's podium with custom avatars. Something worth competing for."`

---

### 9.8 SCENE 8 — STREAKS

**Outer height:** `300vh`
**Video:** `streaks.mp4`

**Layout (desktop):** Phone RIGHT, text LEFT

**Section header:**
```
[LABEL] Consistency beats cramming
[H2]    Build the habit. Keep the streak.
[Body]  Every day you revise, your streak grows.
        Miss a day? 14 Streak Freezes protect you all year.
```

**Text Overlays (3 phases):**
1. Label: `"Daily streaks"` — Headline: `"Show up every day."` — Body: `"Your streak counter tracks consecutive days of studying. The longer it grows, the harder it is to stop."`
2. Label: `"XP system"` — Headline: `"Earn for every correct answer."` — Body: `"XP is awarded for every right answer. It fuels your leaderboard position and shows your total effort."`
3. Label: `"Streak Freezes"` — Headline: `"14 free passes per year."` — Body: `"Life gets in the way. Lockin gives you 14 Streak Freezes automatically — so one bad day doesn't wipe weeks of work."`

---

### Showcase Section Wrapper HTML Pattern

Every scene follows this HTML pattern:

```html
<div class="scene" data-video="assets/videos/FILENAME.mp4" id="scene-NAME">
  <!-- Outer scroll container — tall, not sticky -->
  <div class="scene__outer">

    <!-- Optional section header (reveals before sticky begins) -->
    <div class="scene__header reveal-up">
      <div class="container">
        <span class="t-label">LABEL TEXT</span>
        <h2 class="t-h1">HEADLINE</h2>
        <p class="scene__header-body">BODY TEXT</p>
      </div>
    </div>

    <!-- Sticky viewport -->
    <div class="scene__sticky">

      <!-- Background atmosphere -->
      <div class="scene__bg" aria-hidden="true"></div>

      <div class="container scene__content">

        <!-- Text column (LEFT or RIGHT depending on scene) -->
        <div class="scene__text scene__text--left"> <!-- or --right -->
          <!-- Multiple overlays, one per phase -->
          <div class="scene__overlay" data-phase="0">
            <span class="t-label">PHASE LABEL</span>
            <h3 class="scene__overlay-headline">PHASE HEADLINE</h3>
            <p class="scene__overlay-body">PHASE BODY</p>
          </div>
          <div class="scene__overlay" data-phase="1">...</div>
          <!-- etc -->
        </div>

        <!-- Phone mockup column -->
        <div class="scene__phone">
          <div class="phone-mockup">
            <div class="phone-mockup__screen">
              <video
                src="assets/videos/FILENAME.mp4"
                muted
                playsinline
                preload="auto"
                class="scene__video"
              ></video>
            </div>
          </div>
          <!-- Optional ambient glow under phone -->
          <div class="scene__phone-glow" aria-hidden="true"></div>
        </div>

      </div>

      <!-- Progress indicator (thin line at bottom) -->
      <div class="scene__progress" aria-hidden="true">
        <div class="scene__progress-fill"></div>
      </div>

    </div>
  </div>
</div>
```

### Scene Layout CSS
```css
/* ── Outer wrapper (creates scroll space) ── */
.scene__outer {
  position: relative;
}

/* Section header */
.scene__header {
  padding: var(--sp-20) 0 var(--sp-8);
  text-align: center;
}
.scene__header h2 { margin: var(--sp-3) 0; }
.scene__header-body {
  max-width: 600px;
  margin: 0 auto;
  color: var(--c-text-muted);
  font-size: var(--t-lg);
}

/* Sticky full-viewport panel */
.scene__sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
}

/* Two-column layout */
.scene__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-16);
  align-items: center;
  width: 100%;
}

/* Flip column order per scene */
.scene__content--phone-left  { direction: rtl; }
.scene__content--phone-left > * { direction: ltr; }

/* Text column */
.scene__text {
  position: relative;
  min-height: 200px;
}

/* Individual overlay */
.scene__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.05s linear, transform 0.05s linear;
  /* Note: transition is very fast — scroll JS drives this */
  pointer-events: none;
}

.scene__overlay-headline {
  font-family: var(--font-display);
  font-size: var(--t-3xl);
  font-weight: 700;
  color: var(--c-white);
  line-height: 1.1;
  letter-spacing: -0.025em;
  margin: var(--sp-3) 0 var(--sp-4);
}

.scene__overlay-body {
  font-size: var(--t-lg);
  color: var(--c-text-muted);
  line-height: 1.7;
  max-width: 420px;
}

/* Phone column */
.scene__phone {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.scene__phone-glow {
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  height: 200px;
  background: radial-gradient(ellipse, rgba(var(--c-accent-rgb), 0.2) 0%, transparent 70%);
  filter: blur(30px);
  z-index: -1;
}

/* Progress bar at bottom of scene */
.scene__progress {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: rgba(255,255,255,0.05);
}
.scene__progress-fill {
  height: 100%;
  background: var(--grad-teal);
  width: 0%;
  transition: width 0.05s linear;
}

/* ── Mobile: stack vertically ── */
@media (max-width: 768px) {
  .scene__content {
    grid-template-columns: 1fr;
    gap: var(--sp-8);
    text-align: center;
  }
  .scene__content--phone-left { direction: ltr; }
  .scene__phone { order: -1; }
  .phone-mockup { width: 220px; height: 460px; border-radius: 36px; }
  .phone-mockup::before { width: 90px; height: 24px; }
  .scene__overlay { position: relative; inset: auto; min-height: 160px; }
  .scene__text { min-height: unset; }
  .scene__overlay-headline { font-size: var(--t-2xl); }
  .scene__overlay-body { font-size: var(--t-base); margin: 0 auto; }
}
```

---

## 10. SECTION 4 — PRICING

### Purpose
Clear, honest, and conversion-focused. Three tiers. The middle one is nudged as best value. Pricing is annual exam-season pricing — "less than a coffee."

### Section Header
```
[LABEL] Simple, honest pricing
[H2]    Start free. Go further when you're ready.
[Body]  Lockin is free to get started. Upgrade any time to unlock
        unlimited practice and advanced tools.
```

### Tier Cards

#### FREE — £0
**Label:** "Always Free"
**Features:**
- ✓ 40 questions or flashcards per day
- ✓ Full notes access
- ✓ Past papers access
- ✓ Access to all courses & subjects
- ✓ Limited podcast access
- ✗ Unlimited questions & flashcards
- ✗ Downloadable/printable notes

**CTA:** "Get Started Free"

---

#### PRO — £2.99 one-time
**Label:** "Best Value"  (highlighted with teal border + glow)
**Subtitle:** "Valid for the full exam season"
**Features:**
- ✓ Everything in Free
- ✓ Unlimited questions & flashcards per day
- ✓ Unlimited podcast access
- ✓ Lockin Pro badge on leaderboard
- ✗ Downloadable/printable notes

**CTA:** "Get Lockin Pro →"
**Fine print:** "One-time payment. No subscription. No renewal."

---

#### SUPER — £4.99 one-time
**Label:** "Complete Package"
**Features:**
- ✓ Everything in Pro
- ✓ Printable & downloadable notes
- ✓ Lockin Super badge on leaderboard

**CTA:** "Get Lockin Super →"

---

### Pricing HTML
```html
<section class="pricing" id="pricing">
  <div class="container">

    <!-- Header -->
    <div class="pricing__header reveal-up">
      <span class="t-label">Simple, honest pricing</span>
      <h2 class="t-h1">Start free.<br>Go further when you're ready.</h2>
      <p class="pricing__sub">
        Lockin is free to get started. Upgrade any time to unlock
        unlimited practice and advanced tools. Less than a coffee — for the whole exam season.
      </p>
    </div>

    <!-- Card grid -->
    <div class="pricing__grid">

      <!-- FREE -->
      <div class="pricing__card reveal-up" data-delay="0">
        <div class="pricing__card-header">
          <span class="pricing__tier-label">Free</span>
          <div class="pricing__price">
            <span class="pricing__price-currency">£</span>
            <span class="pricing__price-amount">0</span>
          </div>
          <span class="pricing__price-note">Forever free</span>
        </div>
        <ul class="pricing__features" role="list">
          <li class="pricing__feature pricing__feature--yes">40 questions or flashcards per day</li>
          <li class="pricing__feature pricing__feature--yes">Full notes access</li>
          <li class="pricing__feature pricing__feature--yes">Past papers access</li>
          <li class="pricing__feature pricing__feature--yes">All courses &amp; subjects</li>
          <li class="pricing__feature pricing__feature--yes">Limited podcast access</li>
          <li class="pricing__feature pricing__feature--no">Unlimited questions &amp; flashcards</li>
          <li class="pricing__feature pricing__feature--no">Downloadable notes</li>
        </ul>
        <a href="https://lockin.tech/online" class="btn btn--ghost btn--full btn--md pricing__cta">
          Get Started Free
        </a>
      </div>

      <!-- PRO (featured) -->
      <div class="pricing__card pricing__card--featured reveal-up" data-delay="100">
        <div class="pricing__badge">Best Value</div>
        <div class="pricing__card-header">
          <span class="pricing__tier-label">Pro</span>
          <div class="pricing__price">
            <span class="pricing__price-currency">£</span>
            <span class="pricing__price-amount">2.99</span>
          </div>
          <span class="pricing__price-note">One-time · Whole exam season</span>
        </div>
        <ul class="pricing__features" role="list">
          <li class="pricing__feature pricing__feature--yes">Everything in Free</li>
          <li class="pricing__feature pricing__feature--yes">Unlimited questions &amp; flashcards</li>
          <li class="pricing__feature pricing__feature--yes">Unlimited podcast access</li>
          <li class="pricing__feature pricing__feature--yes">Lockin Pro badge</li>
          <li class="pricing__feature pricing__feature--no">Downloadable notes</li>
        </ul>
        <a href="https://lockin.tech/online" class="btn btn--primary btn--full btn--md pricing__cta">
          Get Lockin Pro →
        </a>
        <p class="pricing__footnote">One-time payment. No subscription. No renewal.</p>
      </div>

      <!-- SUPER -->
      <div class="pricing__card reveal-up" data-delay="200">
        <div class="pricing__card-header">
          <span class="pricing__tier-label">Super</span>
          <div class="pricing__price">
            <span class="pricing__price-currency">£</span>
            <span class="pricing__price-amount">4.99</span>
          </div>
          <span class="pricing__price-note">One-time · Complete package</span>
        </div>
        <ul class="pricing__features" role="list">
          <li class="pricing__feature pricing__feature--yes">Everything in Pro</li>
          <li class="pricing__feature pricing__feature--yes">Printable &amp; downloadable notes</li>
          <li class="pricing__feature pricing__feature--yes">Lockin Super badge</li>
        </ul>
        <a href="https://lockin.tech/online" class="btn btn--outline btn--full btn--md pricing__cta">
          Get Lockin Super →
        </a>
      </div>

    </div>

    <!-- Bottom line -->
    <p class="pricing__bottom-line reveal-up">
      Less than a coffee — for the whole exam season.
    </p>

  </div>
</section>
```

### Pricing CSS
```css
.pricing {
  padding: var(--sp-24) 0 var(--sp-32);
  position: relative;
}

.pricing::before {
  content: '';
  position: absolute;
  top: 0; left: 50%; transform: translateX(-50%);
  width: 600px; height: 400px;
  background: radial-gradient(ellipse, rgba(var(--c-primary-rgb), 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.pricing__header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto var(--sp-16);
}

.pricing__header h2 {
  margin: var(--sp-3) 0 var(--sp-4);
}

.pricing__sub {
  color: var(--c-text-muted);
  font-size: var(--t-lg);
  line-height: 1.7;
}

.pricing__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-6);
  align-items: start;
}

.pricing__card {
  background: var(--grad-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-xl);
  padding: var(--sp-8);
  position: relative;
  transition: transform var(--t-slow), border-color var(--t-slow);
}

.pricing__card:hover {
  transform: translateY(-4px);
  border-color: var(--c-border-bright);
}

/* Featured card */
.pricing__card--featured {
  border-color: rgba(var(--c-accent-rgb), 0.4);
  background: linear-gradient(145deg, rgba(83,192,184,0.05) 0%, rgba(255,255,255,0.02) 100%);
  box-shadow: 0 0 60px rgba(var(--c-accent-rgb), 0.1);
}

.pricing__card--featured:hover {
  border-color: rgba(var(--c-accent-rgb), 0.7);
  box-shadow: 0 0 80px rgba(var(--c-accent-rgb), 0.2);
  transform: translateY(-6px);
}

.pricing__badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--grad-teal);
  color: var(--c-bg);
  font-size: var(--t-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.3rem 1rem;
  border-radius: var(--r-full);
}

.pricing__tier-label {
  font-family: var(--font-display);
  font-size: var(--t-xl);
  font-weight: 700;
  color: var(--c-white);
  display: block;
  margin-bottom: var(--sp-4);
}

.pricing__price {
  display: flex;
  align-items: baseline;
  gap: var(--sp-1);
  margin-bottom: var(--sp-1);
}

.pricing__price-currency {
  font-family: var(--font-display);
  font-size: var(--t-2xl);
  font-weight: 600;
  color: var(--c-text-muted);
  align-self: flex-start;
  padding-top: 0.4em;
}

.pricing__price-amount {
  font-family: var(--font-display);
  font-size: var(--t-5xl);
  font-weight: 700;
  color: var(--c-white);
  line-height: 1;
}

.pricing__price-note {
  font-size: var(--t-xs);
  color: var(--c-text-muted);
  display: block;
  margin-bottom: var(--sp-6);
}

.pricing__features {
  list-style: none;
  margin-bottom: var(--sp-8);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.pricing__feature {
  font-size: var(--t-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  line-height: 1.4;
}

.pricing__feature--yes {
  color: var(--c-text);
}
.pricing__feature--yes::before {
  content: '✓';
  color: var(--c-accent);
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 0.1em;
}

.pricing__feature--no {
  color: var(--c-text-subtle);
}
.pricing__feature--no::before {
  content: '✕';
  color: var(--c-text-subtle);
  flex-shrink: 0;
  margin-top: 0.1em;
}

.pricing__footnote {
  text-align: center;
  font-size: var(--t-xs);
  color: var(--c-text-subtle);
  margin-top: var(--sp-3);
}

.pricing__bottom-line {
  text-align: center;
  font-size: var(--t-lg);
  color: var(--c-text-muted);
  margin-top: var(--sp-12);
  font-style: italic;
}

/* Responsive */
@media (max-width: 900px) {
  .pricing__grid {
    grid-template-columns: 1fr;
    max-width: 420px;
    margin: 0 auto;
  }
}
```

---

## 11. SECTION 5 — FOOTER

### Layout
3-column grid desktop / stacked mobile.

**Column 1 — Brand:**
- Lockin logo (svg)
- "The all-in-one revision platform for UK GCSE and A-Level students."
- Platform download badges (App Store, Google Play, Web App button)

**Column 2 — Product:**
- Features (links to #features)
- How It Works (links to #showcase)
- Pricing (links to #pricing)
- Launch Web App

**Column 3 — Support:**
- Resources
- Study Articles
- Pass Rates
- Contact: support@lockin.tech

**Bottom bar:**
```
© 2025 Lockin.tech. All rights reserved.
Lockin.tech is a trading name of Young Enterprise (Gibraltar) Student Company Limited.
[Terms of Service] [Privacy Policy]
```

### Footer CSS Highlights
```css
.footer {
  border-top: 1px solid var(--c-border);
  padding: var(--sp-16) 0 var(--sp-8);
  background: var(--c-bg-1);
}

.footer__grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--sp-12);
  padding-bottom: var(--sp-12);
  border-bottom: 1px solid var(--c-border);
  margin-bottom: var(--sp-6);
}

.footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sp-4);
  font-size: var(--t-xs);
  color: var(--c-text-subtle);
  line-height: 1.6;
}

.footer__legal {
  display: flex;
  gap: var(--sp-6);
}

.footer__legal a {
  color: var(--c-text-subtle);
  transition: color var(--t-fast);
}
.footer__legal a:hover { color: var(--c-text); }

/* Young Enterprise note */
.footer__ye-note {
  font-size: var(--t-xs);
  color: var(--c-text-subtle);
  margin-top: var(--sp-2);
  max-width: 500px;
}

@media (max-width: 768px) {
  .footer__grid { grid-template-columns: 1fr; gap: var(--sp-8); }
  .footer__bottom { flex-direction: column; align-items: flex-start; }
}
```

---

## 12. JAVASCRIPT ARCHITECTURE

`js/main.js` — runs on `DOMContentLoaded`:
```javascript
import { initNav } from './nav.js';
import { initTypewriter } from './hero-typewriter.js';
import { initScrollScenes } from './scroll-video.js';
import { initReveal } from './reveal.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initTypewriter('#heroTypewriter', '#heroCursor');
  initReveal('.reveal-up');
  initScrollScenes('[data-scroll-scene]');
});
```

### `js/reveal.js` — IntersectionObserver for all non-video reveals
```javascript
export function initReveal(selector) {
  const els = document.querySelectorAll(selector);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('is-revealed');
        }, parseInt(delay));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => observer.observe(el));
}
```

CSS for reveal:
```css
.reveal-up {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal-up.is-revealed {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 13. SCROLL-DRIVEN VIDEO ANIMATION SYSTEM

This is the most complex system. Full implementation:

```javascript
// js/scroll-video.js

export function initScrollScenes(selector) {
  const scenes = [...document.querySelectorAll(selector)].map(el => new ScrollScene(el));

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        scenes.forEach(scene => scene.update());
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

class ScrollScene {
  constructor(el) {
    this.el = el;
    this.video = el.querySelector('video');
    this.overlays = [...el.querySelectorAll('.scene__overlay')];
    this.progressFill = el.querySelector('.scene__progress-fill');

    // Preload video
    this.video.preload = 'auto';
    this.video.load();

    this.progress = 0;
  }

  getProgress() {
    const rect = this.el.getBoundingClientRect();
    const totalScroll = this.el.offsetHeight - window.innerHeight;
    return Math.max(0, Math.min(1, -rect.top / totalScroll));
  }

  update() {
    this.progress = this.getProgress();

    // Scrub video currentTime
    if (this.video.readyState >= 2 && this.video.duration) {
      const targetTime = this.progress * this.video.duration;
      // Clamp to avoid edge errors
      this.video.currentTime = Math.min(targetTime, this.video.duration - 0.01);
    }

    // Update progress bar
    if (this.progressFill) {
      this.progressFill.style.width = `${this.progress * 100}%`;
    }

    // Update overlay visibility
    const count = this.overlays.length;
    if (count === 0) return;

    this.overlays.forEach((overlay, i) => {
      const segStart = i / count;
      const segEnd = (i + 1) / count;
      const fadeZone = 0.06; // fraction of total scroll for fade

      let opacity = 0;
      let ty = 24;

      if (this.progress >= segStart && this.progress < segEnd) {
        const inProgress = (this.progress - segStart) / fadeZone;
        const outProgress = (segEnd - this.progress) / fadeZone;
        opacity = Math.min(1, Math.min(inProgress, outProgress));
        ty = (1 - opacity) * 24;
      }

      overlay.style.opacity = opacity;
      overlay.style.transform = `translateY(${ty}px)`;
    });
  }
}
```

### Important Notes for Videos:
- All `<video>` elements must have `muted playsinline preload="auto"` attributes
- Do NOT set `autoplay` — playback is driven entirely by scroll
- Set `pointer-events: none` on videos in the sticky panel so users can still scroll
- On iOS, `playsinline` is mandatory for scrubbing to work
- If the video hasn't loaded (`readyState < 2`), show a blurred poster image fallback

### Video Poster Fallback
Extract a middle frame from each video and save as `assets/images/posters/VIDEONAME-poster.jpg`. Add to each video element:
```html
<video ... poster="assets/images/posters/login-poster.jpg">
```

---

## 14. PERFORMANCE & ASSET NOTES

### Video Optimisation
- Convert all `.mov` → `.mp4` using H.264 + faststart (command in section 2)
- Target bitrate: 2–4Mbps for 1080p phone recordings
- Width: scale to 1080px wide, height proportional
- Use `<source>` with `type="video/mp4"` for broader support

### Font Loading Strategy
- Use `font-display: swap` on all fonts
- Preconnect to Fontshare CDN in `<head>`
- If Fontshare is down, fallback to `system-ui, sans-serif` (tokens already handle this)

### CSS Loading Order
```html
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/reset.css">
<link rel="stylesheet" href="css/global.css">
<link rel="stylesheet" href="css/animations.css">
<link rel="stylesheet" href="css/nav.css">
<link rel="stylesheet" href="css/hero.css">
<link rel="stylesheet" href="css/social-proof.css">
<link rel="stylesheet" href="css/showcase.css">
<link rel="stylesheet" href="css/pricing.css">
<link rel="stylesheet" href="css/footer.css">
```

### JS Loading
Place all `<script type="module">` tags at the end of `<body>`:
```html
<script type="module" src="js/main.js"></script>
```

### Lazy Loading Videos
Don't load video sources until the user is within 2 viewport heights:
```javascript
// In scroll-video.js
const videoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const video = e.target;
        video.src = video.dataset.src;  // <-- move src to data-src initially
        video.load();
        videoObserver.unobserve(video);
      }
    });
  },
  { rootMargin: '200% 0px' }
);
document.querySelectorAll('video[data-src]').forEach(v => videoObserver.observe(v));
```

---

## 15. RESPONSIVE BREAKPOINTS

```css
/* In tokens.css */
:root {
  --bp-sm:  480px;
  --bp-md:  768px;
  --bp-lg:  1024px;
  --bp-xl:  1280px;
}
```

| Breakpoint | What changes |
|---|---|
| < 480px | Hero headline goes to 3 lines. Typewriter shows only 3 phrases. Stats bar 2-col. |
| < 768px | Nav collapses to burger menu. Showcase scenes stack vertically (phone top, text below). Phone mockup shrinks to 220px wide. Pricing grid becomes single column. Footer stacks. |
| < 1024px | Showcase text column shortens. Phone slightly smaller (260px). |
| ≥ 1280px | Max-width container kicks in. Everything centred. |

### Mobile-Specific Showcase Behaviour
On screens < 768px:
- Phone is shown at top of each sticky section
- Text overlay appears below the phone
- Only 1 text overlay is shown at a time (no fade transition needed — just swap on scroll thirds)
- Scene scroll height reduced: `150vh` per scene instead of `300vh`

---

## 16. ANIMATION CATALOGUE

File: `css/animations.css`

```css
/* Page load: fade up with stagger */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Used on hero elements with delays */
.hero__eyebrow  { animation: fade-up 0.8s 0.1s both; }
.hero__headline { animation: fade-up 0.9s 0.2s both; }
.hero__sub      { animation: fade-up 0.9s 0.35s both; }
.hero__cta-row  { animation: fade-up 0.9s 0.5s both; }
.hero__platforms{ animation: fade-up 0.9s 0.65s both; }

/* Pulse glow for teal elements */
@keyframes teal-pulse {
  0%, 100% { box-shadow: 0 0 30px rgba(83,192,184,0.2); }
  50%       { box-shadow: 0 0 60px rgba(83,192,184,0.4); }
}

/* Floating phone in hero (if a static hero phone image is used) */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-12px); }
}

/* Shimmer effect for loading states */
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}

.shimmer {
  background: linear-gradient(90deg,
    var(--c-bg-2) 25%,
    var(--c-bg-3) 50%,
    var(--c-bg-2) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Gradient border animation for featured pricing card */
@keyframes border-spin {
  from { --angle: 0deg; }
  to   { --angle: 360deg; }
}
```

---

## 17. FULL PAGE FLOW SUMMARY

Reading order from top to bottom, exactly as a user experiences it:

```
┌─────────────────────────────────────────────────────────────────┐
│  NAV BAR (fixed)                                                │
│  [Lockin logo]  Features  How It Works  Pricing  Resources      │
│                                            [Pricing] [Launch →] │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  HERO                                                           │
│                                                                 │
│  ● GCSEs & A-Levels                                             │
│                                                                 │
│  Lockin —                                                       │
│  the new way to revise.|                                        │
│                                                                 │
│  The UK's most complete revision platform. Every subject,       │
│  every exam board, every specification point...                 │
│                                                                 │
│  [Start Revising Free →]  [See Pricing]                         │
│                                                                 │
│  Also available on  [App Store]  [Google Play]                  │
│                                                                 │
│  Scroll to explore ↓                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STATS BAR                                                      │
│  20+         5            2              4                      │
│  Subjects    Exam boards  Qualifications  Ways to study         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SCROLL SHOWCASE — 8 SCENES (each scene: sticky + scroll)       │
│                                                                 │
│  SCENE 1: LOGIN                                                 │
│    "Sign in. Get ahead." / "Your revision, your rules."         │
│    [phone: login screen scrubs as you scroll]                   │
│                                                                 │
│  SCENE 2: SUBJECT SELECTION                                     │
│    Header: "Most complete UK revision library."                 │
│    "Every major exam board." / "Foundation & Higher tiers."     │
│    / "Seconds to get started."                                  │
│    [phone: subject picker scrubs as you scroll]                 │
│                                                                 │
│  SCENE 3: SUBJECT OPENING + ANALYTICS                           │
│    Header: "Analytics that actually tell you something."        │
│    "Everything for one subject." / "Know your weaknesses."      │
│    / "Are you actually improving?" / "Every session recorded."  │
│    [phone: app scrubs through subject open → analytics]         │
│                                                                 │
│  SCENE 4: NOTES                                                 │
│    Header: "Notes that cover everything."                       │
│    "Every topic. Zero gaps." / "Paper 1, Paper 2, Paper 3."     │
│    / "Save. Print. Study offline."                              │
│    [phone: notes view scrubs as you scroll]                     │
│                                                                 │
│  SCENE 5: QUESTIONS + FLASHCARDS                               │
│    Header: "Stop reading. Start remembering."                   │
│    "Real exam formats." / "Lockin finds your weak spots."       │
│    / "Flip. Think. Remember." / "40 free. Unlimited Pro."       │
│    [phone: questions + flashcards scrub]                        │
│                                                                 │
│  SCENE 6: PAST PAPERS                                           │
│    Header: "Every past paper. Organised."                       │
│    "Practice like it's the real thing."                         │
│    / "Paper 1, Paper 2, Higher, Foundation."                    │
│    / "Learn → Practice → Paper."                                │
│    [phone: past papers view scrubs]                             │
│                                                                 │
│  SCENE 7: LEADERBOARD                                           │
│    Header: "Revision becomes a competition."                    │
│    "See where you rank." / "Your subject. Your rivals."         │
│    / "Top 3 get spotlighted."                                   │
│    [phone: leaderboard scrubs]                                  │
│                                                                 │
│  SCENE 8: STREAKS                                               │
│    Header: "Build the habit. Keep the streak."                  │
│    "Show up every day." / "Earn for every correct answer."      │
│    / "14 free passes per year."                                 │
│    [phone: streaks view scrubs]                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PRICING                                                        │
│  "Start free. Go further when you're ready."                    │
│                                                                 │
│  [  FREE £0  ]  [ ★ PRO £2.99 ★ ]  [  SUPER £4.99  ]          │
│                                                                 │
│  "Less than a coffee — for the whole exam season."              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FOOTER                                                         │
│                                                                 │
│  [Lockin logo]           Product        Support                 │
│  The all-in-one          Features       Resources               │
│  revision platform       How It Works   Study Articles          │
│  for UK students.        Pricing        Pass Rates              │
│                          Launch App     support@lockin.tech     │
│  [App Store] [Play] [Web]                                       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  © 2025 Lockin.tech. All rights reserved.                       │
│  Lockin.tech is a trading name of                               │
│  Young Enterprise (Gibraltar) Student Company Limited.          │
│  [Terms of Service]  [Privacy Policy]                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## AGENT IMPLEMENTATION CHECKLIST

When building from this plan, follow this order:

1. **Set up file structure** exactly as in Section 2
2. **Convert videos** using the ffmpeg command
3. **Build `index.html`** scaffold with all section IDs
4. **Copy `tokens.css`** verbatim from Section 3
5. **Add `reset.css`** (use Andy Bell's modern reset or similar)
6. **Add `global.css`** from Section 5
7. **Build Nav** (HTML + CSS + mobile burger JS)
8. **Build Hero** (HTML + CSS + typewriter JS)
9. **Build Stats Bar**
10. **Build one Showcase Scene** (test scroll scrub works)
11. **Clone and customise** remaining 7 scenes using the HTML pattern
12. **Build Pricing section**
13. **Build Footer**
14. **Add IntersectionObserver reveals** for all `.reveal-up` elements
15. **Test on iPhone Safari** — verify scroll scrubbing, check `playsinline`
16. **Performance pass** — lazy load videos, check font loading, minify CSS/JS if needed
17. **Accessibility pass** — all images have alt text, headings in logical order, focus visible

---

*Plan version: 2.0 | Prepared for Lockin.tech redesign | April 2026*
