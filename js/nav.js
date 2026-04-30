'Entries: 2/999999 (Not Modified Often)'

// Sticky nav scroll behaviour + mobile drawer + auth state
export function initNav() {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const drawer = document.getElementById('navDrawer');

  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger && drawer) {
    const setOpen = (open) => {
      drawer.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('nav-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };

    burger.addEventListener('click', () => {
      setOpen(!drawer.classList.contains('is-open'));
    });
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => setOpen(false));
    });
    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false);
    });
  }

  // Check Auth State
  const token = localStorage.getItem('lockin_auth_token');
  if (token) {
    document.querySelectorAll('.nav__auth-item').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.js-auth-only').forEach(el => {
      el.style.display = '';
      if (window.getComputedStyle(el).display === 'none') {
        el.style.display = 'inline-flex';
      }
    });
  } else {
    document.querySelectorAll('.nav__auth-item').forEach(el => el.style.display = '');
    document.querySelectorAll('.js-auth-only').forEach(el => el.style.display = 'none');
  }
}
