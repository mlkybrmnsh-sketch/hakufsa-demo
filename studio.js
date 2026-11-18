(() => {
  const options = [...document.querySelectorAll('#train .opt')];
  const images = [...document.querySelectorAll('#train .stage img')];

  function selectTraining(selectedIndex) {
    options.forEach((option, index) => {
      const button = option.querySelector('h3 button');
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      const selected = index === selectedIndex;
      option.classList.toggle('on', selected);
      button.setAttribute('aria-expanded', String(selected));
      panel.hidden = !selected;
    });
    if (selectedIndex !== -1) {
      images.forEach((image, index) => image.classList.toggle('on', index === selectedIndex));
    }
  }

  options.forEach((option, index) => {
    const button = option.querySelector('h3 button');
    button.addEventListener('click', () => {
      selectTraining(button.getAttribute('aria-expanded') === 'true' ? -1 : index);
    });
  });
  selectTraining(0);

  const dialog = document.getElementById('buy');
  const title = document.getElementById('buy-name');
  const description = document.getElementById('buy-description');
  const price = document.getElementById('buy-price');
  const contact = document.getElementById('plan-contact');

  document.querySelectorAll('[data-buy]').forEach((button) => {
    button.addEventListener('click', () => {
      title.textContent = button.dataset.buy;
      description.textContent = button.dataset.planDescription;
      price.textContent = button.dataset.price;
      contact.textContent = 'לבירור על ' + button.dataset.buy + ' בוואטסאפ';
      contact.href = 'https://wa.me/972532808081?text=' + encodeURIComponent('היי הקופסא, אשמח לשמוע פרטים על תוכנית ' + button.dataset.buy + '.');
      dialog.showModal();
    });
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) {
      dialog.close();
    }
  });
})();

const menuToggle = document.getElementById('menu-toggle');
const siteNav = document.getElementById('site-nav');
function setMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  siteNav.classList.toggle('open', open);
}
menuToggle.addEventListener('click', () => setMenu(!siteNav.classList.contains('open')));
siteNav.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.masthead')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && siteNav.classList.contains('open')) {
    setMenu(false);
    menuToggle.focus();
  }
});
matchMedia('(max-width: 720px)').addEventListener('change', () => setMenu(false));

const roomButtons = document.querySelectorAll('.room-select button');
roomButtons.forEach(button => {
  button.addEventListener('click', () => {
    roomButtons.forEach(item => {
      const active = item === button;
      item.setAttribute('aria-pressed', String(active));
      const photo = document.getElementById(item.getAttribute('aria-controls'));
      photo.classList.toggle('selected', active);
      photo.setAttribute('aria-hidden', String(!active));
    });
  });
});

const contactBar = document.querySelector('.bar');
const cover = document.querySelector('.cover');
const contactSection = document.querySelector('#contact');
if ('IntersectionObserver' in window) {
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    contactBar.classList.toggle('offscreen', visible.size > 0);
  });
  observer.observe(cover);
  observer.observe(contactSection);
}

// All text and controls work before the optional motion library arrives.
const motionSetting = matchMedia('(prefers-reduced-motion: reduce)');
if (!motionSetting.matches) {
  const library = document.createElement('script');
  library.src = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js';
  library.async = true;
  library.onload = () => {
    if (!window.gsap) return;
    const motion = gsap.matchMedia();
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      if (scrollY < 40) {
        gsap.from('.cover h1 span, .cover h1 strong', { y: 10, opacity: .83, stagger: .08, duration: .52, ease: 'power2.out', clearProps: 'transform,opacity' });
      }
      if (!('IntersectionObserver' in window)) return;
      const sections = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          gsap.from(entry.target, { y: 12, duration: .55, ease: 'power2.out', clearProps: 'transform' });
          sections.unobserve(entry.target);
        });
      }, { threshold: .18 });
      document.querySelectorAll('.block h2, .board-photo, .rooms-copy').forEach(item => sections.observe(item));
      return () => sections.disconnect();
    });
  };
  document.head.append(library);
}
(() => {
  const reel = document.querySelector('.studio-reel');
  if (!reel) return;
  const viewport = reel.querySelector('.studio-reel__viewport');
  const track = reel.querySelector('.studio-reel__track');
  const original = track.firstElementChild;
  const motionButton = reel.querySelector('.studio-reel__motion');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pixelsPerSecond = 34;
  let running = !reducedMotion.matches;
  let inView = true;
  let repeatWidth = 0;
  let stepWidth = 0;
  let offset = 0;
  let frame = 0;
  let previousTime = null;
  let gesture = null;

  function moveBy(distance) {
    if (!repeatWidth) return;
    // One complete set on the left lets a drag wrap in either direction.
    offset = ((offset + distance) % repeatWidth + repeatWidth) % repeatWidth;
    track.style.transform = 'translate3d(' + (offset - repeatWidth) + 'px, 0, 0)';
  }

  function measure() {
    const width = original.getBoundingClientRect().width;
    if (!width) return;
    const fraction = repeatWidth ? offset / repeatWidth : 0;
    repeatWidth = width;
    offset = fraction * repeatWidth;
    stepWidth = original.children[1].offsetLeft - original.children[0].offsetLeft;
    const setsNeeded = Math.ceil(viewport.clientWidth / width) + 1;
    while (track.children.length < setsNeeded) {
      const copy = original.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('img').forEach(image => { image.alt = ''; });
      track.append(copy);
    }
    while (track.children.length > setsNeeded) track.lastElementChild.remove();
    moveBy(0);
  }

  function tick(time) {
    if (previousTime !== null) moveBy((time - previousTime) * pixelsPerSecond / 1000);
    previousTime = time;
    frame = requestAnimationFrame(tick);
  }

  function syncMotion() {
    motionButton.classList.toggle('is-paused', !running);
    motionButton.setAttribute('aria-label', running ? 'השהיית התנועה' : 'הפעלת התנועה');
    const shouldAnimate = running && inView && !document.hidden;
    if (shouldAnimate && !frame) {
      previousTime = null;
      frame = requestAnimationFrame(tick);
    } else if (!shouldAnimate && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = null;
    }
  }

  function stopDrag() {
    if (!gesture) return;
    const pointerId = gesture.id;
    gesture = null;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(pointerId)) viewport.releasePointerCapture(pointerId);
  }

  viewport.addEventListener('pointerdown', event => {
    if (!event.isPrimary) { stopDrag(); return; }
    if (event.button !== 0) return;
    gesture = {id: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, horizontal: false};
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    if (!gesture.horizontal) {
      const dx = Math.abs(event.clientX - gesture.startX);
      const dy = Math.abs(event.clientY - gesture.startY);
      if (Math.max(dx, dy) < 4) return;
      if (dy > dx) { stopDrag(); return; }
      gesture.horizontal = true;
      viewport.classList.add('is-dragging');
    }
    // Drag displacement is added to the same phase as the independent clock.
    moveBy(event.clientX - gesture.lastX);
    gesture.lastX = event.clientX;
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => {
    viewport.addEventListener(type, event => {
      if (gesture && event.pointerId === gesture.id) stopDrag();
    });
  });

  viewport.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveBy((event.key === 'ArrowRight' ? 1 : -1) * stepWidth);
  });
  reel.querySelectorAll('[data-reel-step]').forEach(button => {
    button.addEventListener('click', () => moveBy(Number(button.dataset.reelStep) * stepWidth));
  });
  motionButton.addEventListener('click', () => { running = !running; syncMotion(); });
  reducedMotion.addEventListener('change', event => { running = !event.matches; syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('blur', stopDrag);

  reel.classList.add('is-ready');
  measure();
  const resize = new ResizeObserver(measure);
  resize.observe(viewport);
  resize.observe(original);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncMotion();
  }, {rootMargin: '100px 0px'}).observe(reel);
  syncMotion();
})();
