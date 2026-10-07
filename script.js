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

// Focus mode strips the article down to the reading experience.
const FOCUS_SIZE_KEY = 'poza-szumem-reader-size-v1';
const articleShell = document.querySelector('.article-shell');
if (articleShell && readingBody) {
  const focusBar = document.createElement('div');
  focusBar.className = 'focus-bar';

  const focusToggle = document.createElement('button');
  focusToggle.type = 'button';
  focusToggle.className = 'focus-toggle';
  focusToggle.innerHTML = '<span aria-hidden="true">◎</span><span class="focus-label">Tryb skupienia</span>';
  focusToggle.setAttribute('aria-pressed', 'false');

  const sizeControls = document.createElement('div');
  sizeControls.className = 'reader-size-controls';
  sizeControls.hidden = true;

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
    focusToggle.querySelector('span[aria-hidden="true"]').textContent = active ? '×' : '◎';
    sizeControls.hidden = !active;
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
    return Array.isArray(value) ? value : [];
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
  openHighlights.setAttribute('aria-expanded', 'false');
  openHighlights.innerHTML = '<span aria-hidden="true">✦</span><span class="highlights-count" hidden>0</span>';
  const themeToggle = headerActions.querySelector('.theme-toggle');
  headerActions.insertBefore(openHighlights, themeToggle || null);

  highlightsBackdrop = document.createElement('div');
  highlightsBackdrop.className = 'highlights-backdrop';
  highlightsBackdrop.hidden = true;

  highlightsPanel = document.createElement('aside');
  highlightsPanel.className = 'highlights-panel';
  highlightsPanel.hidden = true;
  highlightsPanel.setAttribute('aria-label', 'Zapisane fragmenty');
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
  };
  openHighlights.addEventListener('click', () => setPanel(true));
  highlightsPanel.querySelector('.highlights-close')?.addEventListener('click', () => setPanel(false));
  highlightsBackdrop.addEventListener('click', () => setPanel(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !highlightsPanel.hidden) setPanel(false);
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
      try {
        await navigator.clipboard.writeText(selectedText);
      } catch (_) {
        const area = document.createElement('textarea');
        area.value = selectedText;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      button.textContent = 'Skopiowano ✓';
      setTimeout(() => { button.textContent = 'Kopiuj'; hideSelectionMenu(); }, 850);
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
