const modal = document.getElementById('project-modal');
const modalTitle = document.getElementById('modal-title');
const modalImage = document.getElementById('modal-image');
const modalDescription = document.getElementById('modal-description');
const closeButton = document.getElementsByClassName('close-button')[0];
const themePanel = document.getElementById('theme-panel');
const colorPreview = document.getElementById('color-preview');

// --- Per-workspace state ---

let currentColorWorkspace = 'a';

const defaultColors = {
  a: { r: 164, g: 79, b: 47 },
  b: { r: 79, g: 120, b: 164 },
};

const getStoredColor = key => {
  try {
    const s = JSON.parse(localStorage.getItem(`service-design-accent-${key}`));
    if (s && 'r' in s) return s;
  } catch {}
  return defaultColors[key];
};

const getStoredTheme = key => {
  const stored = localStorage.getItem(`service-design-theme-${key}`);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const workspaceColors = {
  a: getStoredColor('a'),
  b: getStoredColor('b'),
};

const workspaceThemes = {
  a: getStoredTheme('a'),
  b: getStoredTheme('b'),
};

// --- Light / Dark mode ---

const applyTheme = (theme, key, save = true) => {
  document.body.dataset.theme = theme;
  if (save) {
    localStorage.setItem(`service-design-theme-${key}`, theme);
    workspaceThemes[key] = theme;
  }
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === theme);
  });
};

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => applyTheme(btn.dataset.mode, currentColorWorkspace));
});

// --- Accent color ---

const hexToRgb = hex => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
};

const rgbToHex = (r, g, b) =>
  '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

const updateSliderTracks = (r, g, b) => {
  document.getElementById('slider-r').style.background =
    `linear-gradient(to right, rgb(0,${g},${b}), rgb(255,${g},${b}))`;
  document.getElementById('slider-g').style.background =
    `linear-gradient(to right, rgb(${r},0,${b}), rgb(${r},255,${b}))`;
  document.getElementById('slider-b').style.background =
    `linear-gradient(to right, rgb(${r},${g},0), rgb(${r},${g},255))`;
};

const applyAccentColor = ({ r, g, b }, save = true) => {
  const hex = rgbToHex(r, g, b);
  for (const el of [document.documentElement, document.body]) {
    el.style.setProperty('--accent', hex);
    el.style.setProperty('--accent-r', r);
    el.style.setProperty('--accent-g', g);
    el.style.setProperty('--accent-b', b);
  }

  document.getElementById('slider-r').value = r;
  document.getElementById('slider-g').value = g;
  document.getElementById('slider-b').value = b;
  document.getElementById('val-r').textContent = r;
  document.getElementById('val-g').textContent = g;
  document.getElementById('val-b').textContent = b;
  document.getElementById('hex-input').value = hex;
  colorPreview.style.background = hex;
  updateSliderTracks(r, g, b);

  if (save) {
    workspaceColors[currentColorWorkspace] = { r, g, b };
    localStorage.setItem(`service-design-accent-${currentColorWorkspace}`, JSON.stringify({ r, g, b }));
  }
};

// --- Hero image upload ---

document.getElementById('hero-image-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const idx = currentColorWorkspace === 'a' ? 0 : 1;
  const heroCopy = document.querySelectorAll('.hero-col')[idx].querySelector('.hero-copy');
  heroCopy.style.backgroundImage = `var(--hero-overlay), url(${url})`;
  heroCopy.style.backgroundSize = 'cover';
  heroCopy.style.backgroundPosition = 'center';
  e.target.value = '';
});

document.getElementById('hero-avatar-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const idx = currentColorWorkspace === 'a' ? 0 : 1;
  const avatar = document.querySelectorAll('.hero-col')[idx].querySelector('.hero-avatar');
  avatar.style.backgroundImage = `url(${url})`;
  avatar.style.backgroundSize = 'cover';
  avatar.style.backgroundPosition = 'center';
  avatar.style.borderStyle = 'solid';
  e.target.value = '';
});

// --- Theme panel open / close via avatar click ---

const openThemePanel = (avatar, workspaceKey) => {
  currentColorWorkspace = workspaceKey;
  // Load this workspace's color and theme into the panel
  applyAccentColor(workspaceColors[workspaceKey], false);
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === workspaceThemes[workspaceKey]);
  });

  // Position panel near the avatar
  const rect = avatar.getBoundingClientRect();
  const panelWidth = 228;
  let left = rect.left;
  let top = rect.bottom + 8;

  // Keep panel within viewport
  if (left + panelWidth > window.innerWidth - 16) {
    left = window.innerWidth - panelWidth - 16;
  }

  themePanel.style.left = `${left}px`;
  themePanel.style.top = `${top}px`;
  themePanel.hidden = false;
};

document.querySelectorAll('.hero-avatar').forEach((avatar, i) => {
  avatar.addEventListener('click', e => {
    e.stopPropagation();
    const key = i === 0 ? 'a' : 'b';
    if (!themePanel.hidden && currentColorWorkspace === key) {
      themePanel.hidden = true;
    } else {
      openThemePanel(avatar, key);
    }
  });
});

document.addEventListener('click', e => {
  if (!themePanel.hidden && !themePanel.contains(e.target)) {
    themePanel.hidden = true;
  }
});

themePanel.addEventListener('click', e => e.stopPropagation());

// --- RGB sliders ---

['r', 'g', 'b'].forEach(ch => {
  document.getElementById(`slider-${ch}`).addEventListener('input', () => {
    const r = +document.getElementById('slider-r').value;
    const g = +document.getElementById('slider-g').value;
    const b = +document.getElementById('slider-b').value;
    applyAccentColor({ r, g, b });
  });
});

// --- Hex input ---

document.getElementById('hex-input').addEventListener('change', e => {
  const val = e.target.value.trim();
  const rgb = hexToRgb(val.startsWith('#') ? val : '#' + val);
  if (rgb) applyAccentColor(rgb);
});

// --- Text editing ---

const TEXT_SELECTORS = [
  '.hero-copy h1',
  '.hero-copy p',
  '.section-title',
  '.info-card p',
  '.keyword-card h3',
  '.keyword-copy h4',
  '.keyword-card p',
  '.persona-card h3',
  '.persona-meta p',
  '.persona-quote blockquote',
  '.persona-notes p',
  '.interview-copy p',
  '.interview-name',
  '.interview-gallery-card span',
].join(', ');

const initTextEdit = container => {
  container.querySelectorAll(TEXT_SELECTORS).forEach(el => {
    if (el.dataset.editReady) return;
    el.dataset.editReady = '1';
    el.contentEditable = 'true';
    el.spellcheck = false;
  });
};

// --- Image upload (all placeholder boxes) ---

const IMAGE_BOX_SELECTORS = [
  '.branding-card',
  '.keyword-image',
  '.persona-image',
  '.interview-image',
  '.interview-gallery-card',
  '.journey-map-card',
  '.architecture-map-card',
  '.blueprint-map-card',
  '.gui-stage-card',
].join(', ');

const initImageUpload = container => {
  container.querySelectorAll(IMAGE_BOX_SELECTORS).forEach(box => {
    if (box.dataset.uploadReady) return;
    box.dataset.uploadReady = '1';
    box.style.cursor = 'pointer';
    box.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        box.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
        box.style.backgroundSize = 'cover';
        box.style.backgroundPosition = 'center';
        box.style.borderStyle = 'solid';
      });
      input.click();
    });
  });
};

// --- Video upload ---

document.querySelectorAll('.video-input').forEach(input => {
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const box = input.closest('.video-upload-box');
    const player = box.querySelector('.video-player');
    const placeholder = box.querySelector('.video-placeholder');
    player.src = URL.createObjectURL(file);
    player.hidden = false;
    placeholder.hidden = true;
  });
});

// --- Tab switching (scoped per workspace) ---

const initTabs = container => {
  const buttons = container.querySelectorAll('.tab-button');
  const panels = container.querySelectorAll('.tab-panel');

  const setActiveTab = tabName => {
    buttons.forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    panels.forEach(panel => {
      const isActive = panel.dataset.panel === tabName;
      if (isActive) {
        panel.style.display = 'block';
        requestAnimationFrame(() => panel.classList.add('active'));
      } else {
        panel.classList.remove('active');
        panel.style.display = 'none';
      }
    });
  };

  buttons.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));
};

// --- Workspace switching ---

const workspaces = document.querySelectorAll('.workspace');
let workspaceBReady = false;

const switchWorkspace = key => {
  workspaces.forEach(ws => ws.classList.toggle('active', ws.dataset.workspace === key));
  // Apply this workspace's accent color and theme
  currentColorWorkspace = key;
  applyAccentColor(workspaceColors[key], false);
  applyTheme(workspaceThemes[key], key, false);

  if (key === 'b' && !workspaceBReady) {
    const src = document.querySelector('.workspace[data-workspace="a"]');
    const dest = document.querySelector('.workspace[data-workspace="b"]');
    dest.innerHTML = src.innerHTML;
    initTabs(dest);
    initImageUpload(dest);
    initTextEdit(dest);
    workspaceBReady = true;
  }
};

// --- Hero col toggle ---

document.querySelectorAll('.hero-col').forEach((col, i, cols) => {
  col.addEventListener('click', e => {
    if (e.target.closest('.hero-avatar')) return;
    if (e.target.isContentEditable) return;

    cols.forEach(c => c.classList.remove('active'));
    col.classList.add('active');
    const key = i === 0 ? 'a' : 'b';
    col.closest('.header-inner').classList.toggle('flipped', i === 1);
    switchWorkspace(key);
  });
});

// --- Modal ---

if (closeButton) {
  closeButton.addEventListener('click', () => { modal.style.display = 'none'; });
}

window.addEventListener('click', e => {
  if (e.target === modal) modal.style.display = 'none';
});

// --- Init ---

applyTheme(workspaceThemes['a'], 'a', false);
applyAccentColor(workspaceColors['a'], false);
initTabs(document.querySelector('.workspace[data-workspace="a"]'));
initImageUpload(document.querySelector('.workspace[data-workspace="a"]'));
initTextEdit(document.querySelector('.workspace[data-workspace="a"]'));
initTextEdit(document.querySelector('header'));
