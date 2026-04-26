// Terms & Privacy section switcher
const navLinks = document.querySelectorAll('.legal-nav__link');
const sections = document.querySelectorAll('.legal-section');

function switchSection(id) {
  navLinks.forEach(l => l.classList.toggle('legal-nav__link--active', l.dataset.section === id));
  sections.forEach(s => s.classList.toggle('legal-section--active', s.id === id));
}

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const id = link.dataset.section;
    switchSection(id);
    history.pushState(null, '', `#${id}`);
    const target = document.querySelector('.legal-content');
    if (target) window.scrollTo({ top: target.offsetTop - 100, behavior: 'smooth' });
  });
});

if (window.location.hash) {
  const hash = window.location.hash.substring(1);
  if (hash === 'terms' || hash === 'privacy') switchSection(hash);
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.substring(1);
  if (hash === 'terms' || hash === 'privacy') switchSection(hash);
});
