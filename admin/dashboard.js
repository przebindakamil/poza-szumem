const statusLabels={
  idea:'Pomysł',
  research:'Research',
  draft:'Draft',
  ready:'Gotowy',
  published:'Opublikowany',
  empty:'Brak planu'
};

const weekday=new Intl.DateTimeFormat('pl-PL',{weekday:'short'});
const shortDate=new Intl.DateTimeFormat('pl-PL',{day:'2-digit',month:'2-digit'});
const longDate=new Intl.DateTimeFormat('pl-PL',{day:'numeric',month:'long'});
const warsawParts=new Intl.DateTimeFormat('en-CA',{
  timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'
});

function todayWarsaw(){
  const parts=warsawParts.formatToParts(new Date());
  const value=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return value.year+'-'+value.month+'-'+value.day;
}

function addDays(dateString,days){
  const date=new Date(dateString+'T12:00:00Z');
  date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString().slice(0,10);
}

function dateObject(dateString){
  return new Date(dateString+'T12:00:00Z');
}

function summaryCard(value,label){
  const node=document.createElement('div');
  node.className='summary-card';
  node.innerHTML='<strong>'+value+'</strong><span>'+label+'</span>';
  return node;
}

function dayCard({date,planned,published,categories,today}){
  const status=published?'published':(planned?.status||'empty');
  const title=published?.title||planned?.title||'Brak zaplanowanego tekstu';
  const category=published?.category||planned?.category||'';
  const notes=planned?.notes||'';
  const card=document.createElement('article');
  card.className='plan-day '+(status==='empty'?'empty ':'')+(date===today?'today':'');

  const dateValue=dateObject(date);
  const safeTitle=document.createElement('h3');
  safeTitle.className='plan-title';

  if(published){
    const link=document.createElement('a');
    link.href='../artykuly/'+published.slug+'.html';
    link.textContent=title;
    safeTitle.appendChild(link);
  }else{
    safeTitle.textContent=title;
  }

  const head=document.createElement('div');
  head.className='day-head';

  const dateWrap=document.createElement('div');
  const name=document.createElement('div');
  name.className='day-name';
  name.textContent=(date===today?'Dziś · ':'')+weekday.format(dateValue);
  const number=document.createElement('div');
  number.className='day-date';
  number.textContent=shortDate.format(dateValue);
  dateWrap.append(name,number);

  const badge=document.createElement('span');
  badge.className='status status-'+status;
  badge.textContent=statusLabels[status]||status;

  head.append(dateWrap,badge);
  card.append(head,safeTitle);

  if(category){
    const cat=document.createElement('p');
    cat.className='plan-category';
    cat.textContent=categories[category]||category;
    card.appendChild(cat);
  }

  if(notes){
    const note=document.createElement('p');
    note.className='plan-notes';
    note.textContent=notes;
    card.appendChild(note);
  }

  return {card,status,category};
}

async function init(){
  const summary=document.querySelector('#summary');
  const grid=document.querySelector('#plan-grid');
  const balance=document.querySelector('#balance');

  try{
    const response=await fetch('data.json',{cache:'no-store'});
    if(!response.ok) throw new Error('HTTP '+response.status);
    const data=await response.json();

    const today=todayWarsaw();
    const schedule=new Map((data.schedule||[]).map(item=>[item.date,item]));
    const articles=new Map((data.articles||[]).map(item=>[item.date,item]));
    const days=Array.from({length:7},(_,index)=>addDays(today,index));

    document.querySelector('#range-label').textContent=
      longDate.format(dateObject(days[0]))+' — '+longDate.format(dateObject(days[6]));

    const counts={planned:0,ready:0,published:0,empty:0};
    const categoryCounts={};

    for(const date of days){
      const planned=schedule.get(date);
      const published=articles.get(date);
      const rendered=dayCard({date,planned,published,categories:data.categories||{},today});
      grid.appendChild(rendered.card);

      if(rendered.status==='published') counts.published++;
      if(rendered.status==='ready') counts.ready++;
      if(rendered.status==='empty') counts.empty++;
      else counts.planned++;

      if(rendered.category){
        categoryCounts[rendered.category]=(categoryCounts[rendered.category]||0)+1;
      }
    }

    summary.append(
      summaryCard(counts.planned,'zaplanowanych / opublikowanych'),
      summaryCard(counts.ready,'gotowych do publikacji'),
      summaryCard(counts.published,'już opublikowanych'),
      summaryCard(counts.empty,'wolnych dni')
    );

    const entries=Object.entries(categoryCounts)
      .sort((a,b)=>b[1]-a[1]||(data.categories[a[0]]||a[0]).localeCompare(data.categories[b[0]]||b[0],'pl'));

    if(!entries.length){
      const empty=document.createElement('p');
      empty.className='range-label';
      empty.textContent='Brak zaplanowanych kategorii w najbliższych 7 dniach.';
      balance.appendChild(empty);
    }else{
      for(const [category,count] of entries){
        const chip=document.createElement('span');
        chip.className='balance-chip';
        chip.innerHTML='<span>'+(data.categories[category]||category)+'</span><strong>'+count+'</strong>';
        balance.appendChild(chip);
      }
    }
  }catch(error){
    const message=document.createElement('div');
    message.className='error';
    message.textContent='Nie udało się wczytać planu: '+error.message;
    grid.replaceWith(message);
  }
}

init();
