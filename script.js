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

// Reading status is local to this browser; no account or server required.
const READ_STORAGE_KEY = 'poza-szumem-read-v1';
function articleIdFromUrl(href, base = document.baseURI) {
  try {
    const url = new URL(href, base);
    const filename = url.pathname.split('/').pop() || '';
    return filename.endsWith('.html') ? filename.slice(0, -5) : filename;
  } catch (_) { return ''; }
}
function loadReadArticles() {
  try {
    const stored = JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || '[]');
    return new Set(Array.isArray(stored) ? stored.filter(x => typeof x === 'string') : []);
  } catch (_) { return new Set(); }
}
let readArticles = loadReadArticles();
let unreadOnly = false;
function isRead(id) { return Boolean(id) && readArticles.has(id); }
function persistReadArticles() {
  try { localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...readArticles])); }
  catch (_) { /* Private browsing may not allow persistent storage. */ }
}
function setRead(id, value) {
  if (!id) return;
  if (value) readArticles.add(id);
  else readArticles.delete(id);
  persistReadArticles();
  refreshReadingStatus();
}
function refreshReadingStatus() {
  cards.forEach(card => {
    const id = articleIdFromUrl(card.querySelector('.card-link')?.getAttribute('href') || '');
    const read = isRead(id);
    card.classList.toggle('is-read', read);
    let status = card.querySelector('.read-indicator');
    if (!status) {
      status = document.createElement('span');
      status.className = 'read-indicator';
      status.setAttribute('aria-label', 'Przeczytany');
      status.textContent = '✓ Przeczytany';
      card.querySelector('.card-footer')?.prepend(status);
    }
    status.hidden = !read;
  });
  updateArticles();
  updateArticleReadButton();
}
const unreadFilter = document.querySelector('.library-actions') ? document.createElement('button') : null;
if (unreadFilter) {
  unreadFilter.type = 'button';
  unreadFilter.className = 'unread-filter';
  unreadFilter.textContent = 'Nieprzeczytane';
  unreadFilter.setAttribute('aria-pressed', 'false');
  document.querySelector('.library-actions').prepend(unreadFilter);
  unreadFilter.addEventListener('click', () => {
    unreadOnly = !unreadOnly;
    unreadFilter.classList.toggle('active', unreadOnly);
    unreadFilter.setAttribute('aria-pressed', String(unreadOnly));
    updateArticles();
  });
}

function updateArticles() {
  const terms = normalizeSearch(search?.value || '').split(' ').filter(Boolean);
  let visible = 0;
  let firstVisible = null;

  cards.forEach(card => {
    const categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
    const haystack = searchIndex.get(card) || '';
    const searchMatch = terms.every(term => haystack.includes(term));
    const id = articleIdFromUrl(card.querySelector('.card-link')?.getAttribute('href') || '');
    const show = categoryMatch && searchMatch && (!unreadOnly || !isRead(id));

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

// A reader can mark an article manually, including reverting an automatic mark.
// Automatic marking happens only when the reader reaches the final paragraph.
const readingBody = document.querySelector('.article-shell .article-body');
const currentArticleId = articleIdFromUrl(window.location.pathname);
let readButton = null;
let manualReadChoice = false;
function updateArticleReadButton() {
  if (!readButton) return;
  const read = isRead(currentArticleId);
  readButton.textContent = read ? '✓ Przeczytany · oznacz jako nieprzeczytany' : '○ Oznacz jako przeczytany';
  readButton.setAttribute('aria-pressed', String(read));
  readButton.classList.toggle('is-read', read);
}
if (readingBody && currentArticleId) {
  const control = document.createElement('div');
  control.className = 'read-control';
  readButton = document.createElement('button');
  readButton.className = 'read-status-button';
  readButton.type = 'button';
  control.appendChild(readButton);
  readingBody.insertAdjacentElement('afterend', control);
  readButton.addEventListener('click', () => {
    manualReadChoice = true; // Don't immediately re-mark it if still at the end.
    setRead(currentArticleId, !isRead(currentArticleId));
  });
  updateArticleReadButton();

  const finalParagraph = readingBody.querySelector('p:last-of-type');
  let hasScrolled = false;
  const markOnFinish = () => {
    if (manualReadChoice || !hasScrolled || isRead(currentArticleId) || !finalParagraph) return;
    const end = finalParagraph.getBoundingClientRect();
    if (end.top < window.innerHeight * 0.82 && end.bottom < window.innerHeight) {
      setRead(currentArticleId, true);
    }
  };
  window.addEventListener('scroll', () => {
    hasScrolled = true;
    markOnFinish();
  }, { passive: true });
}

// Keep states in sync if the reader uses multiple tabs of the same site.
window.addEventListener('storage', event => {
  if (event.key !== READ_STORAGE_KEY) return;
  readArticles = loadReadArticles();
  refreshReadingStatus();
});

hideEmptyCategories();
refreshReadingStatus();

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


// Related reading is rendered only after the article, never in the reading flow.
// Use the homepage as the single source of published articles, so newly
// published texts become eligible without editing every existing article.
async function renderRelatedArticles() {
  const article = document.querySelector('.article-shell .article-body');
  const ending = document.querySelector('.article-shell .article-end');
  const currentTitle = document.querySelector('.article-title')?.textContent?.trim();
  const currentCategory = document.querySelector('.article-category')?.textContent?.trim();
  if (!article || !ending || !currentTitle || !currentCategory) return;

  // Ignore generic title words; they create false relations between essays.
  const commonWords = new Set([
    'dlaczego','kiedy','ktory','ktora','ktore','ktorym','ktorych','czyli',
    'przez','przed','poza','oraz','jako','jest','bylo','beda','zeby','tego',
    'temu','taki','takie','takim','taka','mozna','bardzo','wiecej','mniej',
    'zycia','zycie','czlowiek','czlowieka','swiat','swiata','naprawde',
    'jakie','czesto','wtedy','nawet','sobie','ktos','tutaj','tylko','ktorej',
    'ktory','ktore','nich','nasze','twoje','swoje','naszych','wlasnie'
  ]);
  function keywords(value) {
    return new Set(normalizeSearch(value)
      .split(/[^a-z0-9]+/)
      .filter(word => word.length >= 5 && !commonWords.has(word)));
  }

  const indexUrl = new URL('../index.html', window.location.href);
  let response;
  try {
    response = await fetch(indexUrl, { cache: 'no-cache' });
    if (!response.ok) return;
  } catch (error) {
    return; // The article stays readable when offline or while GitHub Pages deploys.
  }

  const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
  const heading = document.querySelector('.article-deck')?.textContent || '';
  const currentWords = keywords(currentTitle + ' ' + heading);
  const currentPath = window.location.pathname.replace(/\/$/, '');

  const candidates = [...doc.querySelectorAll('.article-card')].map((card, order) => {
    const link = card.querySelector('.card-link');
    const title = card.querySelector('.card-copy h3')?.textContent?.trim();
    const category = card.querySelector('.pill')?.textContent?.trim();
    const date = card.querySelector('time')?.textContent?.trim();
    if (!link || !title || !category) return null;
    const url = new URL(link.getAttribute('href'), indexUrl);
    if (url.pathname.replace(/\/$/, '') === currentPath) return null;

    const titleWords = keywords(title);
    const candidateWords = keywords(
      title + ' ' + (card.querySelector('.card-copy p')?.textContent || '') +
      ' ' + (card.dataset.search || '')
    );
    const titleOverlap = [...currentWords].filter(word => titleWords.has(word)).length;
    const keywordOverlap = [...currentWords].filter(word => candidateWords.has(word)).length;
    const sameCategory = category === currentCategory;

    // Only show articles with an actual link: matching subject or meaningful
    // vocabulary. Don't recommend unrelated stories just to fill three slots.
    if (!sameCategory && titleOverlap === 0 && keywordOverlap < 2) return null;
    return {
      url: url.href, title, date, category,
      score: (sameCategory ? 12 : 0) + titleOverlap * 6 + keywordOverlap * 2,
      order
    };
  }).filter(Boolean);

  candidates.sort((a, b) => b.score - a.score || a.order - b.order);
  const recommendations = candidates.slice(0, 3);
  if (!recommendations.length) return;

  const section = document.createElement('section');
  section.className = 'related-articles';
  section.setAttribute('aria-labelledby', 'related-heading');

  const headingEl = document.createElement('h2');
  headingEl.id = 'related-heading';
  headingEl.textContent = 'Czytaj również';
  section.appendChild(headingEl);

  const list = document.createElement('div');
  list.className = 'related-list';
  recommendations.forEach(item => {
    const link = document.createElement('a');
    link.className = 'related-link';
    link.href = item.url;

    const meta = document.createElement('span');
    meta.className = 'related-meta';
    meta.textContent = [item.category, item.date].filter(Boolean).join(' · ');

    const title = document.createElement('span');
    title.className = 'related-title';
    title.textContent = item.title;

    const arrow = document.createElement('span');
    arrow.className = 'related-arrow';
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');

    link.append(meta, title, arrow);
    list.appendChild(link);
  });

  section.appendChild(list);
  ending.insertAdjacentElement('afterend', section);
}

renderRelatedArticles();
