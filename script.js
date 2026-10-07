const cards = [...document.querySelectorAll('.article-card')];
const filters = [...document.querySelectorAll('.filter')];
const search = document.querySelector('#article-search');
const searchToggle = document.querySelector('.search-toggle');
const searchPanel = document.querySelector('#search-panel');
const empty = document.querySelector('#empty-state');
const categoryMenu = document.querySelector('.category-menu');
const categorySummary = categoryMenu?.querySelector('summary');
let activeFilter = 'all';

// Ignore accents, casing, and excess whitespace in Polish search terms.
function normalizeSearch(value = '') {
  return value.toLocaleLowerCase('pl-PL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, ' ')
    .trim();
}

function hideEmptyCategories() {
  const used = new Set(cards.map(card => card.dataset.category).filter(Boolean));
  filters.forEach(button => {
    button.hidden = button.dataset.filter !== 'all' && !used.has(button.dataset.filter);
  });
}

// Search the visible title, description and category as well as keywords.
const searchIndex = new Map(cards.map(card => [
  card,
  normalizeSearch([
    card.dataset.search || '',
    card.querySelector('h3')?.textContent || '',
    card.querySelector('.card-copy p')?.textContent || '',
    card.querySelector('.pill')?.textContent || ''
  ].join(' '))
]));

function updateArticles() {
  const terms = normalizeSearch(search?.value || '').split(' ').filter(Boolean);
  let visible = 0;
  let firstVisible = null;

  cards.forEach(card => {
    const categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
    const haystack = searchIndex.get(card) || '';
    const searchMatch = terms.every(term => haystack.includes(term));
    const show = categoryMatch && searchMatch;

    // Both the hidden attribute and inline display are used deliberately:
    // an article card has display:flex and must never override filtering.
    card.hidden = !show;
    card.style.display = show ? '' : 'none';
    card.classList.remove('primary');
    if (show) {
      visible++;
      firstVisible ||= card;
    }
  });

  firstVisible?.classList.add('primary');
  if (empty) {
    empty.hidden = visible !== 0;
    empty.textContent = 'Nie znaleziono artykułów.';
  }
}

filters.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filters.forEach(filter => {
    const selected = filter === button;
    filter.classList.toggle('active', selected);
    filter.setAttribute('aria-pressed', String(selected));
  });
  if (categorySummary) categorySummary.textContent = activeFilter === 'all' ? 'Kategorie' : button.textContent.trim();
  updateArticles();
  if (categoryMenu) categoryMenu.open = false;
}));

search?.addEventListener('input', updateArticles);
search?.addEventListener('search', updateArticles);

searchToggle?.addEventListener('click', () => {
  const opening = Boolean(searchPanel?.hidden);
  if (searchPanel) searchPanel.hidden = !opening;
  searchToggle.setAttribute('aria-expanded', String(opening));
  if (opening) search?.focus();
  else if (search) {
    search.value = '';
    updateArticles();
  }
});

hideEmptyCategories();
updateArticles();

const progress=document.querySelector('.read-progress');
if(progress){
  const updateProgress=()=>{
    const height=document.documentElement.scrollHeight-window.innerHeight;
    const percent=height>0?(window.scrollY/height)*100:0;
    progress.style.width=`${Math.min(100,Math.max(0,percent))}%`;
  };
  window.addEventListener('scroll',updateProgress,{passive:true});
  updateProgress();
}

const themeButton=document.querySelector('.theme-toggle');
const root=document.documentElement;
const savedTheme=localStorage.getItem('poza-szumem-theme');
const systemDark=window.matchMedia?.('(prefers-color-scheme: dark)').matches;
root.dataset.theme=savedTheme||(systemDark?'dark':'light');

themeButton?.addEventListener('click',()=>{
  const next=root.dataset.theme==='dark'?'light':'dark';
  root.dataset.theme=next;
  localStorage.setItem('poza-szumem-theme',next);
});

const header=document.querySelector('.site-header');
const markHeader=()=>header?.classList.toggle('scrolled',window.scrollY>8);
window.addEventListener('scroll',markHeader,{passive:true});
markHeader();
