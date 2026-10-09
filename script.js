const cards = [...document.querySelectorAll('.article-card')];
const filters = [...document.querySelectorAll('.filter')];
const search = document.querySelector('#article-search');
const searchToggle = document.querySelector('.search-toggle');
const searchPanel = document.querySelector('#search-panel');
const empty = document.querySelector('#empty-state');
const categoryMenu = document.querySelector('.category-menu');
const categorySummary = categoryMenu?.querySelector('summary');
const LIBRARY_STATE_KEY = 'poza-szumem-library-v1';
const isLibraryHome = document.body.classList.contains('home') && cards.length > 0;
let libraryState = {};
if (isLibraryHome) { try { libraryState = JSON.parse(sessionStorage.getItem(LIBRARY_STATE_KEY) || '{}') || {}; } catch (_) {} }
const knownCategories = new Set(cards.map(card => card.dataset.category));
const BOOKMARKS_KEY = 'poza-szumem-bookmarks-v1';
const POSITIONS_KEY = 'poza-szumem-positions-v1';
let bookmarks = new Set();
let readingPositions = {};
try {
  const stored = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
  if (Array.isArray(stored)) bookmarks = new Set(stored.filter(id => typeof id === 'string'));
  const positions = JSON.parse(localStorage.getItem(POSITIONS_KEY) || '{}');
  if (positions && typeof positions === 'object' && !Array.isArray(positions)) {
    for (const [id, entry] of Object.entries(positions)) {
      if (entry && typeof entry.anchor === 'string' && /^(?:reading-p|section)-\d+$/.test(entry.anchor) && Number.isFinite(entry.progress) && Number.isFinite(entry.updatedAt)) readingPositions[id] = entry;
    }
  }
} catch (_) {}
let savedOnly = location.hash === '#saved';
let activeFilter = knownCategories.has(document.body.dataset.category) ? document.body.dataset.category : (knownCategories.has(libraryState.category) ? libraryState.category : 'all');
const sortControl = document.querySelector('#article-sort');
if (sortControl && ['newest', 'shortest', 'longest'].includes(libraryState.sort)) sortControl.value = libraryState.sort;
if (search && typeof libraryState.search === 'string') {
  search.value = libraryState.search.slice(0, 200);
  if (search.value && searchPanel) {
    searchPanel.hidden = false;
    searchToggle?.setAttribute('aria-expanded', 'true');
  }
}
const articleGrid = document.querySelector('.article-grid');
const viewControls = [...document.querySelectorAll('input[name="library-view"]')];
let libraryView = libraryState.view === 'list' ? 'list' : 'grid';
function applyLibraryView() {
  articleGrid?.classList.toggle('list-view', libraryView === 'list');
  viewControls.forEach(input => { input.checked = input.value === libraryView; });
}
function saveLibraryState() {
  if (!isLibraryHome) return;
  const state = { category: activeFilter, search: search?.value || '', sort: sortControl?.value || 'newest', view: libraryView, unread: unreadOnly, saved: savedOnly, scrollY: window.scrollY };
  try { sessionStorage.setItem(LIBRARY_STATE_KEY, JSON.stringify(state)); } catch (_) {}
}
viewControls.forEach(input => input.addEventListener('change', () => {
  libraryView = input.value;
  applyLibraryView();
  saveLibraryState();
}));
applyLibraryView();
window.addEventListener('pagehide', saveLibraryState);
window.addEventListener('pageshow', event => {
  if (isLibraryHome && savedOnly !== (location.hash === '#saved')) {
    savedOnly = location.hash === '#saved';
    updateArticles();
  }
  if (!event.persisted && isLibraryHome && Number.isFinite(libraryState.scrollY) && libraryState.scrollY > 0 && !location.hash.startsWith('#category/')) {
    setTimeout(() => window.scrollTo(0, libraryState.scrollY), 0);
  }
});

function polishArticleLabel(count) {
  if (count === 1) return 'artykuł';
  const lastTwo = count % 100;
  const last = count % 10;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return 'artykuły';
  return 'artykułów';
}

function updateArticleCounter() {
  const counter = document.querySelector('.orbit-card span');
  const label = document.querySelector('.orbit-card small');
  if (!counter || !label) return;
  const count = cards.length;
  counter.textContent = String(count);
  label.textContent = polishArticleLabel(count);
}

updateArticleCounter();


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
let unreadOnly = libraryState.unread === true;
function isRead(id) { return Boolean(id) && readArticles.has(id); }
function persistReadArticles() {
  try { localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...readArticles])); }
  catch (_) { /* Private browsing may not allow persistent storage. */ }
}
function setRead(id, value) {
  if (!id) return;
  if (value) {
    readArticles.add(id);
    delete readingPositions[id];
    try { localStorage.setItem(POSITIONS_KEY, JSON.stringify(readingPositions)); } catch (_) {}
  }
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
      status.innerHTML = '<i data-lucide="check" aria-hidden="true"></i><span>Przeczytany</span>';
      (card.querySelector('.card-meta') || card.querySelector('.card-footer'))?.appendChild(status);
    }
    status.hidden = !read;
  });
  updateArticles();
  updateArticleReadButton();
  window.lucide?.createIcons();
}
const discoverHost = document.querySelector('.hero-discovery');
const discoverButton = discoverHost ? document.createElement('button') : null;
if (discoverButton) {
  discoverButton.type = 'button';
  discoverButton.className = 'discover-random';
  discoverButton.innerHTML = '<span aria-hidden="true">↝</span> Odkryj coś nowego';
  discoverButton.setAttribute('aria-label', 'Otwórz losowy nieprzeczytany artykuł');
  discoverButton.addEventListener('click', () => {
    const available = cards.map(card => {
      const link = card.querySelector('.card-link')?.getAttribute('href') || '';
      return { link, id: articleIdFromUrl(link) };
    }).filter(item => item.link);

    const unread = available.filter(item => !isRead(item.id));
    const pool = unread.length ? unread : available;
    if (!pool.length) return;

    const picked = pool[Math.floor(Math.random() * pool.length)];
    window.location.href = picked.link;
  });
  discoverHost.appendChild(discoverButton);
}

const unreadFilter = document.querySelector('.library-actions') ? document.createElement('button') : null;
if (unreadFilter) {
  unreadFilter.type = 'button';
  unreadFilter.className = 'unread-filter';
  unreadFilter.textContent = 'Nieprzeczytane';
  unreadFilter.setAttribute('aria-pressed', String(unreadOnly));
  unreadFilter.classList.toggle('active', unreadOnly);
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
  const sort = sortControl?.value || 'newest';
  const minutes = card => Number(card.querySelector('.card-footer')?.textContent?.match(/(\d+)\s*min/)?.[1] || 0);
  const date = card => card.querySelector('time')?.dateTime || '';
  const ordered = [...cards].sort((a, b) => {
    if (sort === 'shortest') return minutes(a) - minutes(b) || date(b).localeCompare(date(a));
    if (sort === 'longest') return minutes(b) - minutes(a) || date(b).localeCompare(date(a));
    return date(b).localeCompare(date(a));
  });
  ordered.forEach(card => articleGrid?.appendChild(card));
  filters.forEach(button => {
    const selected = button.dataset.filter === activeFilter;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  const selectedFilter = filters.find(button => button.dataset.filter === activeFilter);
  if (categorySummary) categorySummary.textContent = activeFilter === 'all' ? 'Wszystkie tematy' : (selectedFilter?.textContent.trim() || 'Temat');

  cards.forEach(card => {
    const categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
    const haystack = searchIndex.get(card) || '';
    const searchMatch = terms.every(term => haystack.includes(term));
    const id = articleIdFromUrl(card.querySelector('.card-link')?.getAttribute('href') || '');
    const show = categoryMatch && searchMatch && (!unreadOnly || !isRead(id)) && (!savedOnly || bookmarks.has(id));

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
  const counter = document.querySelector('.library-count');
  if (counter) {
    const noun = visible === 1 ? 'tekst' : visible % 10 >= 2 && visible % 10 <= 4 && !(visible % 100 >= 12 && visible % 100 <= 14) ? 'teksty' : 'tekstów';
    counter.textContent = visible + ' ' + noun;
    counter.setAttribute('aria-label', counter.textContent);
  }
  saveLibraryState();
  const libraryHeading = document.querySelector('[data-library-heading]');
  if (libraryHeading) libraryHeading.textContent = savedOnly ? 'Zapisane artykuły' : (document.querySelector('.library')?.dataset.defaultHeading || 'Biblioteka');
  const savedLink = document.querySelector('[data-saved-view]');
  if (savedOnly) savedLink?.setAttribute('aria-current', 'page');
  else savedLink?.removeAttribute('aria-current');
  if (isLibraryHome) {
    const libraryLink = document.querySelector('[data-library-view]');
    if (savedOnly) libraryLink?.removeAttribute('aria-current');
    else libraryLink?.setAttribute('aria-current', 'page');
  }
  const clearFilters = document.querySelector('#clear-filters');
  if (clearFilters) clearFilters.hidden = !(activeFilter !== (document.body.dataset.category || 'all') || search?.value || unreadOnly);
  if (empty) {
    empty.hidden = visible !== 0;
    empty.textContent = savedOnly ? 'Brak zapisanych artykułów pasujących do filtrów.' : 'Nie znaleziono artykułów. Zmień wyszukiwanie lub filtry.';
  }
}

filters.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filters.forEach(filter => {
    const selected = filter === button;
    filter.classList.toggle('active', selected);
    filter.setAttribute('aria-pressed', String(selected));
  });
  if (categorySummary) categorySummary.textContent = activeFilter === 'all' ? 'Wszystkie tematy' : button.textContent.trim();
  updateArticles();
  if (categoryMenu) categoryMenu.open = false;
}));

sortControl?.addEventListener('change', updateArticles);
function openCategory(id) {
  savedOnly = false;
  if (!knownCategories.has(id)) return;
  activeFilter = id;
  if (search) search.value = '';
  unreadOnly = false;
  if (unreadFilter) { unreadFilter.classList.remove('active'); unreadFilter.setAttribute('aria-pressed', 'false'); }
  updateArticles();
  document.querySelector('#artykuly')?.scrollIntoView({ block: 'start' });
}
document.querySelectorAll('[data-category-link]').forEach(link => link.addEventListener('click', () => openCategory(link.dataset.categoryLink)));
function showSavedArticles(active) {
  if (!isLibraryHome) {
    try {
      const state = JSON.parse(sessionStorage.getItem(LIBRARY_STATE_KEY) || '{}') || {};
      sessionStorage.setItem(LIBRARY_STATE_KEY, JSON.stringify({ ...state, saved: active, category: 'all', search: '', unread: false, scrollY: 0 }));
    } catch (_) {}
  }
  savedOnly = active;
  activeFilter = 'all';
  if (search) search.value = '';
  unreadOnly = false;
  if (unreadFilter) { unreadFilter.classList.remove('active'); unreadFilter.setAttribute('aria-pressed', 'false'); }
  updateArticles();
  document.querySelector('#artykuly')?.scrollIntoView({ block: 'start' });
}
document.querySelector('[data-saved-view]')?.addEventListener('click', event => {
  if (isLibraryHome) {
    event.preventDefault();
    if (location.hash !== '#saved') location.hash = 'saved';
    else showSavedArticles(true);
  } else showSavedArticles(true);
});
document.querySelector('[data-library-view]')?.addEventListener('click', event => {
  if (isLibraryHome) {
    event.preventDefault();
    if (location.hash !== '#artykuly') location.hash = 'artykuly';
    showSavedArticles(false);
  } else showSavedArticles(false);
});
window.addEventListener('hashchange', () => {
  if (location.hash === '#saved') showSavedArticles(true);
  else if (isLibraryHome && savedOnly) showSavedArticles(false);
  if (location.hash.startsWith('#category/')) openCategory(location.hash.slice(10));
});
document.querySelector('#clear-filters')?.addEventListener('click', () => {
  activeFilter = document.body.dataset.category || 'all';
  if (search) search.value = '';
  unreadOnly = false;
  unreadFilter?.classList.remove('active');
  unreadFilter?.setAttribute('aria-pressed', 'false');
  updateArticles();
});
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
search?.addEventListener('keydown', event => {
  if (event.key === 'Escape' && searchPanel && !searchPanel.hidden) {
    event.preventDefault();
    searchToggle?.click();
    searchToggle?.focus();
  }
});
document.addEventListener('click', event => {
  if (categoryMenu?.open && !categoryMenu.contains(event.target)) categoryMenu.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && categoryMenu?.open && categoryMenu.contains(document.activeElement)) {
    categoryMenu.open = false;
    categorySummary?.focus();
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
  readButton.textContent = read ? 'Oznacz jako nieprzeczytany' : 'Oznacz jako przeczytany';
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

// Focus mode strips the article down to the reading experience.
const FOCUS_SIZE_KEY = 'poza-szumem-reader-size-v1';
const articleShell = document.querySelector('.article-shell');
if (articleShell && readingBody) {
  const focusBar = document.createElement('div');
  focusBar.className = 'focus-bar';

  const focusToggle = document.createElement('button');
  focusToggle.type = 'button';
  focusToggle.className = 'focus-toggle';
  focusToggle.innerHTML = '<span aria-hidden="true"><i data-lucide="focus"></i></span><span class="focus-label">Tryb skupienia</span>';
  focusToggle.setAttribute('aria-label', 'Tryb skupienia');
  focusToggle.title = 'Tryb skupienia';
  focusToggle.setAttribute('aria-pressed', 'false');

  const sizeControls = document.createElement('div');
  sizeControls.className = 'reader-size-controls';
  sizeControls.hidden = false;

  const smaller = document.createElement('button');
  smaller.type = 'button';
  smaller.className = 'reader-size-button';
  smaller.textContent = 'A−';
  smaller.setAttribute('aria-label', 'Zmniejsz tekst');

  const larger = document.createElement('button');
  larger.type = 'button';
  larger.className = 'reader-size-button';
  larger.textContent = 'A+';
  larger.setAttribute('aria-label', 'Powiększ tekst');

  sizeControls.append(smaller, larger);
  focusBar.append(focusToggle, sizeControls);
  document.body.appendChild(focusBar);

  const sizes = ['compact', 'normal', 'large'];
  let readerSize = 'normal';
  try {
    const storedSize = localStorage.getItem(FOCUS_SIZE_KEY);
    if (sizes.includes(storedSize)) readerSize = storedSize;
  } catch (_) {}

  function applyReaderSize() {
    document.documentElement.dataset.readerSize = readerSize;
    smaller.disabled = readerSize === 'compact';
    larger.disabled = readerSize === 'large';
  }

  function changeReaderSize(direction) {
    const index = sizes.indexOf(readerSize);
    const next = Math.min(sizes.length - 1, Math.max(0, index + direction));
    readerSize = sizes[next];
    try { localStorage.setItem(FOCUS_SIZE_KEY, readerSize); } catch (_) {}
    applyReaderSize();
  }

  function setFocusMode(active) {
    document.body.classList.toggle('focus-mode', active);
    focusToggle.classList.toggle('active', active);
    focusToggle.setAttribute('aria-pressed', String(active));
    focusToggle.querySelector('.focus-label').textContent = active ? 'Wyjdź ze skupienia' : 'Tryb skupienia';
    focusToggle.setAttribute('aria-label', active ? 'Wyjdź z trybu skupienia' : 'Tryb skupienia');
    focusToggle.title = active ? 'Wyjdź z trybu skupienia' : 'Tryb skupienia';
    focusToggle.querySelector('span[aria-hidden="true"]').innerHTML = '<i data-lucide="' + (active ? 'minimize-2' : 'focus') + '"></i>';
    window.lucide?.createIcons();
    sizeControls.hidden = false;
  }

  focusToggle.addEventListener('click', () => {
    setFocusMode(!document.body.classList.contains('focus-mode'));
  });
  smaller.addEventListener('click', () => changeReaderSize(-1));
  larger.addEventListener('click', () => changeReaderSize(1));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('focus-mode')) {
      setFocusMode(false);
      focusToggle.focus();
    }
  });

  applyReaderSize();
}

// Saved fragments: lightweight Readwise-style highlights stored in this browser.
const HIGHLIGHTS_KEY = 'poza-szumem-highlights-v1';
function loadHighlights() {
  try {
    const value = JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '[]');
    return Array.isArray(value) ? value.filter(item => item && typeof item.text === 'string' && typeof item.articleId === 'string' && typeof item.url === 'string' && (() => { try { const url = new URL(item.url, document.baseURI); return ['http:', 'https:', 'file:'].includes(url.protocol) && url.origin === location.origin; } catch (_) { return false; } })()) : [];
  } catch (_) { return []; }
}
let savedHighlights = loadHighlights();
function persistHighlights() {
  try { localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(savedHighlights)); } catch (_) {}
  refreshHighlightsUI();
}
function highlightId(item) {
  return normalizeSearch((item.articleId || '') + '|' + (item.text || ''));
}
function refreshHighlightsUI() {
  const badge = document.querySelector('.highlights-count');
  if (badge) {
    badge.textContent = String(savedHighlights.length);
    badge.hidden = savedHighlights.length === 0;
  }
  renderHighlightsPanel();
}

const headerActions = document.querySelector('.header-actions');
let highlightsPanel = null;
let highlightsBackdrop = null;
if (headerActions) {
  const openHighlights = document.createElement('button');
  openHighlights.type = 'button';
  openHighlights.className = 'icon-button highlights-button';
  openHighlights.setAttribute('aria-label', 'Moje fragmenty');
  openHighlights.title = 'Moje fragmenty';
  openHighlights.setAttribute('aria-expanded', 'false');
  openHighlights.innerHTML = '<span class="saved-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M6.75 4.75c0-.97.78-1.75 1.75-1.75h7c.97 0 1.75.78 1.75 1.75v15.1a.65.65 0 0 1-1.02.54L12 17.48l-4.23 2.91a.65.65 0 0 1-1.02-.54V4.75Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></span><span class="highlights-count" hidden>0</span>';
  const themeToggle = headerActions.querySelector('.theme-toggle');
  headerActions.insertBefore(openHighlights, themeToggle || null);

  highlightsBackdrop = document.createElement('div');
  highlightsBackdrop.className = 'highlights-backdrop';
  highlightsBackdrop.hidden = true;

  highlightsPanel = document.createElement('aside');
  highlightsPanel.className = 'highlights-panel';
  highlightsPanel.hidden = true;
  highlightsPanel.setAttribute('aria-label', 'Zapisane fragmenty');
  highlightsPanel.setAttribute('role', 'dialog');
  highlightsPanel.setAttribute('aria-modal', 'true');
  highlightsPanel.innerHTML =
    '<div class="highlights-panel-head"><div><span class="eyebrow">Kolekcja</span><h2>Moje fragmenty</h2></div>' +
    '<button class="highlights-close" type="button" aria-label="Zamknij">×</button></div>' +
    '<div class="highlights-list"></div>';

  document.body.append(highlightsBackdrop, highlightsPanel);

  const setPanel = open => {
    highlightsPanel.hidden = !open;
    highlightsBackdrop.hidden = !open;
    document.body.classList.toggle('highlights-open', open);
    openHighlights.setAttribute('aria-expanded', String(open));
    if (open) highlightsPanel.querySelector('.highlights-close')?.focus();
    else openHighlights.focus();
    document.querySelector('main')?.toggleAttribute('inert', open);
  };
  openHighlights.addEventListener('click', () => setPanel(true));
  highlightsPanel.querySelector('.highlights-close')?.addEventListener('click', () => setPanel(false));
  highlightsBackdrop.addEventListener('click', () => setPanel(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !highlightsPanel.hidden) setPanel(false);
    if (event.key === 'Tab' && !highlightsPanel.hidden) trapPanelFocus(event, highlightsPanel);
  });
}

function renderHighlightsPanel() {
  if (!highlightsPanel) return;
  const list = highlightsPanel.querySelector('.highlights-list');
  if (!list) return;
  list.innerHTML = '';
  if (!savedHighlights.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'highlights-empty';
    emptyState.innerHTML = '<strong>Jeszcze nic tu nie ma.</strong><span>Zaznacz fragment tekstu podczas czytania i wybierz „Zapisz”.</span>';
    list.appendChild(emptyState);
    return;
  }

  savedHighlights.slice().reverse().forEach(item => {
    const card = document.createElement('article');
    card.className = 'highlight-card';

    const quote = document.createElement('blockquote');
    quote.textContent = item.text;

    const meta = document.createElement('div');
    meta.className = 'highlight-meta';
    const link = document.createElement('a');
    link.href = item.url;
    link.textContent = item.title || 'Artykuł';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'highlight-remove';
    remove.textContent = 'Usuń';
    remove.addEventListener('click', () => {
      const id = highlightId(item);
      savedHighlights = savedHighlights.filter(saved => highlightId(saved) !== id);
      persistHighlights();
    });
    meta.append(link, remove);
    card.append(quote, meta);
    list.appendChild(card);
  });
}

if (readingBody && currentArticleId) {
  const selectionMenu = document.createElement('div');
  selectionMenu.className = 'selection-menu';
  selectionMenu.hidden = true;
  selectionMenu.innerHTML = '<button type="button" data-action="save">Zapisz</button><button type="button" data-action="copy">Kopiuj</button>';
  document.body.appendChild(selectionMenu);
  let selectedText = '';

  function hideSelectionMenu() {
    selectionMenu.hidden = true;
    selectedText = '';
  }

  function showSelectionMenu() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      hideSelectionMenu();
      return;
    }
    const range = selection.getRangeAt(0);
    const common = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
    if (!common || !readingBody.contains(common)) {
      hideSelectionMenu();
      return;
    }
    const text = selection.toString().replace(/\s+/g, ' ').trim();
    if (text.length < 3) {
      hideSelectionMenu();
      return;
    }
    selectedText = text.slice(0, 1500);
    const rect = range.getBoundingClientRect();
    selectionMenu.style.left = Math.min(window.innerWidth - 150, Math.max(12, rect.left + rect.width / 2 - 66)) + 'px';
    selectionMenu.style.top = Math.max(10, window.scrollY + rect.top - 48) + 'px';
    selectionMenu.hidden = false;
  }

  readingBody.addEventListener('mouseup', () => setTimeout(showSelectionMenu, 0));
  readingBody.addEventListener('touchend', () => setTimeout(showSelectionMenu, 20));
  document.addEventListener('mousedown', event => {
    if (!selectionMenu.hidden && !selectionMenu.contains(event.target)) {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) hideSelectionMenu();
    }
  });

  selectionMenu.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button || !selectedText) return;
    const action = button.dataset.action;

    if (action === 'save') {
      const item = {
        articleId: currentArticleId,
        title: document.querySelector('.article-title')?.textContent?.trim() || document.title,
        text: selectedText,
        url: window.location.href.split('#')[0],
        savedAt: new Date().toISOString()
      };
      const id = highlightId(item);
      if (!savedHighlights.some(saved => highlightId(saved) === id)) {
        savedHighlights.push(item);
        persistHighlights();
      }
      button.textContent = 'Zapisano ✓';
      setTimeout(() => { button.textContent = 'Zapisz'; hideSelectionMenu(); }, 850);
    }

    if (action === 'copy') {
      let copied = false;
      try {
        await navigator.clipboard.writeText(selectedText);
        copied = true;
      } catch (_) {
        const area = document.createElement('textarea');
        area.value = selectedText;
        document.body.appendChild(area);
        area.select();
        try { copied = document.execCommand('copy'); } catch (_) {}
        area.remove();
      }
      button.textContent = copied ? 'Skopiowano' : 'Nie udało się skopiować';
      setTimeout(() => { button.textContent = 'Kopiuj'; if (copied) hideSelectionMenu(); }, copied ? 850 : 2200);
    }
  });
}

window.addEventListener('storage', event => {
  if (event.key !== HIGHLIGHTS_KEY) return;
  savedHighlights = loadHighlights();
  refreshHighlightsUI();
});
refreshHighlightsUI();

// Keep states in sync if the reader uses multiple tabs of the same site.
window.addEventListener('storage', event => {
  if (event.key !== READ_STORAGE_KEY) return;
  readArticles = loadReadArticles();
  refreshReadingStatus();
});

hideEmptyCategories();
refreshReadingStatus();
if (location.hash.startsWith('#category/')) openCategory(location.hash.slice(10));

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
let savedTheme = null;
try { savedTheme = localStorage.getItem('poza-szumem-theme'); } catch (_) {}
if (!['light', 'dark'].includes(savedTheme)) savedTheme = null;
const systemDark=window.matchMedia?.('(prefers-color-scheme: dark)').matches;
root.dataset.theme=savedTheme||(systemDark?'dark':'light');

themeButton?.addEventListener('click',()=>{
  const next=root.dataset.theme==='dark'?'light':'dark';
  root.dataset.theme=next;
  try { localStorage.setItem('poza-szumem-theme',next); } catch (_) {}
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

    link.append(meta, title);
    list.appendChild(link);
  });

  section.appendChild(list);
  ending.insertAdjacentElement('afterend', section);
}

renderRelatedArticles();


// PWA: offline reading plus an install entry point that also works on iOS.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', new URL('./', document.querySelector('.brand')?.href || location.href)).href;
    navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' }).then(registration => registration.update()).catch(() => {});
  });
}

let deferredInstallPrompt = null;
const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isSafari = /^((?!chrome|crios|fxios|edgios).)*safari/i.test(navigator.userAgent);

const installHost = document.querySelector('.footer');
let installButton = null;
let installDialog = null;

function trapPanelFocus(event, panel) {
  const focusable = [...panel.querySelectorAll('a[href], button:not([disabled]), input, select, [tabindex="0"]')].filter(node => !node.hidden);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
function closeInstallDialog() {
  if (!installDialog) return;
  installDialog.hidden = true;
  document.body.classList.remove('install-dialog-open');
  document.querySelector('main')?.removeAttribute('inert');
  installButton?.focus();
}

function showInstallInstructions() {
  if (!installDialog) {
    installDialog = document.createElement('div');
    installDialog.className = 'install-dialog';
    installDialog.hidden = true;
    installDialog.innerHTML =
      '<div class="install-dialog-backdrop" data-close-install></div>' +
      '<section class="install-dialog-card" role="dialog" aria-modal="true" aria-labelledby="install-dialog-title">' +
      '<button type="button" class="install-dialog-close" data-close-install aria-label="Zamknij">×</button>' +
      '<span class="eyebrow">Poza Szumem</span>' +
      '<h2 id="install-dialog-title">Zainstaluj jako aplikację</h2>' +
      '<div class="install-dialog-copy"></div>' +
      '</section>';
    document.body.appendChild(installDialog);
    installDialog.addEventListener('click', event => {
      if (event.target.closest('[data-close-install]')) closeInstallDialog();
    });
  }

  const copy = installDialog.querySelector('.install-dialog-copy');
  if (isIOS && isSafari) {
    copy.innerHTML =
      '<p>Na iPhonie instalacja odbywa się z menu Safari.</p>' +
      '<ol><li>Stuknij <strong>Udostępnij</strong>.</li>' +
      '<li>Wybierz <strong>Dodaj do ekranu początkowego</strong>.</li>' +
      '<li>Włącz <strong>Otwórz jako aplikację</strong> i wybierz <strong>Dodaj</strong>.</li></ol>';
  } else if (isIOS) {
    copy.innerHTML =
      '<p>Na iPhonie aplikacje webowe instaluje się przez Safari.</p>' +
      '<ol><li>Otwórz tę stronę w <strong>Safari</strong>.</li>' +
      '<li>Stuknij <strong>Udostępnij</strong>.</li>' +
      '<li>Wybierz <strong>Dodaj do ekranu początkowego</strong>.</li></ol>';
  } else {
    copy.innerHTML =
      '<p>Twoja przeglądarka nie udostępniła jeszcze systemowego okna instalacji.</p>' +
      '<p>Użyj opcji <strong>Zainstaluj aplikację</strong> lub <strong>Dodaj do ekranu głównego</strong> w menu przeglądarki.</p>';
  }

  installDialog.hidden = false;
  document.body.classList.add('install-dialog-open');
  document.querySelector('main')?.setAttribute('inert', '');
  installDialog.querySelector('.install-dialog-close')?.focus();
}

if (installHost && !isStandalone) {
  installButton = document.createElement('button');
  installButton.type = 'button';
  installButton.className = 'pwa-install';
  installButton.id = 'poza-szumem-install';
  installButton.innerHTML =
    '<span class="pwa-install-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16.5v1.75A2.75 2.75 0 0 0 7.75 21h8.5A2.75 2.75 0 0 0 19 18.25V16.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
    '<span>Zainstaluj aplikację</span>';
  installHost.appendChild(installButton);

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.classList.add('native-install-ready');
  });

  installButton.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice?.outcome === 'accepted') installButton.hidden = true;
      deferredInstallPrompt = null;
      return;
    }
    showInstallInstructions();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && installDialog && !installDialog.hidden) closeInstallDialog();
  if (event.key === 'Tab' && installDialog && !installDialog.hidden) trapPanelFocus(event, installDialog);
});


const bookmarkIcon = document.querySelector('.highlights-button .saved-icon')?.innerHTML || '☆';
function toggleBookmark(id) {
  if (!id) return;
  if (bookmarks.has(id)) bookmarks.delete(id); else bookmarks.add(id);
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks])); } catch (_) {}
  refreshBookmarks();
  if (bookmarks.has(id) && navigator.serviceWorker?.controller) {
    const card = cards.find(card => articleIdFromUrl(card.querySelector('.card-link')?.getAttribute('href') || '') === id);
    const href = card?.querySelector('.card-link')?.getAttribute('href') || (currentArticleId === id ? location.href : '');
    if (href) navigator.serviceWorker.controller.postMessage({ type: 'CACHE_ARTICLE', url: new URL(href, document.baseURI).href });
  }
}
function refreshBookmarks() {
  document.querySelectorAll('[data-bookmark]').forEach(button => {
    const selected = bookmarks.has(button.dataset.bookmark);
    const label = selected ? 'Usuń z zapisanych' : 'Zapisz artykuł';
    button.setAttribute('aria-pressed', String(selected));
    const card = button.closest('.article-card');
    const title = card?.querySelector('h3')?.textContent?.trim() || document.querySelector('.article-title')?.textContent?.trim();
    button.setAttribute('aria-label', title ? label + ': ' + title : label);
    button.title = label;
    button.classList.toggle('active', selected);
  });
  if (cards.length) updateArticles();
}
function makeBookmarkButton(id) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'bookmark-toggle';
  button.dataset.bookmark = id;
  button.innerHTML = bookmarkIcon;
  button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); toggleBookmark(id); });
  return button;
}
cards.forEach(card => {
  const id = articleIdFromUrl(card.querySelector('.card-link')?.getAttribute('href') || '');
  if (id) card.querySelector('.card-footer')?.appendChild(makeBookmarkButton(id));
});
if (readingBody && currentArticleId) {
  document.querySelector('.article-heading')?.appendChild(makeBookmarkButton(currentArticleId));
}
refreshBookmarks();

function renderContinueReading() {
  if (!cards.length) return;
  let section = document.querySelector('.continue-reading');
  const pending = cards.map(card => {
    const href = card.querySelector('.card-link')?.getAttribute('href');
    const id = articleIdFromUrl(href || '');
    return { href, id, title: card.querySelector('h3')?.textContent || '', entry: readingPositions[id] };
  }).filter(item => item.entry && !isRead(item.id) && item.entry.progress > 0.02 && item.entry.progress < 0.96)
    .sort((a, b) => b.entry.updatedAt - a.entry.updatedAt).slice(0, 3);
  if (!pending.length) { section?.remove(); return; }
  if (!section) {
    section = document.createElement('section');
    section.className = 'wrap continue-reading';
    section.setAttribute('aria-labelledby', 'continue-heading');
    document.querySelector('.featured-reading')?.insertAdjacentElement('afterend', section);
  }
  section.replaceChildren();
  const heading = document.createElement('h2');
  heading.id = 'continue-heading';
  heading.textContent = 'Czytaj dalej';
  section.appendChild(heading);
  pending.forEach(item => {
    const link = document.createElement('a');
    link.href = item.href + '#resume';
    const title = document.createElement('span');
    title.textContent = item.title;
    const progress = document.createElement('small');
    progress.textContent = Math.round(item.entry.progress * 100) + '%';
    link.append(title, progress);
    section.appendChild(link);
  });
}
renderContinueReading();

if (readingBody && currentArticleId) {
  const paragraphs = [...readingBody.querySelectorAll('p, h2, h3')];
  paragraphs.forEach((paragraph, index) => { paragraph.id ||= 'reading-p-' + index; });
  const savedPosition = readingPositions[currentArticleId];
  const rememberPosition = () => {
    if (isRead(currentArticleId)) return;
    const total = document.documentElement.scrollHeight - innerHeight;
    const progress = total > 0 ? Math.min(1, Math.max(0, scrollY / total)) : 0;
    if (progress < 0.02) return;
    const nearest = paragraphs.reduce((best, paragraph) => Math.abs(paragraph.getBoundingClientRect().top - 140) < Math.abs(best.getBoundingClientRect().top - 140) ? paragraph : best, paragraphs[0]);
    if (!nearest) return;
    readingPositions[currentArticleId] = { anchor: nearest.id, progress, updatedAt: Date.now() };
    try { localStorage.setItem(POSITIONS_KEY, JSON.stringify(readingPositions)); } catch (_) {}
  };
  const resume = () => {
    if (!savedPosition) return;
    document.getElementById(savedPosition.anchor)?.scrollIntoView({ block: 'start' });
  };
  if (savedPosition && !isRead(currentArticleId)) {
    const controls = document.createElement('div');
    controls.className = 'resume-controls';
    const resumeButton = document.createElement('button');
    resumeButton.type = 'button';
    resumeButton.textContent = 'Wznów czytanie';
    resumeButton.addEventListener('click', resume);
    const restart = document.createElement('button');
    restart.type = 'button';
    restart.textContent = 'Od początku';
    restart.addEventListener('click', () => {
      delete readingPositions[currentArticleId];
      try { localStorage.setItem(POSITIONS_KEY, JSON.stringify(readingPositions)); } catch (_) {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
      controls.remove();
    });
    controls.append(resumeButton, restart);
    document.querySelector('.article-heading')?.appendChild(controls);
    if (location.hash === '#resume') requestAnimationFrame(() => requestAnimationFrame(resume));
  }
  let positionTimer;
  window.addEventListener('scroll', () => { clearTimeout(positionTimer); positionTimer = setTimeout(rememberPosition, 250); }, { passive: true });
  window.addEventListener('pagehide', rememberPosition);
  document.addEventListener('visibilitychange', () => { if (document.hidden) rememberPosition(); });
}
window.addEventListener('storage', event => {
  if (event.key === BOOKMARKS_KEY) {
    try { const values = JSON.parse(event.newValue || '[]'); if (Array.isArray(values)) bookmarks = new Set(values.filter(id => typeof id === 'string')); } catch (_) {}
    refreshBookmarks();
  }
  if (event.key === READ_STORAGE_KEY || event.key === POSITIONS_KEY) {
    if (event.key === POSITIONS_KEY) {
      try { const values = JSON.parse(event.newValue || '{}'); if (values && typeof values === 'object' && !Array.isArray(values)) readingPositions = values; } catch (_) {}
    }
    renderContinueReading();
  }
});

if (window.lucide) {
  const setIcon = (selector, name) => {
    const node = document.querySelector(selector);
    if (node) node.innerHTML = '<i data-lucide="' + name + '"></i>';
  };
  setIcon('.search-toggle > span', 'search');
  setIcon('.theme-toggle > span', root.dataset.theme === 'dark' ? 'sun' : 'moon');
  document.querySelectorAll('.highlights-close, .install-dialog-close').forEach(button => { button.innerHTML = '<i data-lucide="x"></i>'; });
  document.querySelectorAll('.bookmark-toggle').forEach(button => { button.innerHTML = '<i data-lucide="bookmark"></i>'; });
  document.querySelectorAll('.highlights-button .saved-icon').forEach(node => { node.innerHTML = '<i data-lucide="quote"></i>'; });
  document.querySelector('.discover-random > span')?.replaceChildren(Object.assign(document.createElement('i'), { }));
  const discoverIcon = document.querySelector('.discover-random > span > i');
  discoverIcon?.setAttribute('data-lucide', 'shuffle');
  setIcon('.pwa-install-icon', 'download');
  window.lucide.createIcons();
  themeButton?.addEventListener('click', () => {
    setIcon('.theme-toggle > span', root.dataset.theme === 'dark' ? 'sun' : 'moon');
    window.lucide.createIcons();
  });
}

const RETURN_KEY = 'poza-szumem-return-v1';
if (cards.length) {
  cards.forEach(card => card.querySelector('.card-link')?.addEventListener('click', () => {
    try { sessionStorage.setItem(RETURN_KEY, location.href.split('#')[0] + (savedOnly ? '#saved' : '#artykuly')); } catch (_) {}
  }));
}
if (readingBody) {
  try {
    const previous = sessionStorage.getItem(RETURN_KEY);
    if (previous) {
      const url = new URL(previous);
      const appRoot = new URL('./', document.querySelector('.brand')?.href || location.href);
      if (url.origin === location.origin && url.pathname.startsWith(appRoot.pathname) && !url.pathname.includes('/artykuly/')) {
        document.querySelectorAll('.article-back, .article-end a').forEach(link => { link.href = url.href; });
      }
    }
  } catch (_) {}
}
