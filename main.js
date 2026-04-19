const modal = document.getElementById('project-modal');
const modalTitle = document.getElementById('modal-title');
const modalImage = document.getElementById('modal-image');
const modalDescription = document.getElementById('modal-description');
const closeButton = document.getElementsByClassName('close-button')[0];
const themePanel = document.getElementById('theme-panel');
const colorPreview = document.getElementById('color-preview');

// =====================
// IndexedDB (이미지/비디오 영구 저장)
// =====================
let db;

const openDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open('service-studio', 1);
  req.onupgradeneeded = e => e.target.result.createObjectStore('media');
  req.onsuccess = e => { db = e.target.result; resolve(); };
  req.onerror = () => reject(req.error);
});

const dbSave = (key, value) => new Promise((resolve, reject) => {
  const tx = db.transaction('media', 'readwrite');
  tx.objectStore('media').put(value, key);
  tx.oncomplete = resolve;
  tx.onerror = () => reject(tx.error);
});

const dbLoad = key => new Promise(resolve => {
  const tx = db.transaction('media', 'readonly');
  const req = tx.objectStore('media').get(key);
  req.onsuccess = () => resolve(req.result || null);
  req.onerror = () => resolve(null);
});

// =====================
// 워크스페이스별 상태
// =====================
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

const workspaceColors = { a: getStoredColor('a'), b: getStoredColor('b') };
const workspaceThemes = { a: getStoredTheme('a'), b: getStoredTheme('b') };

// =====================
// 라이트 / 다크 모드
// =====================
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

// =====================
// 테마 컬러
// =====================
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

// =====================
// 헤더 배경 / 로고 업로드
// =====================
const applyHeroBg = (heroCopy, blob) => {
  const url = URL.createObjectURL(blob);
  heroCopy.style.backgroundImage = `var(--hero-overlay), url(${url})`;
  heroCopy.style.backgroundSize = 'cover';
  heroCopy.style.backgroundPosition = 'center';
};

const applyHeroAvatar = (avatar, blob) => {
  const url = URL.createObjectURL(blob);
  avatar.style.backgroundImage = `url(${url})`;
  avatar.style.backgroundSize = 'cover';
  avatar.style.backgroundPosition = 'center';
  avatar.style.borderStyle = 'solid';
};

document.getElementById('hero-image-input').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const idx = currentColorWorkspace === 'a' ? 0 : 1;
  const heroCopy = document.querySelectorAll('.hero-col')[idx].querySelector('.hero-copy');
  applyHeroBg(heroCopy, file);
  await dbSave(`hero-bg-${currentColorWorkspace}`, file);
  e.target.value = '';
});

document.getElementById('hero-avatar-input').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const idx = currentColorWorkspace === 'a' ? 0 : 1;
  const avatar = document.querySelectorAll('.hero-col')[idx].querySelector('.hero-avatar');
  applyHeroAvatar(avatar, file);
  await dbSave(`hero-avatar-${currentColorWorkspace}`, file);
  e.target.value = '';
});

const restoreHeroImages = async () => {
  const cols = document.querySelectorAll('.hero-col');
  for (const key of ['a', 'b']) {
    const idx = key === 'a' ? 0 : 1;
    const bgBlob = await dbLoad(`hero-bg-${key}`);
    if (bgBlob) applyHeroBg(cols[idx].querySelector('.hero-copy'), bgBlob);
    const avatarBlob = await dbLoad(`hero-avatar-${key}`);
    if (avatarBlob) applyHeroAvatar(cols[idx].querySelector('.hero-avatar'), avatarBlob);
  }
};

// =====================
// 테마 패널 열기/닫기
// =====================
const openThemePanel = (avatar, workspaceKey) => {
  currentColorWorkspace = workspaceKey;
  applyAccentColor(workspaceColors[workspaceKey], false);
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === workspaceThemes[workspaceKey]);
  });
  const rect = avatar.getBoundingClientRect();
  const panelWidth = 228;
  let left = rect.left;
  let top = rect.bottom + 8;
  if (left + panelWidth > window.innerWidth - 16) left = window.innerWidth - panelWidth - 16;
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
  if (!themePanel.hidden && !themePanel.contains(e.target)) themePanel.hidden = true;
});
themePanel.addEventListener('click', e => e.stopPropagation());

['r', 'g', 'b'].forEach(ch => {
  document.getElementById(`slider-${ch}`).addEventListener('input', () => {
    const r = +document.getElementById('slider-r').value;
    const g = +document.getElementById('slider-g').value;
    const b = +document.getElementById('slider-b').value;
    applyAccentColor({ r, g, b });
  });
});

document.getElementById('hex-input').addEventListener('change', e => {
  const val = e.target.value.trim();
  const rgb = hexToRgb(val.startsWith('#') ? val : '#' + val);
  if (rgb) applyAccentColor(rgb);
});

// =====================
// 이미지 업로드 (영구 저장)
// =====================
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

const applyImageToBox = (box, blob) => {
  const url = URL.createObjectURL(blob);
  box.style.backgroundImage = `url(${url})`;
  box.style.backgroundSize = 'cover';
  box.style.backgroundPosition = 'center';
  box.style.borderStyle = 'solid';
};

const initImageUpload = (container, workspaceKey) => {
  container.querySelectorAll(IMAGE_BOX_SELECTORS).forEach((box, i) => {
    if (box.dataset.uploadReady) return;
    box.dataset.uploadReady = '1';
    const mediaKey = `img-${workspaceKey}-${i}`;
    box.style.cursor = 'pointer';
    box.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;
        await dbSave(mediaKey, file);
        applyImageToBox(box, file);
      });
      input.click();
    });
  });
};

const restoreImages = async (container, workspaceKey) => {
  const boxes = [...container.querySelectorAll(IMAGE_BOX_SELECTORS)];
  for (let i = 0; i < boxes.length; i++) {
    const blob = await dbLoad(`img-${workspaceKey}-${i}`);
    if (blob) applyImageToBox(boxes[i], blob);
  }
};

// =====================
// 비디오 업로드 (영구 저장)
// =====================
const applyVideoToPlayer = (player, placeholder, blob) => {
  player.src = URL.createObjectURL(blob);
  player.hidden = false;
  if (placeholder) placeholder.hidden = true;
};

const initVideoUpload = (container, workspaceKey) => {
  container.querySelectorAll('.video-input').forEach(input => {
    if (input.dataset.videoReady) return;
    input.dataset.videoReady = '1';
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      const box = input.closest('.video-upload-box');
      const player = box.querySelector('.video-player');
      const placeholder = box.querySelector('.video-placeholder');
      await dbSave(`video-${workspaceKey}`, file);
      applyVideoToPlayer(player, placeholder, file);
    });
  });
};

const restoreVideo = async (container, workspaceKey) => {
  const blob = await dbLoad(`video-${workspaceKey}`);
  if (!blob) return;
  const player = container.querySelector('.video-player');
  const placeholder = container.querySelector('.video-placeholder');
  if (player) applyVideoToPlayer(player, placeholder, blob);
};

// =====================
// 텍스트 편집 (localStorage 저장)
// =====================
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

const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const initTextEdit = (container, workspaceKey) => {
  container.querySelectorAll(TEXT_SELECTORS).forEach((el, i) => {
    if (el.dataset.editReady) return;
    el.dataset.editReady = '1';
    el.contentEditable = 'true';
    el.spellcheck = false;
    const textKey = `text-${workspaceKey}-${i}`;
    el.addEventListener('input', debounce(() => {
      localStorage.setItem(textKey, el.innerHTML);
    }, 400));
  });
};

const restoreText = (container, workspaceKey) => {
  container.querySelectorAll(TEXT_SELECTORS).forEach((el, i) => {
    const saved = localStorage.getItem(`text-${workspaceKey}-${i}`);
    if (saved) el.innerHTML = saved;
  });
};

// =====================
// 탭 전환
// =====================
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
        const video = panel.querySelector('.video-player');
        if (video && !video.hidden) { video.currentTime = 0; video.play(); }
        if (tabName === 'gui-scenario') resetSubTab(container);
      } else {
        panel.classList.remove('active');
        panel.style.display = 'none';
        const video = panel.querySelector('.video-player');
        if (video) video.pause();
      }
    });
  };

  buttons.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));
};

// =====================
// 서브 탭 (Deliver 내부)
// =====================
const initSubTabs = container => {
  const guiPanel = container.querySelector('.tab-panel[data-panel="gui-scenario"]');
  if (!guiPanel) return;
  const buttons = guiPanel.querySelectorAll('.sub-tab-button');
  const panels = guiPanel.querySelectorAll('.sub-tab-panel');

  const setActiveSubTab = name => {
    buttons.forEach(btn => {
      const isActive = btn.dataset.subtab === name;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    panels.forEach(panel => {
      const isActive = panel.dataset.subpanel === name;
      if (isActive) {
        panel.style.display = 'block';
        requestAnimationFrame(() => panel.classList.add('active'));
      } else {
        panel.classList.remove('active');
        panel.style.display = 'none';
      }
    });
  };

  buttons.forEach(btn => btn.addEventListener('click', () => setActiveSubTab(btn.dataset.subtab)));
};

const initSubTabDelete = (container, workspaceKey) => {
  const guiPanel = container.querySelector('.tab-panel[data-panel="gui-scenario"]');
  if (!guiPanel) return;
  const guiBtn = guiPanel.querySelector('.sub-tab-button[data-subtab="gui"]');
  const deviceBtn = guiPanel.querySelector('.sub-tab-button[data-subtab="device"]');
  const devicePanel = guiPanel.querySelector('.sub-tab-panel[data-subpanel="device"]');
  const navInner = guiPanel.querySelector('.sub-tab-nav-inner');
  const deleteBtn = guiPanel.querySelector('.sub-tab-delete');
  const restoreBtn = guiPanel.querySelector('.sub-tab-restore');
  if (!deviceBtn || !deleteBtn || !restoreBtn) return;

  const hideDevice = () => {
    if (deviceBtn.classList.contains('active')) {
      guiBtn.click();
    }
    deviceBtn.hidden = true;
    if (devicePanel) devicePanel.hidden = true;
    if (navInner) navInner.style.gridTemplateColumns = '1fr';
    restoreBtn.classList.add('visible');
    localStorage.setItem(`sub-tab-device-hidden-${workspaceKey}`, '1');
  };

  const showDevice = () => {
    deviceBtn.hidden = false;
    if (devicePanel) devicePanel.hidden = false;
    if (navInner) navInner.style.gridTemplateColumns = '';
    restoreBtn.classList.remove('visible');
    localStorage.removeItem(`sub-tab-device-hidden-${workspaceKey}`);
  };

  if (localStorage.getItem(`sub-tab-device-hidden-${workspaceKey}`) === '1') {
    deviceBtn.hidden = true;
    if (devicePanel) devicePanel.hidden = true;
    if (navInner) navInner.style.gridTemplateColumns = '1fr';
    restoreBtn.classList.add('visible');
  }

  deleteBtn.addEventListener('click', e => {
    e.stopPropagation();
    hideDevice();
  });

  restoreBtn.addEventListener('click', e => {
    e.stopPropagation();
    showDevice();
  });
};

const resetSubTab = container => {
  const firstSubBtn = container.querySelector('.tab-panel[data-panel="gui-scenario"] .sub-tab-button');
  if (firstSubBtn) firstSubBtn.click();
};

// =====================
// 탭 자동 전환
// =====================
const TAB_ORDER = ['research', 'empathize', 'design', 'gui-scenario'];
let autoAdvanceTimer = null;

const startAutoAdvance = container => {
  stopAutoAdvance();
  autoAdvanceTimer = setInterval(() => {
    const activeBtn = container.querySelector('.tab-button.active');
    if (!activeBtn) return;
    const currentIdx = TAB_ORDER.indexOf(activeBtn.dataset.tab);
    const isLast = currentIdx === TAB_ORDER.length - 1;
    if (isLast) {
      // 서브탭 확인 (gui-scenario 내부)
      const activeSubBtn = container.querySelector('.tab-panel[data-panel="gui-scenario"] .sub-tab-button.active');
      const subBtns = [...(container.querySelectorAll('.tab-panel[data-panel="gui-scenario"] .sub-tab-button') || [])];
      const subIdx = activeSubBtn ? subBtns.indexOf(activeSubBtn) : -1;
      if (subIdx >= 0 && subIdx < subBtns.length - 1) {
        const visibleNext = subBtns.slice(subIdx + 1).filter(b => !b.hidden);
        if (visibleNext.length > 0) { visibleNext[0].click(); return; }
      }
      // 서브탭 마지막이면 워크스페이스 전환
      const heroCols = document.querySelectorAll('.hero-col');
      const activeColIdx = [...heroCols].findIndex(c => c.classList.contains('active'));
      const nextColIdx = (activeColIdx + 1) % heroCols.length;
      heroCols[nextColIdx].click();
      const nextKey = nextColIdx === 0 ? 'a' : 'b';
      const nextContainer = document.querySelector(`.workspace[data-workspace="${nextKey}"]`);
      const firstBtn = nextContainer?.querySelector(`.tab-button[data-tab="${TAB_ORDER[0]}"]`);
      if (firstBtn) firstBtn.click();
    } else {
      const nextBtn = container.querySelector(`.tab-button[data-tab="${TAB_ORDER[currentIdx + 1]}"]`);
      if (nextBtn) nextBtn.click();
    }
  }, 60000);
};

const stopAutoAdvance = () => {
  if (autoAdvanceTimer) { clearInterval(autoAdvanceTimer); autoAdvanceTimer = null; }
};

// =====================
// 워크스페이스 전환
// =====================
const workspaces = document.querySelectorAll('.workspace');
let workspaceBReady = false;
const workspaceATemplate = document.querySelector('.workspace[data-workspace="a"]').innerHTML;

const switchWorkspace = async key => {
  workspaces.forEach(ws => ws.classList.toggle('active', ws.dataset.workspace === key));
  currentColorWorkspace = key;
  applyAccentColor(workspaceColors[key], false);
  applyTheme(workspaceThemes[key], key, false);
  startAutoAdvance(document.querySelector(`.workspace[data-workspace="${key}"]`));

  if (key === 'b' && !workspaceBReady) {
    const dest = document.querySelector('.workspace[data-workspace="b"]');
    dest.innerHTML = workspaceATemplate;
    initTabs(dest);
    initSubTabs(dest);
    initSubTabDelete(dest, 'b');
    initImageUpload(dest, 'b');
    initVideoUpload(dest, 'b');
    initTextEdit(dest, 'b');
    await restoreImages(dest, 'b');
    await restoreVideo(dest, 'b');
    restoreText(dest, 'b');
    workspaceBReady = true;
  }
};

// =====================
// 헤더 탭 클릭
// =====================
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

// =====================
// 모달
// =====================
if (closeButton) {
  closeButton.addEventListener('click', () => { modal.style.display = 'none'; });
}
window.addEventListener('click', e => {
  if (e.target === modal) modal.style.display = 'none';
});

// =====================
// 초기화
// =====================
(async () => {
  await openDB();

  applyTheme(workspaceThemes['a'], 'a', false);
  applyAccentColor(workspaceColors['a'], false);

  const workspaceA = document.querySelector('.workspace[data-workspace="a"]');
  initTabs(workspaceA);
  initSubTabs(workspaceA);
  initSubTabDelete(workspaceA, 'a');
  initImageUpload(workspaceA, 'a');
  initVideoUpload(workspaceA, 'a');
  initTextEdit(workspaceA, 'a');
  initTextEdit(document.querySelector('header'), 'header');

  await restoreImages(workspaceA, 'a');
  await restoreVideo(workspaceA, 'a');
  restoreText(workspaceA, 'a');
  restoreText(document.querySelector('header'), 'header');
  await restoreHeroImages();

  startAutoAdvance(workspaceA);
})();
