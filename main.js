const projects = [
  {
    title: 'Project 1',
    imageUrl: 'https://via.placeholder.com/300',
    description: 'This is a description of project 1.'
  },
  {
    title: 'Project 2',
    imageUrl: 'https://via.placeholder.com/300',
    description: 'This is a description of project 2.'
  },
  {
    title: 'Project 3',
    imageUrl: 'https://via.placeholder.com/300',
    description: 'This is a description of project 3.'
  },
  {
    title: 'Project 4',
    imageUrl: 'https://via.placeholder.com/300',
    description: 'This is a description of project 4.'
  },
  {
    title: 'Project 5',
    imageUrl: 'https://via.placeholder.com/300',
    description: 'This is a description of project 5.'
  },
  {
    title: 'Project 6',
    imageUrl: 'https://via.placeholder.com/300',
    description: 'This is a description of project 6.'
  }
];

const projectGallery = document.getElementById('project-gallery');
const modal = document.getElementById('project-modal');
const modalTitle = document.getElementById('modal-title');
const modalImage = document.getElementById('modal-image');
const modalDescription = document.getElementById('modal-description');
const closeButton = document.getElementsByClassName('close-button')[0];
const themeToggle = document.getElementById('theme-toggle');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const themeStorageKey = 'service-design-theme';

const getPreferredTheme = () => {
  const storedTheme = localStorage.getItem(themeStorageKey);

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const updateThemeToggleLabel = theme => {
  themeToggle.textContent = theme === 'dark' ? 'White Mode' : 'Dark Mode';
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
};

const applyTheme = theme => {
  document.body.dataset.theme = theme;
  localStorage.setItem(themeStorageKey, theme);
  updateThemeToggleLabel(theme);
};

applyTheme(getPreferredTheme());

themeToggle.addEventListener('click', () => {
  const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
});

const setActiveTab = tabName => {
  tabButtons.forEach(button => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === tabName);
  });
};

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    setActiveTab(button.dataset.tab);
  });
});

closeButton.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', event => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

if (projectGallery) {
  projects.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.classList.add('project-card');

    const projectImage = document.createElement('img');
    projectImage.src = project.imageUrl;
    projectImage.alt = project.title;

    const projectTitle = document.createElement('h3');
    projectTitle.textContent = project.title;

    projectCard.appendChild(projectImage);
    projectCard.appendChild(projectTitle);

    projectCard.addEventListener('click', () => {
      modalTitle.textContent = project.title;
      modalImage.src = project.imageUrl;
      modalImage.alt = project.title;
      modalDescription.textContent = project.description;
      modal.style.display = 'block';
    });

    projectGallery.appendChild(projectCard);
  });
}
