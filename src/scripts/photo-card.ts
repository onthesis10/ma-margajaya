/**
 * photo-card.ts — Living Photo Cards interactivity
 * Handles: panel open/close · focus trap · keyboard nav · swipe · tilt · word reveal
 * No dependencies — vanilla JS only, < 4 KB gzipped
 */

export function initPhotoCards(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Collect all cards and panels (matched by index)
  const cards  = Array.from(document.querySelectorAll<HTMLElement>('[data-photo-card]'));
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-photo-panel]'));

  if (!cards.length || !panels.length) return;

  // Teleport all panels to document.body so they are never trapped inside
  // transformed, overflow-hidden, or scroll-snapped ancestor containers.
  // This completely eliminates containing-block issues, cursor jitter, and disco flickering!
  panels.forEach(panel => {
    if (panel.parentElement !== document.body) {
      document.body.appendChild(panel);
    }
  });

  let activePanel: HTMLElement | null = null;
  let originCard:  HTMLElement | null = null;
  let currentIdx  = 0;

  // ── Helpers ────────────────────────────────────────────────────
  function getFocusable(el: HTMLElement): HTMLElement[] {
    return Array.from(
      el.querySelectorAll<HTMLElement>(
        'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(e => !e.closest('[hidden]'));
  }

  // ── Word reveal ───────────────────────────────────────────────
  function revealWords(panel: HTMLElement): void {
    if (reduced) return;
    const words = panel.querySelectorAll<HTMLElement>('[data-word]');
    words.forEach((w, i) => {
      w.style.color = 'var(--color-ink-muted, #64748B)';
      setTimeout(() => {
        w.style.transition = 'color 0.3s ease';
        w.style.color = 'var(--color-ink, #111827)';
      }, i * 18);
    });
  }

  // ── Open panel ────────────────────────────────────────────────
  function openPanel(idx: number, from: HTMLElement): void {
    if (idx < 0 || idx >= panels.length) return;

    // Close any open panel instantly (no animation)
    if (activePanel) {
      activePanel.setAttribute('hidden', '');
      activePanel.setAttribute('aria-hidden', 'true');
      activePanel.classList.remove('is-closing');
    }

    currentIdx  = idx;
    originCard  = from;
    activePanel = panels[idx];

    activePanel.removeAttribute('hidden');
    activePanel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus close button safely inside panel
    requestAnimationFrame(() => {
      const closeBtn = activePanel!.querySelector<HTMLElement>('.pc-close-btn');
      if (closeBtn) {
        closeBtn.focus({ preventScroll: true });
      } else {
        const focusable = getFocusable(activePanel!);
        focusable[0]?.focus({ preventScroll: true });
      }
      revealWords(activePanel!);
    });
  }

  // ── Close panel ───────────────────────────────────────────────
  function closePanel(returnFocus = true): void {
    if (!activePanel) return;
    const panel = activePanel;
    activePanel = null;

    if (!reduced) {
      panel.classList.add('is-closing');
      setTimeout(() => {
        panel.setAttribute('hidden', '');
        panel.setAttribute('aria-hidden', 'true');
        panel.classList.remove('is-closing');
        // Reset word colours for next open
        panel.querySelectorAll<HTMLElement>('[data-word]').forEach(w => {
          w.style.transition = '';
          w.style.color = '';
        });
      }, 230);
    } else {
      panel.setAttribute('hidden', '');
      panel.setAttribute('aria-hidden', 'true');
    }

    document.body.style.overflow = '';
    if (returnFocus && originCard) originCard.focus({ preventScroll: true });
    originCard = null;
  }

  // ── Navigate to adjacent panel ────────────────────────────────
  function navPanel(dir: 1 | -1): void {
    let next = currentIdx + dir;
    if (next < 0)              next = panels.length - 1;
    if (next >= panels.length) next = 0;
    openPanel(next, cards[next]);
  }

  // ── Focus trap ────────────────────────────────────────────────
  function trapFocus(e: KeyboardEvent): void {
    if (!activePanel || e.key !== 'Tab') return;
    const focusable = getFocusable(activePanel);
    if (!focusable.length) { e.preventDefault(); return; }
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // ── Global keyboard handler ───────────────────────────────────
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!activePanel) return;
    switch (e.key) {
      case 'Escape':     e.preventDefault(); closePanel(); break;
      case 'Tab':        trapFocus(e); break;
      case 'ArrowRight':
      case 'ArrowDown':  e.preventDefault(); navPanel(1);  break;
      case 'ArrowLeft':
      case 'ArrowUp':    e.preventDefault(); navPanel(-1); break;
    }
  });

  // ── Card click / keyboard activation ─────────────────────────
  cards.forEach((card, idx) => {
    card.addEventListener('click', (e: MouseEvent) => {
      // Let modifier keys (Cmd/Ctrl/Shift) open link naturally in new tab
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (card.tagName.toLowerCase() === 'a') {
        e.preventDefault();
      }
      openPanel(idx, card);
    });
    card.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPanel(idx, card);
      }
    });
  });

  // ── Panel controls (close / prev / next) ─────────────────────
  panels.forEach((panel, idx) => {
    // Stop propagation on modal frame so clicks inside don't bubble to backdrop
    panel.querySelector('.pc-frame')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
    });

    // Backdrop click only closes when clicking the backdrop itself
    panel.addEventListener('click', (e: MouseEvent) => {
      if (e.target === panel) closePanel();
    });

    // Close buttons
    panel.querySelectorAll('[data-close-panel]').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        closePanel();
      });
    });

    // Prev button
    panel.querySelector('[data-prev-panel]')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      navPanel(-1);
    });

    // Next button
    panel.querySelector('[data-next-panel]')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      navPanel(1);
    });
  });

  // ── Touch swipe inside panel ──────────────────────────────────
  panels.forEach(panel => {
    let touchStartX = 0;
    panel.addEventListener('touchstart', (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    panel.addEventListener('touchend', (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 60) return;
      navPanel(dx < 0 ? 1 : -1);
    }, { passive: true });
  });
}
