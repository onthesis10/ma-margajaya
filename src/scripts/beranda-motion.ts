import { animate, inView, stagger } from 'motion';

/**
 * Beranda Motion & Interactive Cursor Proximity Glow Engine
 * MA Margajaya Official Portal
 *
 * Strategi performa:
 * - Hero entrance: langsung saat DOMContentLoaded (hindari flash of invisible text)
 * - Scroll reveals, counters, mouse effects: defer via requestIdleCallback setelah LCP
 * - Mouse glow/tilt: HANYA di perangkat pointer:fine (bukan layar sentuh)
 */

const hasHover = typeof window !== 'undefined'
  ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
  : false;

// ─── FASE 1: Hero Entrance — langsung saat DOM siap ──────────────────────────
// Penting: JANGAN defer ini, atau hero bisa flash opacity:0 setelah 0-3 detik.

function initHeroAnimations() {
  const heroTitle   = document.querySelector('#hero-title');
  const heroSubtitle = document.querySelector('#hero-subtitle');
  const heroBadges  = document.querySelector('#hero-badge');
  const heroActions = document.querySelector('#hero-actions');

  if (heroTitle)    animate(heroTitle,    { opacity: [0, 1], y: [35, 0] },           { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
  if (heroBadges)   animate(heroBadges,   { opacity: [0, 1], x: [-20, 0] },          { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 });
  if (heroSubtitle) animate(heroSubtitle, { opacity: [0, 1], y: [20, 0] },           { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 });
  if (heroActions)  animate(heroActions,  { opacity: [0, 1], y: [20, 0], scale: [0.96, 1] }, { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.35 });
}

// ─── FASE 2: Non-critical — defer via requestIdleCallback ────────────────────

export function initBerandaInteractions() {
  if (typeof window === 'undefined') return;

  // Mouse effects hanya di perangkat hover (bukan HP/tablet sentuh)
  if (hasHover) {
    initAmbientCursorGlow();
    initSpotlightGlowCards();
    initTiltCards();
  }

  initScrollAnimations();
  initStatsCounters();
  initSambutanAnimations();
}

/**
 * 1. Global Ambient Cursor Follower (hover devices only)
 */
function initAmbientCursorGlow() {
  let ambientGlow = document.getElementById('ambient-cursor-glow');
  if (!ambientGlow) {
    ambientGlow = document.createElement('div');
    ambientGlow.id = 'ambient-cursor-glow';
    ambientGlow.className = 'ambient-cursor-glow';
    document.body.appendChild(ambientGlow);
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;
  let isMoving = false;

  function updatePosition() {
    currentX += (mouseX - currentX) * 0.12;
    currentY += (mouseY - currentY) * 0.12;
    if (ambientGlow) {
      ambientGlow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    }
    if (Math.abs(mouseX - currentX) > 0.1 || Math.abs(mouseY - currentY) > 0.1) {
      requestAnimationFrame(updatePosition);
    } else {
      isMoving = false;
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (ambientGlow && ambientGlow.style.opacity !== '0.7') ambientGlow.style.opacity = '0.7';
    if (!isMoving) { isMoving = true; requestAnimationFrame(updatePosition); }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    if (ambientGlow) ambientGlow.style.opacity = '0';
  });
}

/**
 * 2. Card Proximity Spotlight Glow (hover devices only, RAF-throttled)
 */
function initSpotlightGlowCards() {
  let rafPending = false;
  let lastE: MouseEvent | null = null;

  document.addEventListener('mousemove', (e) => {
    lastE = e;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if (!lastE) return;
        const target = (lastE.target as HTMLElement)?.closest?.('.glow-card, .pure-glow-card, [data-glow]') as HTMLElement | null;
        if (target) {
          const rect = target.getBoundingClientRect();
          target.style.setProperty('--mouse-x', `${lastE.clientX - rect.left}px`);
          target.style.setProperty('--mouse-y', `${lastE.clientY - rect.top}px`);
          target.style.setProperty('--glow-opacity', '1');
        }
      });
    }
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    const target = (e.target as HTMLElement)?.closest?.('.glow-card, .pure-glow-card, [data-glow]') as HTMLElement | null;
    if (target && !target.contains(e.relatedTarget as Node | null)) {
      target.style.setProperty('--glow-opacity', '0');
    }
  }, { passive: true });
}

/**
 * 3. 3D Subtle Card Tilt (hover devices only, RAF-throttled)
 */
function initTiltCards() {
  let rafPending = false;
  let lastE: MouseEvent | null = null;

  document.addEventListener('mousemove', (e) => {
    lastE = e;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if (!lastE) return;
        const wrapper = (lastE.target as HTMLElement)?.closest?.('.tilt-card-wrapper') as HTMLElement | null;
        if (wrapper) {
          const inner = wrapper.querySelector<HTMLElement>('.tilt-card-inner') || wrapper;
          const rect = wrapper.getBoundingClientRect();
          const rotateX = ((lastE.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -5;
          const rotateY = ((lastE.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 5;
          inner.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
        }
      });
    }
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    const wrapper = (e.target as HTMLElement)?.closest?.('.tilt-card-wrapper') as HTMLElement | null;
    if (wrapper && !wrapper.contains(e.relatedTarget as Node | null)) {
      const inner = wrapper.querySelector<HTMLElement>('.tilt-card-inner') || wrapper;
      inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  }, { passive: true });
}

/**
 * 4. Scroll Reveals & Spring Animations
 */
function initScrollAnimations() {
  const motionSections = document.querySelectorAll<HTMLElement>('[data-motion-section]');

  motionSections.forEach((section) => {
    inView(section, () => {
      const titles = section.querySelectorAll<HTMLElement>('[data-motion-title]');
      if (titles.length > 0) {
        animate(titles, { opacity: [0, 1], y: [30, 0] }, { duration: 0.7, ease: [0.16, 1, 0.3, 1] });
      }

      const items = section.querySelectorAll<HTMLElement>('[data-motion-item]');
      if (items.length > 0) {
        animate(items, { opacity: [0, 1], y: [35, 0], scale: [0.97, 1] }, {
          delay: stagger(0.08, { start: 0.15 }),
          duration: 0.65,
          ease: [0.16, 1, 0.3, 1],
        });
      }

      const visual = section.querySelector<HTMLElement>('[data-motion-visual]');
      if (visual) {
        animate(visual, { opacity: [0, 1], scale: [0.94, 1], y: [25, 0] }, {
          duration: 0.85,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.1,
        });
      }
    }, { margin: '-60px' });
  });
}

/**
 * 5. Dynamic Stats Counter Animation
 */
function initStatsCounters() {
  const statsContainer = document.querySelector('#stats-section');
  if (!statsContainer) return;

  const counterElements = statsContainer.querySelectorAll<HTMLElement>('[data-counter-target]');
  if (counterElements.length === 0) return;

  counterElements.forEach(el => { el.textContent = '0'; });

  let hasAnimated = false;

  const runCounter = () => {
    if (hasAnimated) return;
    hasAnimated = true;

    counterElements.forEach((el, index) => {
      const rawTarget = el.getAttribute('data-counter-target') || '0';
      const targetNumber = parseFloat(rawTarget.replace(/[^0-9.]/g, '')) || 0;
      if (targetNumber === 0) return;

      setTimeout(() => {
        const startTime = performance.now();
        const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const updateCounter = (now: number) => {
          const progress = Math.min((now - startTime) / 1800, 1);
          el.textContent = Math.round(targetNumber * easeOutExpo(progress)).toString();

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            el.textContent = targetNumber.toString();
            el.style.transform = 'scale(1.08)';
            const suffix = el.nextElementSibling as HTMLElement | null;
            if (suffix) suffix.style.transform = 'scale(1.2)';
            setTimeout(() => {
              el.style.transform = 'scale(1)';
              if (suffix) suffix.style.transform = '';
            }, 250);
          }
        };
        requestAnimationFrame(updateCounter);
      }, index * 140);
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) { runCounter(); observer.disconnect(); } }); },
      { threshold: 0.25, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(statsContainer);
  } else {
    runCounter();
  }
}

/**
 * 6. Sambutan — CSS opacity reveal (teks sudah di DOM, JS hanya mengungkap)
 *
 * Penting: teks paragraf SUDAH ADA di HTML (SEO-safe, accessible tanpa JS).
 * JS menyembunyikan lalu mengungkap dengan opacity transition.
 * Jika paragraf sudah di viewport saat idle callback dipanggil (mis. tab kecil),
 * animasi dilewati dan teks dibiarkan terlihat.
 */
function initSambutanAnimations() {
  const section = document.getElementById('sambutan-section');
  if (!section) return;

  const photoCol = section.querySelector<HTMLElement>('[data-sambutan-photo]');
  const typingParagraphs = section.querySelectorAll<HTMLElement>('[data-sambutan-typing]');
  const cursors = section.querySelectorAll<HTMLElement>('.sambutan-cursor');

  // Sembunyikan hanya jika paragraf belum di-viewport
  // (jika sudah terlihat, jangan flash-hide; biarkan tampil normal)
  const alreadyVisible = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  let anyVisible = false;
  typingParagraphs.forEach(p => {
    if (!alreadyVisible(p)) {
      p.style.opacity = '0';
    } else {
      anyVisible = true;
    }
  });

  // Jika semua sudah terlihat → lewati animasi, biarkan teks muncul normal
  if (anyVisible) {
    cursors.forEach(c => { c.style.display = 'none'; });
    return;
  }

  cursors.forEach(c => { c.style.opacity = '0'; });

  let triggered = false;

  inView(section, () => {
    if (triggered) return;
    triggered = true;

    // Photo: slide in dari kiri
    if (photoCol) {
      animate(
        photoCol,
        { opacity: [0, 1], x: [-80, 0], scale: [0.95, 1] },
        { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }
      );
    }

    // Reveal paragraf dengan opacity transition (teks sudah ada di DOM)
    const revealParagraph = (p: HTMLElement, cursor: HTMLElement | null, delay: number, onDone?: () => void) => {
      if (cursor) {
        cursor.style.opacity = '1';
        cursor.style.animation = 'sambutan-blink 0.75s step-end infinite';
      }

      setTimeout(() => {
        p.style.transition = 'opacity 0.8s ease';
        p.style.opacity = '1';

        const revealDuration = Math.min((p.textContent?.length ?? 100) * 15, 2000);
        setTimeout(() => {
          if (cursor) { cursor.style.animation = 'none'; cursor.style.opacity = '0'; }
          if (onDone) onDone();
        }, revealDuration);
      }, delay);
    };

    if (typingParagraphs.length >= 2) {
      const p1 = typingParagraphs[0];
      const p2 = typingParagraphs[1];
      const c1 = p1.parentElement?.querySelector<HTMLElement>('.sambutan-cursor') ?? null;
      const c2 = p2.parentElement?.querySelector<HTMLElement>('.sambutan-cursor') ?? null;
      revealParagraph(p1, c1, 700, () => revealParagraph(p2, c2, 200));
    } else if (typingParagraphs.length === 1) {
      const p1 = typingParagraphs[0];
      const c1 = p1.parentElement?.querySelector<HTMLElement>('.sambutan-cursor') ?? null;
      revealParagraph(p1, c1, 700);
    }
  }, { margin: '-60px' });
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  // FASE 1: hero langsung (tidak boleh di-defer)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroAnimations, { once: true });
  } else {
    initHeroAnimations();
  }

  // FASE 2: efek scroll/counter/mouse → defer setelah browser idle
  const runDeferred = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBerandaInteractions, { once: true });
    } else {
      initBerandaInteractions();
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runDeferred, { timeout: 3000 });
  } else {
    // Safari fallback: defer 300ms setelah load
    if (document.readyState === 'complete') {
      setTimeout(runDeferred, 300);
    } else {
      window.addEventListener('load', () => setTimeout(runDeferred, 300), { once: true });
    }
  }
}
