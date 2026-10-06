const buttons=[...document.querySelectorAll('.filter')];
const cards=[...document.querySelectorAll('.card')];
const search=document.querySelector('#article-search');
const count=document.querySelector('#results-count');
const empty=document.querySelector('#empty-state');
let activeFilter='all';

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

  if(count) count.textContent=visible===1?'1 tekst':`${visible} tekstów`;
  if(empty) empty.hidden=visible!==0;
}

buttons.forEach(btn=>btn.addEventListener('click',()=>{
  buttons.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  activeFilter=btn.dataset.filter;
  updateArticles();
}));

search?.addEventListener('input',updateArticles);

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
const initialTheme=savedTheme||(systemDark?'dark':'light');
root.dataset.theme=initialTheme;

themeButton?.addEventListener('click',()=>{
  const next=root.dataset.theme==='dark'?'light':'dark';
  root.dataset.theme=next;
  localStorage.setItem('poza-szumem-theme',next);
});

const revealItems=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.12});
  revealItems.forEach(el=>observer.observe(el));
}else{
  revealItems.forEach(el=>el.classList.add('is-visible'));
}
