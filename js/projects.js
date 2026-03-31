// Project data management and dynamic rendering
const STORAGE_KEY = 'portfolio_projects';

const ICONS = {
  github: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
  demo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="12" height="12"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  other: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
};

const LINK_LABELS = {
  github: 'GitHub', demo: 'Live Demo', docs: 'Docs', other: 'Visit'
};

const SIZE_CLASSES = {
  narrow:   'wide4',
  compact:  'wide5',
  standard: '',
  wide:     'wide7',
  full:     'full'
};

const ACCENT_CLASSES = {
  default: '', pink: 'pink-hover', purple: 'purple-hover'
};

const ACCENT_NUM = {
  default: '', pink: 'pk', purple: 'vl'
};

const TAG_COLORS = {
  default: '', pink: 'pk', purple: 'vl', yellow: 'yl'
};

const Projects = {
  _projects: [],

  async load() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this._projects = JSON.parse(stored);
    } else {
      try {
        const res = await fetch('data/projects.json');
        this._projects = await res.json();
      } catch (e) {
        console.warn('Could not load projects.json:', e);
        this._projects = [];
      }
    }
    this._projects.sort((a, b) => a.order - b.order);
    return this._projects;
  },

  getAll() { return [...this._projects]; },

  getById(id) { return this._projects.find(p => p.id === id); },

  add(project) {
    project.id = project.id || 'proj-' + Date.now();
    project.order = this._projects.length + 1;
    this._projects.push(project);
    this._save();
  },

  update(id, updates) {
    const idx = this._projects.findIndex(p => p.id === id);
    if (idx === -1) return;
    this._projects[idx] = { ...this._projects[idx], ...updates };
    this._save();
  },

  remove(id) {
    this._projects = this._projects.filter(p => p.id !== id);
    this._projects.forEach((p, i) => p.order = i + 1);
    this._save();
  },

  move(id, direction) {
    const idx = this._projects.findIndex(p => p.id === id);
    if (idx === -1) return;
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= this._projects.length) return;
    [this._projects[idx], this._projects[swap]] = [this._projects[swap], this._projects[idx]];
    this._projects.forEach((p, i) => p.order = i + 1);
    this._save();
  },

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._projects));
  },

  exportJSON() {
    const blob = new Blob([JSON.stringify(this._projects, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'projects.json';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
  },

  render(adminMode) {
    const grid = document.querySelector('.projects-grid');
    if (!grid) return;
    grid.innerHTML = '';

    this._projects.forEach((p, i) => {
      const num = String(i + 1).padStart(2, '0');
      const sizeClass = SIZE_CLASSES[p.size] || '';
      const accentClass = ACCENT_CLASSES[p.accent] || '';
      const numClass = ACCENT_NUM[p.accent] || '';

      const card = document.createElement('div');
      card.className = ['project-card', 'pc', sizeClass, accentClass, 'reveal']
        .filter(Boolean).join(' ');
      card.dataset.id = p.id;

      let html = '<div class="card-glow"></div>';

      if (adminMode) {
        html += `
          <div class="admin-card-actions">
            <button class="admin-icon-btn" data-action="move-up" data-id="${p.id}" title="Move up">\u2191</button>
            <button class="admin-icon-btn" data-action="move-down" data-id="${p.id}" title="Move down">\u2193</button>
            <button class="admin-icon-btn" data-action="edit" data-id="${p.id}" title="Edit">\u270E</button>
            <button class="admin-icon-btn danger" data-action="delete" data-id="${p.id}" title="Delete">\u00D7</button>
          </div>`;
      }

      const featuredLabel = p.featured ? ' &nbsp;// &nbsp;featured' : '';
      html += `<div class="p-num ${numClass}">${num}${featuredLabel}</div>`;

      if (p.github_meta && p.github_meta.stars > 0) {
        html += `<div class="gh-badge">${ICONS.star} ${p.github_meta.stars.toLocaleString()}</div>`;
      }

      if (p.size === 'full' && !p.featured) {
        html += '<div class="full-inner"><div>';
        html += `<h3 class="p-title${p.featured ? ' big' : ''}">${escHtml(p.title)}</h3>`;
        html += `<p class="p-desc">${escHtml(p.description)}</p>`;
        html += '</div><div>';
        html += buildTags(p.tags);
        html += buildLinks(p.links);
        html += '</div></div>';
      } else {
        html += `<h3 class="p-title${p.featured ? ' big' : ''}">${escHtml(p.title)}</h3>`;
        html += `<p class="p-desc">${escHtml(p.description)}</p>`;
        html += buildTags(p.tags);
        html += buildLinks(p.links);
      }

      card.innerHTML = html;
      grid.appendChild(card);
    });
  }
};

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function buildTags(tags) {
  if (!tags || !tags.length) return '';
  return '<div class="p-tags">' +
    tags.map(t => `<span class="tag ${TAG_COLORS[t.color] || ''}">${escHtml(t.label)}</span>`).join('') +
    '</div>';
}

function buildLinks(links) {
  if (!links) return '';
  let html = '<div class="p-links">';
  for (const [type, url] of Object.entries(links)) {
    if (!url) continue;
    const icon = ICONS[type] || ICONS.other;
    const label = LINK_LABELS[type] || type;
    html += `<a href="${escHtml(url)}" class="p-link" target="_blank" rel="noopener">${icon} ${label}</a>`;
  }
  return html + '</div>';
}

window.Projects = Projects;
