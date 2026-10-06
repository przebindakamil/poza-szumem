const cards=[...document.querySelectorAll('.article-card')];
const filters=[...document.querySelectorAll('.filter')];
const search=document.querySelector('#article-search');
const searchToggle=document.querySelector('.search-toggle');
const searchPanel=document.querySelector('#search-panel');
const empty=document.querySelector('#empty-state');
let activeFilter='all';

function hideEmptyCategories(){
  const used=new Set(cards.map(card=>card.dataset.category).filter(Boolean));
  filters.forEach(btn=>{
    if(btn.dataset.filter!=='all'&&!used.has(btn.dataset.filter)) btn.hidden=true;
  });
}

function updateArticles(){
  const query=(search?.value||'').trim().toLowerCase();
  let visible=0;
  cards.forEach(card=>{
    const categoryMatch=activeFilter==='all'||card.dataset.category===activeFilter;
    const haystack=(card.dataset.search||card.textContent).toLowerCase();
    const searchMatch=!query||haystack.includes(query);
    const show=categoryMatch&&searchMatch;
    card.hidden=!show;
    if(show) visible++;
  });
  if(empty) empty.hidden=visible!==0;
}

filters.forEach(btn=>btn.addEventListener('click',()=>{
  filters.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  activeFilter=btn.dataset.filter;
  updateArticles();
  const details=btn.closest('details');
  if(details) details.open=false;
}));

search?.addEventListener('input',updateArticles);

searchToggle?.addEventListener('click',()=>{
  const open=searchPanel?.hidden;
  if(searchPanel) searchPanel.hidden=!open;
  searchToggle.setAttribute('aria-expanded',String(Boolean(open)));
  if(open) setTimeout(()=>search?.focus(),0);
  else if(search){search.value='';updateArticles();}
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
