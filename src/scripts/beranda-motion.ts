import { animate, inView, stagger } from 'motion';

/**
 * Beranda Framer Motion & Interactive Cursor Proximity Glow Engine
 * MA Margajaya Official Portal
 */

export function initBerandaInteractions() {
  if (typeof window === 'undefined') return;

  // 1. Ambient Background Cursor Follower
  initAmbientCursorGlow();

  // 2. Card Proximity Spotlight & Border Glow (Event Delegated for 100% dynamic support)
  initSpotlightGlowCards();

  // 3. 3D Subtle Tilt on Cursor Movement (Event Delegated)
  initTiltCards();

  // 4. Framer Motion Scroll Reveals & Spring Animations
  initScrollAnimations();

  // 5. Dynamic Stats Counter Animation
  initStatsCounters();

  // 6. Sambutan: Photo Slide-in & Typing Effect
  initSambutanAnimations();
}

/**
 * 1. Global Ambient Cursor Follower
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
  let rafId: number | null = null;

  function updatePosition() {
    currentX += (mouseX - currentX) * 0.12;
    currentY += (mouseY - currentY) * 0.12;

    if (ambientGlow) {
      ambientGlow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    }

    if (Math.abs(mouseX - currentX) > 0.1 || Math.abs(mouseY - currentY) > 0.1) {
      rafId = requestAnimationFrame(updatePosition);
    } else {
      isMoving = false;
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (ambientGlow && ambientGlow.style.opacity !== '0.7') {
      ambientGlow.style.opacity = '0.7';
    }

    if (!isMoving) {
      isMoving = true;
      rafId = requestAnimationFrame(updatePosition);
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    if (ambientGlow) ambientGlow.style.opacity = '0';
  });
}

/**
 * 2. Card Proximity Spotlight Glow
 * Delegated to document for instant high-fps tracking across all current & dynamic cards
 */
function initSpotlightGlowCards() {
  document.addEventListener('mousemove', (e) => {
    const target = (e.target as HTMLElement)?.closest?.('.glow-card, .pure-glow-card, [data-glow]') as HTMLElement | null;
    if (target) {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      target.style.setProperty('--mouse-x', `${x}px`);
      target.style.setProperty('--mouse-y', `${y}px`);
      target.style.setProperty('--glow-opacity', '1');
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
 * 3. 3D Subtle Card Tilt on Proximity
 */
function initTiltCards() {
  document.addEventListener('mousemove', (e) => {
    const wrapper = (e.target as HTMLElement)?.closest?.('.tilt-card-wrapper') as HTMLElement | null;
    if (wrapper) {
      const inner = wrapper.querySelector<HTMLElement>('.tilt-card-inner') || wrapper;
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      inner.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
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
 * 4. Framer Motion Scroll Reveals & Spring Transitions
 */
function initScrollAnimations() {
  // Hero Entrance Animations
  const heroTitle = document.querySelector('#hero-title');
  const heroSubtitle = document.querySelector('#hero-subtitle');
  const heroBadges = document.querySelector('#hero-badge');
  const heroActions = document.querySelector('#hero-actions');

  if (heroTitle) {
    animate(
      heroTitle,
      { opacity: [0, 1], y: [35, 0] },
      { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
    );
  }

  if (heroBadges) {
    animate(
      heroBadges,
      { opacity: [0, 1], x: [-20, 0] },
      { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
    );
  }

  if (heroSubtitle) {
    animate(
      heroSubtitle,
      { opacity: [0, 1], y: [20, 0] },
      { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }
    );
  }

  if (heroActions) {
    animate(
      heroActions,
      { opacity: [0, 1], y: [20, 0], scale: [0.96, 1] },
      { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.35 }
    );
  }

  // Staggered Sections Scroll Reveal
  const motionSections = document.querySelectorAll<HTMLElement>('[data-motion-section]');

  motionSections.forEach((section) => {
    inView(section, () => {
      // 1. Reveal Section Header / Title
      const titles = section.querySelectorAll<HTMLElement>('[data-motion-title]');
      if (titles.length > 0) {
        animate(
          titles,
          { opacity: [0, 1], y: [30, 0] },
          { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
        );
      }

      // 2. Reveal Staggered Children / Cards
      const items = section.querySelectorAll<HTMLElement>('[data-motion-item]');
      if (items.length > 0) {
        animate(
          items,
          { opacity: [0, 1], y: [35, 0], scale: [0.97, 1] },
          { 
            delay: stagger(0.08, { start: 0.15 }), 
            duration: 0.65, 
            ease: [0.16, 1, 0.3, 1] 
          }
        );
      }

      // 3. Reveal Single Visual Element
      const visual = section.querySelector<HTMLElement>('[data-motion-visual]');
      if (visual) {
        animate(
          visual,
          { opacity: [0, 1], scale: [0.94, 1], y: [25, 0] },
          { duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
        );
      }
    }, { margin: '-60px' });
  });
}

/**
 * 5. Dynamic Stats Counter Animation (Cascading Easing & Tabular Numbers)
 */
function initStatsCounters() {
  const statsContainer = document.querySelector('#stats-section');
  if (!statsContainer) return;

  const counterElements = statsContainer.querySelectorAll<HTMLElement>('[data-counter-target]');
  if (counterElements.length === 0) return;

  // Set initial text to 0
  counterElements.forEach(el => {
    el.textContent = '0';
  });

  let hasAnimated = false;

  const runCounter = () => {
    if (hasAnimated) return;
    hasAnimated = true;

    counterElements.forEach((el, index) => {
      const rawTarget = el.getAttribute('data-counter-target') || '0';
      const targetNumber = parseFloat(rawTarget.replace(/[^0-9.]/g, '')) || 0;
      if (targetNumber === 0) return;

      const duration = 1800; // 1.8 detik
      const delay = index * 140; // Staggered cascade per kolom

      setTimeout(() => {
        const startTime = performance.now();

        // Ease Out Expo: cepat di awal, melambat sangat halus di akhir
        const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const updateCounter = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutExpo(progress);

          const currentVal = Math.round(targetNumber * easedProgress);
          el.textContent = currentVal.toString();

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            el.textContent = targetNumber.toString();
            // Subtle bounce pop saat angka selesai tercapai
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
      }, delay);
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(statsContainer);
  } else {
    runCounter();
  }
}

/**
 * 6. Sambutan Section — Photo slide-from-left & Live Typing Effect
 */
function initSambutanAnimations() {
  const section = document.getElementById('sambutan-section');
  if (!section) return;

  const photoCol = section.querySelector<HTMLElement>('[data-sambutan-photo]');
  const typingSpans = section.querySelectorAll<HTMLElement>('[data-sambutan-typing]');
  const cursors = section.querySelectorAll<HTMLElement>('.sambutan-cursor');

  // Hide cursors initially
  cursors.forEach(c => { c.style.opacity = '0'; });

  let triggered = false;

  inView(section, () => {
    if (triggered) return;
    triggered = true;

    // --- Photo: slide in from left (overrides generic data-motion-visual for this section) ---
    if (photoCol) {
      animate(
        photoCol,
        { opacity: [0, 1], x: [-80, 0], scale: [0.95, 1] },
        { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }
      );
    }

    // --- Typing: start sequentially after slide completes ---
    const typeText = (span: HTMLElement, cursor: HTMLElement | null, delay: number, onDone?: () => void) => {
      const fullText = span.getAttribute('data-typing-text') || '';
      span.textContent = '';
      if (cursor) {
        cursor.style.opacity = '1';
        cursor.style.animation = 'sambutan-blink 0.75s step-end infinite';
      }

      let i = 0;
      const speed = 18; // ms per character

      setTimeout(() => {
        const tick = () => {
          if (i < fullText.length) {
            span.textContent += fullText[i];
            i++;
            setTimeout(tick, speed);
          } else {
            // Done typing — stop blink cursor
            if (cursor) {
              cursor.style.animation = 'none';
              cursor.style.opacity = '0';
            }
            if (onDone) onDone();
          }
        };
        tick();
      }, delay);
    };

    if (typingSpans.length >= 2) {
      const span1 = typingSpans[0] as HTMLElement;
      const span2 = typingSpans[1] as HTMLElement;
      const cursor1 = span1.parentElement?.querySelector<HTMLElement>('.sambutan-cursor') || null;
      const cursor2 = span2.parentElement?.querySelector<HTMLElement>('.sambutan-cursor') || null;
      const text1Len = (span1.getAttribute('data-typing-text') || '').length;

      // Start p1 typing after photo slide (700ms), then p2 starts after p1 finishes
      typeText(span1, cursor1, 700, () => {
        typeText(span2, cursor2, 200);
      });
    } else if (typingSpans.length === 1) {
      const span1 = typingSpans[0] as HTMLElement;
      const cursor1 = span1.parentElement?.querySelector<HTMLElement>('.sambutan-cursor') || null;
      typeText(span1, cursor1, 700);
    }
  }, { margin: '-60px' });
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBerandaInteractions);
  } else {
    initBerandaInteractions();
  }
}
