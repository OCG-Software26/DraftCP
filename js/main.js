/* =============================================================
   DraftCP Website — main.js
   - Canvas particle system (point cloud simulation)
   - Navbar scroll behavior
   - Hamburger menu
   - Scroll reveal animations (IntersectionObserver)
   - Active nav link on scroll
   ============================================================= */

'use strict';

/* ── 1. CANVAS PARTICLE SYSTEM (Point Cloud Hero) ────────── */
(function initCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  const isMobile = () => window.innerWidth < 768;
  const COUNT = isMobile() ? 70 : 150;

  const COLORS = ['#3d9cf0', '#39d4db', '#3d9cf0', '#8b949e', '#3d4d63'];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.init(); }

    init() {
      this.x = Math.random() * (W || window.innerWidth);
      this.y = Math.random() * (H || window.innerHeight);
      this.r = Math.random() * 1.6 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.28;
      this.vy = (Math.random() - 0.5) * 0.28;
      this.alpha = Math.random() * 0.45 + 0.08;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) {
        this.init();
        // Re-randomize edge entry
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { this.x = Math.random() * W; this.y = -5; }
        else if (edge === 1) { this.x = W + 5; this.y = Math.random() * H; }
        else if (edge === 2) { this.x = Math.random() * W; this.y = H + 5; }
        else { this.x = -5; this.y = Math.random() * H; }
      }
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  let particles = [];

  function initParticles() {
    particles = Array.from({ length: COUNT }, () => new Particle());
  }

  function drawConnections() {
    const MAX_D = isMobile() ? 80 : 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_D) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / MAX_D) * 0.06;
          ctx.strokeStyle = '#3d9cf0';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  let animId;
  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(animate);
  }

  // Pause canvas when hero is not visible (performance)
  const heroSection = document.querySelector('.hero');
  if (heroSection && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          if (!animId) animate();
        } else {
          cancelAnimationFrame(animId);
          animId = null;
        }
      });
    }, { threshold: 0.05 });
    heroObserver.observe(heroSection);
  }

  resize();
  initParticles();
  animate();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      initParticles();
    }, 200);
  }, { passive: true });
})();


/* ── 2. NAVBAR SCROLL BEHAVIOR ─────────────────────────────── */
(function initNavbar() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 20);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();


/* ── 3. HAMBURGER MENU ─────────────────────────────────────── */
(function initHamburger() {
  const btn     = document.getElementById('hamburger-btn');
  const overlay = document.getElementById('mobile-nav');
  if (!btn || !overlay) return;

  function setOpen(open) {
    btn.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    btn.setAttribute('aria-expanded', String(open));
  }

  btn.addEventListener('click', () => setOpen(!btn.classList.contains('open')));

  overlay.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) setOpen(false);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') setOpen(false);
  });
})();


/* ── 4. SCROLL REVEAL (IntersectionObserver) ───────────────── */
(function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length || !('IntersectionObserver' in window)) {
    // Fallback: show everything immediately
    els.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
})();


/* ── 5. ACTIVE NAV LINK ────────────────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.header-nav a[href^="#"]');
  if (!sections.length || !navLinks.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(s => observer.observe(s));
})();


/* ── 6. SMOOTH SCROLL FOR ANCHOR LINKS ────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      const headerH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--header-h')) || 68;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
