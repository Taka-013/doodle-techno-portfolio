// Admin panel: add/edit/delete projects, GitHub import, export
const Admin = {
  _active: false,
  _editingId: null,
  _ghPreviewData: null,

  init() {
    this._createDOM();
    this._bindEvents();
    if (new URLSearchParams(window.location.search).has('admin')) {
      this.toggle();
    }
  },

  toggle() {
    this._active = !this._active;
    document.body.classList.toggle('admin-mode', this._active);
    Projects.render(this._active);
    Effects.observeReveals();
    Effects.refreshHovers();
    this._toast(this._active ? 'Admin mode ON \u2014 Ctrl+Shift+A to exit' : 'Admin mode OFF');
  },

  _createDOM() {
    // Admin floating bar
    const bar = document.createElement('div');
    bar.className = 'admin-bar';
    bar.innerHTML = `
      <button class="admin-btn" id="btn-open-gh">+ GitHub Repo</button>
      <button class="admin-btn pink" id="btn-open-manual">+ Add Project</button>
      <button class="admin-btn outline" id="btn-export">Export JSON</button>
      <button class="admin-btn outline" id="btn-reset">Reset Default</button>
    `;
    document.body.appendChild(bar);

    // Modal
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.id = 'admin-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">\u00D7</button>
        <div class="modal-tabs">
          <button class="modal-tab active" data-tab="github">Import GitHub</button>
          <button class="modal-tab" data-tab="manual">Add Manually</button>
        </div>
        <div class="modal-body">

          <div class="tab-panel active" id="tab-github">
            <div class="admin-field">
              <label>GitHub Repository</label>
              <div style="display:flex;gap:0.5rem">
                <input type="text" id="gh-url" placeholder="owner/repo or full URL" style="flex:1">
                <button class="admin-btn" id="btn-fetch-gh">Fetch</button>
              </div>
            </div>
            <div id="gh-loading" class="gh-status" style="display:none">Fetching repo data\u2026</div>
            <div id="gh-error" class="field-error" style="display:none"></div>
            <div id="gh-preview" style="display:none">
              <div class="gh-preview-card">
                <h4 id="gh-p-title"></h4>
                <p id="gh-p-desc"></p>
                <div class="gh-preview-meta">
                  <span id="gh-p-stars"></span>
                  <span id="gh-p-forks"></span>
                  <span id="gh-p-lang"></span>
                </div>
                <div id="gh-p-topics" class="p-tags" style="margin-top:0.6rem"></div>
              </div>
              <div style="display:flex;gap:1rem">
                <div class="admin-field" style="flex:1">
                  <label>Card Size</label>
                  <select id="gh-size">
                    <option value="narrow">Narrow (4)</option>
                    <option value="compact">Compact (5)</option>
                    <option value="standard" selected>Standard (6)</option>
                    <option value="wide">Wide (7)</option>
                    <option value="full">Full Width</option>
                  </select>
                </div>
                <div class="admin-field" style="flex:1">
                  <label>Accent</label>
                  <select id="gh-accent">
                    <option value="default">Cyan</option>
                    <option value="pink">Pink</option>
                    <option value="purple">Purple</option>
                  </select>
                </div>
              </div>
              <button class="admin-btn" id="btn-add-gh" style="width:100%;margin-top:0.5rem">Add to Portfolio</button>
            </div>
          </div>

          <div class="tab-panel" id="tab-manual">
            <div class="admin-field">
              <label>Project Title *</label>
              <input type="text" id="man-title" placeholder="My Awesome Project">
            </div>
            <div class="admin-field">
              <label>Description *</label>
              <textarea id="man-desc" rows="3" placeholder="Brief description\u2026"></textarea>
            </div>
            <div class="admin-field">
              <label>Tags <span style="opacity:0.5">(comma-separated)</span></label>
              <input type="text" id="man-tags" placeholder="React, TypeScript, Redis">
            </div>
            <div class="admin-field">
              <label>GitHub URL</label>
              <input type="text" id="man-github" placeholder="https://github.com/\u2026">
            </div>
            <div class="admin-field">
              <label>Live Demo URL</label>
              <input type="text" id="man-demo" placeholder="https://\u2026">
            </div>
            <div class="admin-field">
              <label>Docs URL</label>
              <input type="text" id="man-docs" placeholder="https://\u2026">
            </div>
            <div style="display:flex;gap:1rem">
              <div class="admin-field" style="flex:1">
                <label>Card Size</label>
                <select id="man-size">
                  <option value="narrow">Narrow (4)</option>
                  <option value="compact">Compact (5)</option>
                  <option value="standard" selected>Standard (6)</option>
                  <option value="wide">Wide (7)</option>
                  <option value="full">Full Width</option>
                </select>
              </div>
              <div class="admin-field" style="flex:1">
                <label>Accent</label>
                <select id="man-accent">
                  <option value="default">Cyan</option>
                  <option value="pink">Pink</option>
                  <option value="purple">Purple</option>
                </select>
              </div>
            </div>
            <div class="admin-field">
              <label><input type="checkbox" id="man-featured"> Featured Project</label>
            </div>
            <button class="admin-btn" id="btn-submit-manual" style="width:100%;margin-top:0.5rem">Add Project</button>
          </div>

        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Toast container
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'toast';
    document.body.appendChild(toast);
  },

  _bindEvents() {
    // Keyboard shortcut
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape') this._closeModal();
    });

    // Admin bar
    document.getElementById('btn-open-gh').addEventListener('click', () => this._openModal('github'));
    document.getElementById('btn-open-manual').addEventListener('click', () => {
      this._editingId = null;
      this._clearManualForm();
      document.getElementById('btn-submit-manual').textContent = 'Add Project';
      this._openModal('manual');
    });
    document.getElementById('btn-export').addEventListener('click', () => {
      Projects.exportJSON();
      this._toast('Projects exported as JSON');
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (!confirm('Reset to default projects? Your changes will be lost.')) return;
      Projects.resetToDefault();
      location.reload();
    });

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', () => this._closeModal());
    document.getElementById('admin-modal').addEventListener('click', e => {
      if (e.target.id === 'admin-modal') this._closeModal();
    });

    // Tabs
    document.querySelectorAll('.modal-tab').forEach(tab => {
      tab.addEventListener('click', () => this._switchTab(tab.dataset.tab));
    });

    // GitHub fetch
    document.getElementById('btn-fetch-gh').addEventListener('click', () => this._fetchGitHub());
    document.getElementById('gh-url').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._fetchGitHub();
    });

    // Add from GitHub
    document.getElementById('btn-add-gh').addEventListener('click', () => this._addFromGitHub());

    // Manual submit
    document.getElementById('btn-submit-manual').addEventListener('click', () => this._submitManual());

    // Card actions (delegated)
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'edit') this._editProject(id);
      else if (action === 'delete') this._deleteProject(id);
      else if (action === 'move-up') { Projects.move(id, 'up'); this._refresh(); }
      else if (action === 'move-down') { Projects.move(id, 'down'); this._refresh(); }
    });
  },

  _openModal(tab) {
    this._switchTab(tab);
    document.getElementById('admin-modal').classList.add('open');
  },

  _closeModal() {
    document.getElementById('admin-modal').classList.remove('open');
    this._editingId = null;
  },

  _switchTab(tab) {
    document.querySelectorAll('.modal-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p =>
      p.classList.toggle('active', p.id === 'tab-' + tab));
  },

  async _fetchGitHub() {
    const input = document.getElementById('gh-url').value;
    const parsed = GitHub.parseRepoInput(input);
    if (!parsed) {
      this._showGhError('Enter a valid GitHub repo URL or owner/repo');
      return;
    }

    document.getElementById('gh-loading').style.display = 'block';
    document.getElementById('gh-preview').style.display = 'none';
    document.getElementById('gh-error').style.display = 'none';

    try {
      const data = await GitHub.fetchRepo(parsed.owner, parsed.repo);
      this._ghPreviewData = GitHub.repoToProject(data);

      document.getElementById('gh-p-title').textContent = this._ghPreviewData.title;
      document.getElementById('gh-p-desc').textContent = this._ghPreviewData.description;
      document.getElementById('gh-p-stars').innerHTML =
        `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> ${data.stargazers_count}`;
      document.getElementById('gh-p-forks').textContent = data.forks_count + ' forks';
      document.getElementById('gh-p-lang').textContent = data.language || 'Unknown';

      const topicsEl = document.getElementById('gh-p-topics');
      topicsEl.innerHTML = this._ghPreviewData.tags
        .map(t => `<span class="tag">${t.label}</span>`).join('');

      document.getElementById('gh-loading').style.display = 'none';
      document.getElementById('gh-preview').style.display = 'block';
    } catch (err) {
      document.getElementById('gh-loading').style.display = 'none';
      this._showGhError(err.message);
    }
  },

  _showGhError(msg) {
    const el = document.getElementById('gh-error');
    el.textContent = msg;
    el.style.display = 'block';
  },

  _addFromGitHub() {
    if (!this._ghPreviewData) return;
    this._ghPreviewData.size = document.getElementById('gh-size').value;
    this._ghPreviewData.accent = document.getElementById('gh-accent').value;
    Projects.add(this._ghPreviewData);
    this._ghPreviewData = null;
    this._closeModal();
    this._refresh();
    this._toast('Project imported from GitHub');
  },

  _submitManual() {
    const title = document.getElementById('man-title').value.trim();
    const desc = document.getElementById('man-desc').value.trim();
    if (!title || !desc) {
      this._toast('Title and description are required');
      return;
    }

    const tagsRaw = document.getElementById('man-tags').value;
    const colors = ['default', 'pink', 'purple', 'yellow'];
    const tags = tagsRaw.split(',').map(s => s.trim()).filter(Boolean)
      .map((label, i) => ({ label, color: colors[i % colors.length] }));

    const links = {};
    const gh = document.getElementById('man-github').value.trim();
    const demo = document.getElementById('man-demo').value.trim();
    const docs = document.getElementById('man-docs').value.trim();
    if (gh) links.github = gh;
    if (demo) links.demo = demo;
    if (docs) links.docs = docs;

    const project = {
      title,
      description: desc,
      tags,
      links,
      size: document.getElementById('man-size').value,
      accent: document.getElementById('man-accent').value,
      featured: document.getElementById('man-featured').checked,
      source: 'manual'
    };

    if (this._editingId) {
      Projects.update(this._editingId, project);
      this._toast('Project updated');
    } else {
      Projects.add(project);
      this._toast('Project added');
    }

    this._editingId = null;
    this._closeModal();
    this._refresh();
  },

  _editProject(id) {
    const p = Projects.getById(id);
    if (!p) return;
    this._editingId = id;

    document.getElementById('man-title').value = p.title;
    document.getElementById('man-desc').value = p.description;
    document.getElementById('man-tags').value = (p.tags || []).map(t => t.label).join(', ');
    document.getElementById('man-github').value = (p.links && p.links.github) || '';
    document.getElementById('man-demo').value = (p.links && p.links.demo) || '';
    document.getElementById('man-docs').value = (p.links && p.links.docs) || '';
    document.getElementById('man-size').value = p.size || 'standard';
    document.getElementById('man-accent').value = p.accent || 'default';
    document.getElementById('man-featured').checked = !!p.featured;

    document.getElementById('btn-submit-manual').textContent = 'Save Changes';
    this._openModal('manual');
  },

  _deleteProject(id) {
    const p = Projects.getById(id);
    if (!p) return;
    if (!confirm(`Delete "${p.title}"?`)) return;
    Projects.remove(id);
    this._refresh();
    this._toast('Project deleted');
  },

  _clearManualForm() {
    document.getElementById('man-title').value = '';
    document.getElementById('man-desc').value = '';
    document.getElementById('man-tags').value = '';
    document.getElementById('man-github').value = '';
    document.getElementById('man-demo').value = '';
    document.getElementById('man-docs').value = '';
    document.getElementById('man-size').value = 'standard';
    document.getElementById('man-accent').value = 'default';
    document.getElementById('man-featured').checked = false;

    document.getElementById('gh-url').value = '';
    document.getElementById('gh-preview').style.display = 'none';
    document.getElementById('gh-error').style.display = 'none';
    document.getElementById('gh-loading').style.display = 'none';
    this._ghPreviewData = null;
  },

  _refresh() {
    Projects.render(this._active);
    Effects.observeReveals();
    Effects.refreshHovers();
  },

  _toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
  }
};

window.Admin = Admin;
