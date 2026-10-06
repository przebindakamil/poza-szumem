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