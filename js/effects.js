// Visual effects: page transitions, cursor, typing, scroll reveal, count-up, nav, parallax
const Effects = {
  _revealObs: null,

  init() {
    this.initPageLoader();
    this.initNavTransitions();
    this.initCursor();
    this.initTyping();
    this.initScrollReveal();
    this.initCountUp();
    this.initActiveNav();
    this.initDoodleParallax();
    this.initSmoothSections();
  },

  /* ── Page load curtain ── */
  initPageLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;

    const dismiss = () => {
      setTimeout(() => {
        loader.classList.add('done');
        document.querySelectorAll('#hero .hero-inner > *').forEach((el, i) => {
          el.style.animationDelay = (0.1 + i * 0.08) + 's';
        });
      }, 600);
      setTimeout(() => loader.remove(), 1300);
    };

    if (document.readyState === 'complete') {
      dismiss();
    } else {
      window.addEventListener('load', dismiss);
    }
  },

  /* ── Nav click smooth transition ── */
  initNavTransitions() {
    const wipe = document.getElementById('nav-wipe');
    if (!wipe) return;

    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        // Flash the wipe overlay
        wipe.classList.add('active');

        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth' });
          wipe.classList.remove('active');
        }, 200);
      });
    });
  },

  /* ── Smooth section scroll tracking ── */
  initSmoothSections() {
    const sections = document.querySelectorAll('section[id]');
    const sectionObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('active-section', entry.isIntersecting);
      });
    }, { threshold: 0.15 });

    sections.forEach(s => {
      s.classList.add('section-highlight');
      sectionObs.observe(s);
    });
  },

  refreshHovers() {
    const cur = document.getElementById('cursor');
    if (!cur) return;
    document.querySelectorAll(
      'a, button, .skill-tag, .project-card, .stat-card, .admin-btn, .modal-close, .admin-icon-btn'
    ).forEach(el => {
      if (el._hoverBound) return;
      el._hoverBound = true;
      el.addEventListener('mouseenter', () => cur.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cur.classList.remove('hovering'));
    });
  },

  initCursor() {
    const cur = document.getElementById('cursor');
    const ring = document.getElementById('cursor-ring');
    if (!cur || !ring) return;
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cur.style.setProperty('--cx', (mx - 4) + 'px');
      cur.style.setProperty('--cy', (my - 4) + 'px');
    });

    (function tick() {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      ring.style.setProperty('--rx', (rx - 16) + 'px');
      ring.style.setProperty('--ry', (ry - 16) + 'px');
      requestAnimationFrame(tick);
    })();

    this.refreshHovers();
  },

  initTyping() {
    const titles = [
      '< Full Stack Developer />',
      '< AI / ML Engineer />',
      '< Open Source Builder />'
    ];
    const el = document.getElementById('typed-title');
    if (!el) return;
    let ti = 0, ci = 0, deleting = false;

    const cursorSpan = document.createElement('span');
    cursorSpan.className = 'typed-cursor';
    el.appendChild(cursorSpan);

    function type() {
      const t = titles[ti];
      if (!deleting) {
        ci++;
        const txt = el.childNodes[0];
        if (txt && txt.nodeType === 3) el.removeChild(txt);
        el.insertBefore(document.createTextNode(t.slice(0, ci)), cursorSpan);
        if (ci === t.length) { deleting = true; setTimeout(type, 1800); return; }
        setTimeout(type, 60);
      } else {
        ci--;
        const txt = el.childNodes[0];
        if (txt && txt.nodeType === 3) el.removeChild(txt);
        if (ci > 0) el.insertBefore(document.createTextNode(t.slice(0, ci)), cursorSpan);
        if (ci === 0) { deleting = false; ti = (ti + 1) % titles.length; setTimeout(type, 400); return; }
        setTimeout(type, 38);
      }
    }
    setTimeout(type, 1200);
  },

  observeReveals() {
    if (!this._revealObs) return;
    document.querySelectorAll('.reveal:not(.observed)').forEach(el => {
      el.classList.add('observed');
      const grid = el.closest('.projects-grid, .skills-grid, .about-stats, .socials');
      if (grid) {
        const siblings = Array.from(grid.querySelectorAll('.reveal'));
        el.dataset.delay = siblings.indexOf(el) * 80;
      }
      this._revealObs.observe(el);
    });
  },

  initScrollReveal() {
    this._revealObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = parseInt(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add('visible'), delay);
      });
    }, { threshold: 0.08 });
    this.observeReveals();
  },

  initCountUp() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('[data-count]').forEach(num => {
          const target = +num.dataset.count;
          let cur = 0;
          const step = target / 45;
          const suffix = target >= 10 ? '+' : '';
          const t = setInterval(() => {
            cur = Math.min(cur + step, target);
            num.textContent = Math.floor(cur) + suffix;
            if (cur >= target) clearInterval(t);
          }, 35);
        });
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    const statsEl = document.querySelector('.about-stats');
    if (statsEl) obs.observe(statsEl);
  },

  initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navAs = document.querySelectorAll('.nav-links a');
    window.addEventListener('scroll', () => {
      let active = '';
      sections.forEach(s => { if (window.scrollY >= s.offsetTop - 220) active = s.id; });
      navAs.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${active}`));
    }, { passive: true });
  },

  initDoodleParallax() {
    document.addEventListener('mousemove', e => {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx, dy = (e.clientY - cy) / cy;
      document.querySelectorAll('.doodle').forEach((d, i) => {
        const depth = (i + 1) * 8;
        d.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
      });
    }, { passive: true });
  }
};

window.Effects = Effects;
