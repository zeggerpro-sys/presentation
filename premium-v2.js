(function(){
'use strict';
const slides=[...document.querySelectorAll('.slide')];
const deck=document.querySelector('#deck');
const dotsHost=document.querySelector('.slide-dots');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
if(!slides.length)return;

let current=0,locked=false,touchStartY=0,touchStartX=0,touchHeroStart=0,touchOrigin=0;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const range=(value,start,end)=>clamp((value-start)/(end-start));
const ease=value=>value<.5?2*value*value:1-Math.pow(-2*value+2,2)/2;

slides.forEach((slide,index)=>{
  const dot=document.createElement('button');
  dot.type='button';
  dot.setAttribute('aria-label',`${index+1}. ${slide.dataset.name}`);
  dot.addEventListener('click',()=>go(index,{resetHero:index===0}));
  dotsHost.append(dot);
});

const dots=[...dotsHost.children];
const number=document.querySelector('#slideNumber');
const name=document.querySelector('#slideName');
const fill=document.querySelector('#progressFill');
const prev=document.querySelector('#prevSlide');
const next=document.querySelector('#nextSlide');
const hero=document.querySelector('#heroVisual');
const heroImage=document.querySelector('#tankerFrame');
const heroCopy=document.querySelector('.hero-copy');
const heroShield=document.querySelector('.milk-shield');
const heroGlow=document.querySelector('.milk-glow');
const heroGrade=document.querySelector('#tankerGrade');
const tankCutaway=document.querySelector('#tankCutaway');
const milkVolume=document.querySelector('#milkVolume');
const milkDissolve=document.querySelector('#milkDissolve');
const heroOrbit=document.querySelector('.data-orbit');
const heroTags=[...document.querySelectorAll('.hero-tag')];
const moleculeField=document.querySelector('#moleculeField');
const moleculeContext=moleculeField?.getContext?.('2d',{alpha:true});
const factorCards=[...document.querySelectorAll('.factor-cloud span')];
const phaseNumber=document.querySelector('#heroPhase');
const phaseBars=[...document.querySelectorAll('.hero-story i')];
let heroTarget=0,heroCurrent=0,heroFrame=0,heroExitReady=false;
let particleItems=[],particleWidth=0,particleHeight=0,particleDpr=1,particleFrame=0,particleLastPaint=0;

const mix=(from,to,progress)=>from+(to-from)*progress;

function seededRandom(seed){
  let state=seed>>>0;
  return ()=>{
    state=(state*1664525+1013904223)>>>0;
    return state/4294967296;
  };
}

function buildParticleField(){
  if(!moleculeField||!moleculeContext)return;
  const bounds=moleculeField.getBoundingClientRect();
  particleWidth=Math.max(1,bounds.width);
  particleHeight=Math.max(1,bounds.height);
  particleDpr=Math.min(devicePixelRatio||1,1.75);
  moleculeField.width=Math.round(particleWidth*particleDpr);
  moleculeField.height=Math.round(particleHeight*particleDpr);
  moleculeContext.setTransform(particleDpr,0,0,particleDpr,0,0);

  const compact=particleWidth<=600;
  const count=compact?540:particleWidth<=1100?1250:2200;
  const random=seededRandom(19770426);
  const sourceX=compact?.71:.625;
  const sourceY=compact?.51:.505;
  const cardAnchors=compact
    ? [[.23,.22],[.72,.22],[.23,.31],[.72,.31],[.23,.40],[.72,.40]]
    : [[.27,.23],[.46,.13],[.83,.25],[.28,.77],[.55,.87],[.84,.75]];

  particleItems=Array.from({length:count},(_,index)=>{
    const angle=random()*Math.PI*2;
    const liquidRadius=Math.sqrt(random());
    const side=random()<.5?-1:1;
    const brainAngle=random()*Math.PI*2;
    const brainRadius=Math.sqrt(random());
    const lobeX=compact?.068:.073;
    const lobeY=compact?.15:.205;
    const group=index%6;
    const anchor=cardAnchors[group];
    return {
      sourceX:sourceX+Math.cos(angle)*(.095*liquidRadius),
      sourceY:sourceY+Math.sin(angle)*(.055*liquidRadius),
      scatterX:.06+random()*.88,
      scatterY:.08+random()*.84,
      brainX:.64+side*lobeX+Math.cos(brainAngle)*lobeX*brainRadius+(random()-.5)*.012,
      brainY:.48+Math.sin(brainAngle)*lobeY*brainRadius+(random()-.5)*.012,
      cardX:anchor[0]+(random()-.5)*.045,
      cardY:anchor[1]+(random()-.5)*.025,
      size:.45+Math.pow(random(),2)*2.15,
      alpha:.2+random()*.72,
      gold:random()>.84,
      bridge:index%13===0,
      phase:random()*Math.PI*2,
      speed:.55+random()*1.4
    };
  });
}

function drawNeuralLinks(progress,time){
  if(!moleculeContext||progress<=.02)return;
  const centerX=particleWidth*.64;
  const centerY=particleHeight*.48;
  const nodes=[[-.09,-.13],[-.02,-.18],[.08,-.12],[-.12,-.02],[-.035,-.045],[.055,-.025],[.13,.015],[-.1,.1],[-.015,.13],[.085,.105],[0,.015]];
  const links=[[0,1],[1,2],[0,3],[0,4],[1,4],[1,5],[2,5],[2,6],[3,4],[3,7],[4,5],[4,8],[4,10],[5,6],[5,9],[5,10],[6,9],[7,8],[8,9],[8,10],[9,10]];
  moleculeContext.save();
  moleculeContext.globalCompositeOperation='lighter';
  moleculeContext.lineWidth=1;
  moleculeContext.strokeStyle=`rgba(226,239,229,${progress*.2})`;
  moleculeContext.beginPath();
  moleculeContext.moveTo(centerX,centerY-particleHeight*.205);
  moleculeContext.bezierCurveTo(centerX-particleWidth*.17,centerY-particleHeight*.19,centerX-particleWidth*.18,centerY+particleHeight*.16,centerX,centerY+particleHeight*.2);
  moleculeContext.bezierCurveTo(centerX+particleWidth*.18,centerY+particleHeight*.16,centerX+particleWidth*.17,centerY-particleHeight*.19,centerX,centerY-particleHeight*.205);
  moleculeContext.stroke();
  links.forEach(([from,to],index)=>{
    const a=nodes[from],b=nodes[to];
    const pulse=.45+.35*Math.sin(time*.0012+index*.7);
    moleculeContext.strokeStyle=`rgba(197,138,37,${progress*(.08+pulse*.12)})`;
    moleculeContext.beginPath();
    moleculeContext.moveTo(centerX+a[0]*particleWidth,centerY+a[1]*particleHeight);
    moleculeContext.lineTo(centerX+b[0]*particleWidth,centerY+b[1]*particleHeight);
    moleculeContext.stroke();
  });
  moleculeContext.restore();
}

function drawParticleField(progress,time=performance.now()){
  if(!moleculeContext||!particleItems.length)return;
  const scatter=ease(range(progress,.58,.78));
  const neural=ease(range(progress,.73,.91));
  const cards=ease(range(progress,.87,1));
  moleculeContext.clearRect(0,0,particleWidth,particleHeight);
  if(scatter<=.001)return;
  moleculeContext.save();
  moleculeContext.globalCompositeOperation='lighter';
  particleItems.forEach(item=>{
    let x=mix(mix(item.sourceX,item.scatterX,scatter),item.brainX,neural);
    let y=mix(mix(item.sourceY,item.scatterY,scatter),item.brainY,neural);
    if(item.bridge){
      const bridge=ease(range(cards,.08,.88));
      x=mix(x,item.cardX,bridge);
      y=mix(y,item.cardY,bridge);
    }
    const freedom=(1-neural)*scatter;
    x+=Math.sin(time*.00045*item.speed+item.phase)*.007*freedom;
    y+=Math.cos(time*.00038*item.speed+item.phase)*.009*freedom;
    const alpha=item.alpha*scatter*(item.bridge?1-cards*.28:1);
    moleculeContext.fillStyle=item.gold?`rgba(221,171,78,${alpha})`:`rgba(232,247,236,${alpha})`;
    moleculeContext.beginPath();
    moleculeContext.arc(x*particleWidth,y*particleHeight,item.size*(.72+neural*.42),0,Math.PI*2);
    moleculeContext.fill();
  });
  moleculeContext.restore();
  drawNeuralLinks(neural,time);
}

function runParticleField(time){
  if(reduced.matches||current!==0||heroCurrent<.56){
    particleFrame=0;
    return;
  }
  if(time-particleLastPaint>32){
    drawParticleField(heroCurrent,time);
    particleLastPaint=time;
  }
  particleFrame=requestAnimationFrame(runParticleField);
}

function ensureParticleField(){
  if(!particleItems.length)buildParticleField();
  if(!particleFrame&&!reduced.matches&&current===0&&heroCurrent>=.56){
    particleFrame=requestAnimationFrame(runParticleField);
  }
}

function sync(index){
  current=index;
  slides.forEach((slide,i)=>{
    const active=i===index;
    slide.classList.toggle('is-active',active);
    slide.inert=!active;
    slide.setAttribute('aria-hidden',active?'false':'true');
  });
  dots.forEach((dot,i)=>{
    dot.classList.toggle('is-active',i===index);
    dot.setAttribute('aria-current',i===index?'step':'false');
  });
  number.textContent=String(index+1).padStart(2,'0');
  name.textContent=slides[index].dataset.name;
  fill.style.transform=`scaleX(${(index+1)/slides.length})`;
  prev.disabled=index===0;
  next.disabled=index===slides.length-1;
}

function go(index,{resetHero=false}={}){
  index=Math.max(0,Math.min(slides.length-1,index));
  if(index===current){
    if(index===0&&resetHero)setHeroProgress(0);
    return;
  }
  if(index===0&&!reduced.matches)setHeroProgress(resetHero?0:1,true);
  locked=true;
  slides[index].scrollIntoView({behavior:reduced.matches?'auto':'smooth'});
  sync(index);
  history.replaceState(null,'',`#slide-${index+1}`);
  setTimeout(()=>locked=false,reduced.matches?0:720);
}

function renderHero(){
  const delta=heroTarget-heroCurrent;
  heroCurrent+=Math.abs(delta)<.001?delta:delta*.115;
  const p=clamp(heroCurrent);
  const zoom=ease(range(p,.10,.24));
  const turn=ease(range(p,.24,.40));
  const cut=ease(range(p,.38,.53));
  const calls=ease(range(p,.48,.64));
  const spread=ease(range(p,.58,.78));
  const neural=ease(range(p,.73,.91));
  const cards=ease(range(p,.87,1));
  const callFade=1-range(p,.68,.82)*.92;

  document.querySelector('.hero')?.style.setProperty('--hero-progress',p.toFixed(3));
  if(heroImage){
    const x=-zoom*2.6-turn*1.4-neural*1.8;
    const y=zoom*.7-neural*.3;
    const scale=1+zoom*.18+turn*.045+cut*.035-neural*.02;
    heroImage.style.transform=`translate3d(${x}vw,${y}vh,${zoom*45}px) scale(${scale}) rotateY(${-turn*8.5}deg) rotateZ(${turn*.35}deg)`;
  }
  if(heroCopy){
    heroCopy.style.opacity=String(1-range(p,.13,.46)*.88);
    heroCopy.style.transform=`translate3d(${-range(p,.1,.48)*2.2}vw,${range(p,.1,.48)*-1.2}vh,0)`;
  }
  if(heroShield)heroShield.style.opacity=String(.16*(1-cut));
  if(heroGlow)heroGlow.style.opacity=String(cut*(1-spread*.72));
  if(heroGrade)heroGrade.style.opacity=String(.2+zoom*.16+turn*.12+cut*.18);
  if(tankCutaway)tankCutaway.style.opacity=String(.76+cut*.24);
  if(milkVolume){
    milkVolume.style.opacity=String((.86+cut*.14)*(1-spread*.95));
    const liquidEnergy=.12+zoom*.34+turn*.28+cut*.26;
    milkVolume.style.setProperty('--liquid-duration',`${(6.6-liquidEnergy*2.5).toFixed(2)}s`);
    milkVolume.style.setProperty('--wave-duration',`${(5.3-liquidEnergy*2).toFixed(2)}s`);
    milkVolume.style.setProperty('--liquid-rise',`${(-.7-liquidEnergy*1.8).toFixed(2)}px`);
  }
  if(milkDissolve)milkDissolve.style.opacity=String(cut*spread);
  if(heroOrbit){
    heroOrbit.style.opacity=String(.28+calls*.72-neural*.68);
    heroOrbit.style.transform=`scale(${1+zoom*.06+neural*.08}) rotate(${turn*1.8}deg)`;
  }
  heroTags.forEach((tag,index)=>{
    const item=ease(range(p,.43+index*.035,.57+index*.035));
    tag.style.opacity=String(item*callFade);
    tag.style.transform=`translate3d(0,${(1-item)*20-item*3}px,${item*70}px)`;
  });
  if(moleculeField)moleculeField.style.opacity=String(spread*(.82+neural*.18));
  drawParticleField(p);
  ensureParticleField();
  factorCards.forEach((card,index)=>{
    const item=ease(range(p,.865+index*.012,.955+index*.007));
    card.style.opacity=String(item);
    card.style.transform=`translate3d(0,${(1-item)*18}px,${item*80}px) scale(${.94+item*.06})`;
  });
  const thresholds=[.12,.27,.42,.57,.72,.87];
  const phase=1+thresholds.filter(value=>p>=value).length;
  if(phaseNumber)phaseNumber.textContent=String(phase).padStart(2,'0');
  phaseBars.forEach((bar,index)=>bar.classList.toggle('is-active',index<phase));
  prev.disabled=current===0&&heroTarget<=.01;

  if(Math.abs(heroTarget-heroCurrent)>.001)heroFrame=requestAnimationFrame(renderHero);
  else heroFrame=0;
}

function setHeroProgress(value,immediate=false){
  heroTarget=clamp(value);
  heroExitReady=false;
  if(immediate)heroCurrent=heroTarget;
  if(!heroFrame)heroFrame=requestAnimationFrame(renderHero);
}

function stepHero(direction,amount=.12){
  if(reduced.matches||current!==0)return false;
  if(direction>0&&heroTarget<.995){setHeroProgress(heroTarget+amount);return true;}
  if(direction<0&&heroTarget>.005){setHeroProgress(heroTarget-amount);return true;}
  if(direction<0)return true;
  if(!heroExitReady){heroExitReady=true;return true;}
  return false;
}

function advance(direction,amount){
  if(stepHero(direction,amount))return;
  go(current+direction);
}

prev.addEventListener('click',()=>advance(-1,.18));
next.addEventListener('click',()=>advance(1,.18));

addEventListener('keydown',event=>{
  if(event.target.closest?.('button,a,input,textarea,select,[role="button"],[role="link"],[role="tab"],[contenteditable="true"]')||event.altKey||event.ctrlKey||event.metaKey)return;
  if(['ArrowDown','ArrowRight','PageDown',' '].includes(event.key)){
    event.preventDefault();
    advance(1,.17);
  }
  if(['ArrowUp','ArrowLeft','PageUp'].includes(event.key)){
    event.preventDefault();
    advance(-1,.17);
  }
  if(event.key==='Home'){
    event.preventDefault();
    if(current===0)setHeroProgress(0);else go(0,{resetHero:true});
  }
  if(event.key==='End'){
    event.preventDefault();
    go(slides.length-1);
  }
});

deck.addEventListener('wheel',event=>{
  if(!event.deltaY)return;
  if(locked){event.preventDefault();return;}
  const direction=event.deltaY>0?1:-1;
  if(current===0&&!reduced.matches){
    event.preventDefault();
    const amount=clamp(Math.abs(event.deltaY)*.0009,.022,.13);
    if(!stepHero(direction,amount))go(1);
    return;
  }
  if(Math.abs(event.deltaY)<14)return;
  event.preventDefault();
  go(current+direction);
},{passive:false});

deck.addEventListener('touchstart',event=>{
  const touch=event.changedTouches[0];
  touchStartY=touch.clientY;
  touchStartX=touch.clientX;
  touchHeroStart=heroTarget;
  touchOrigin=current;
},{passive:true});

deck.addEventListener('touchmove',event=>{
  if(touchOrigin!==0||reduced.matches)return;
  const touch=event.changedTouches[0];
  const deltaY=touchStartY-touch.clientY;
  const deltaX=touchStartX-touch.clientX;
  if(Math.abs(deltaY)<=Math.abs(deltaX))return;
  event.preventDefault();
  setHeroProgress(touchHeroStart+deltaY*.00165);
},{passive:false});

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting&&entry.intersectionRatio>.62)sync(slides.indexOf(entry.target));
  });
},{threshold:[.62]});
slides.forEach(slide=>observer.observe(slide));
deck.addEventListener('touchend',event=>{
  if(touchOrigin!==0||reduced.matches)return;
  const touch=event.changedTouches[0];
  const deltaY=touchStartY-touch.clientY;
  const deltaX=touchStartX-touch.clientX;
  if(Math.abs(deltaY)<=Math.abs(deltaX)||Math.abs(deltaY)<38)return;
  if(deltaY>0&&touchHeroStart>=.995&&heroTarget>=.995)go(1);
  if(deltaY<0&&touchHeroStart<=.005)setHeroProgress(0);
},{passive:true});

if(hero&&!reduced.matches&&matchMedia('(pointer:fine)').matches){
  hero.addEventListener('pointermove',event=>{
    const box=hero.getBoundingClientRect();
    hero.style.setProperty('--rx',`${((.5-(event.clientY-box.top)/box.height)*1.4).toFixed(2)}deg`);
    hero.style.setProperty('--ry',`${(((event.clientX-box.left)/box.width-.5)*1.9).toFixed(2)}deg`);
  });
  hero.addEventListener('pointerleave',()=>{
    hero.style.setProperty('--rx','0deg');
    hero.style.setProperty('--ry','0deg');
  });
}

let particleResizeTimer=0;
addEventListener('resize',()=>{
  clearTimeout(particleResizeTimer);
  particleResizeTimer=setTimeout(()=>{
    particleItems=[];
    buildParticleField();
    drawParticleField(heroCurrent);
  },140);
});

reduced.addEventListener?.('change',()=>{
  if(reduced.matches&&particleFrame){
    cancelAnimationFrame(particleFrame);
    particleFrame=0;
  }
  setHeroProgress(reduced.matches?0:heroTarget,true);
});

const moduleCopy={
  rations:{
    number:'01',title:'Рационы',
    intro:'Составляйте рацион и сразу видьте, как каждое изменение влияет на баланс.',
    bullets:['Баланс энергии, MP и NDF','Контроль отклонений от норм','Сравнение вариантов без ручной сборки'],
    benefit:'Результат: обоснованный вариант рациона',
    metrics:[['ЭНЕРГИЯ','247 МДж/сут',82],['MP','2,48 кг/сут',71],['NDF','31,2% СВ',64]]
  },
  milk:{
    number:'03',title:'Молоко',
    intro:'Качество молока и надои рассматриваются вместе с рационом и группой.',
    bullets:['Жир, белок, соматика и мочевина','Динамика продуктивности','Связь с изменениями кормления'],
    benefit:'Результат: отклонение видно в контексте рациона',
    metrics:[['НАДОЙ','34,8 кг/гол/сут',78],['ЖИР','3,82%',61],['БЕЛОК','3,24%',70]]
  },
  storage:{
    number:'02',title:'Склад',
    intro:'Корма, партии, качество и остатки собраны в одном рабочем контуре.',
    bullets:['Учёт партий и поставщиков','Остатки и доступность','Качество корма для расчёта'],
    benefit:'Результат: расчёт опирается на доступный корм',
    metrics:[['ПАРТИИ','14 шт.',72],['ОСТАТОК','86 т',64],['ЗАПАС','12 суток',55]]
  },
  statistics:{
    number:'05',title:'Статистика',
    intro:'Тренды стада, рационы и экономика складываются в картину за выбранный период.',
    bullets:['Динамика удоя и качества','Сравнение рационов','Себестоимость и эффективность'],
    benefit:'Результат: данные превращаются в управленческий вывод',
    metrics:[['ПЕРИОД','30 суток',76],['РАЦИОНЫ','4 варианта',68],['СИГНАЛЫ','3 точки',74]]
  },
  groups:{
    number:'06',title:'Группы',
    intro:'Дворы, секции и технологические группы задают точный контекст кормления.',
    bullets:['Группировка по стадии лактации','Рацион для каждой группы','Учёт поголовья и условий'],
    benefit:'Результат: каждая группа получает свой контур управления',
    metrics:[['ГРУППЫ','6 групп',73],['ДОЙНЫЕ','120 голов',66],['СУХОСТОЙ','24 головы',82]]
  },
  tasks:{
    number:'04',title:'Задания',
    intro:'Рассчитанный рацион превращается в понятное задание и возвращается фактом исполнения.',
    bullets:['Задание оператору','План-факт кормления','Контроль исполнения'],
    benefit:'Результат: расчёт связан с реальной раздачей',
    metrics:[['ПЛАН РАЗДАЧИ','100%',86],['ФАКТ РАЗДАЧИ','98%',82],['ОТКЛОНЕНИЕ','2%',34]]
  }
};

const moduleButtons=[...document.querySelectorAll('.module')];
const detail=document.querySelector('#moduleDetail');
const detailNumber=document.querySelector('#detailNumber');
const detailTitle=document.querySelector('#detailTitle');
const detailIntro=document.querySelector('#detailIntro');
const detailBullets=document.querySelector('#detailBullets');
const detailBenefit=document.querySelector('#detailBenefit');
const moduleViz=document.querySelector('#moduleViz');
const connectorPulse=document.querySelector('#connectorPulse');
const canHover=matchMedia('(hover:hover) and (pointer:fine)').matches;
let activeModule='rations',moduleTimer=0;

function paintMetrics(metrics,key){
  moduleViz.replaceChildren();
  moduleViz.className=`module-viz ${['milk','statistics'].includes(key)?'is-chart':''}`;
  metrics.forEach(([label,value,width])=>{
    const card=document.createElement('div');
    const small=document.createElement('small');
    const strong=document.createElement('b');
    const meter=document.createElement('i');
    small.textContent=label;
    strong.textContent=value;
    meter.style.setProperty('--v',`${width}%`);
    card.append(small,strong,meter);
    moduleViz.append(card);
  });
}

function renderModule(key,commit=false){
  const item=moduleCopy[key];
  if(!item)return;
  if(commit)activeModule=key;
  clearTimeout(moduleTimer);
  detail.classList.add('is-changing');
  connectorPulse?.classList.remove('is-pulsing');
  void connectorPulse?.offsetWidth;
  connectorPulse?.classList.add('is-pulsing');
  moduleTimer=setTimeout(()=>{
    detailNumber.textContent=`${item.number} / МОДУЛЬ`;
    detailTitle.textContent=item.title;
    detailIntro.textContent=item.intro;
    detailBullets.replaceChildren(...item.bullets.map(text=>{
      const li=document.createElement('li');
      li.textContent=text;
      return li;
    }));
    detailBenefit.textContent=item.benefit;
    paintMetrics(item.metrics,key);
    detail.classList.remove('is-changing');
  },reduced.matches?0:110);
}

moduleButtons.forEach(button=>{
  const key=button.dataset.module;
  button.setAttribute('aria-pressed',key===activeModule?'true':'false');
  button.addEventListener('click',()=>{
    moduleButtons.forEach(node=>{
      const selected=node===button;
      node.classList.toggle('is-selected',selected);
      node.setAttribute('aria-pressed',selected?'true':'false');
    });
    renderModule(key,true);
  });
  if(canHover){
    button.addEventListener('pointerenter',()=>renderModule(key));
    button.addEventListener('pointerleave',()=>renderModule(activeModule));
  }
  button.addEventListener('focus',()=>renderModule(key));
  button.addEventListener('blur',()=>renderModule(activeModule));
});

document.querySelector('.hero-cta')?.addEventListener('click',event=>{
  event.preventDefault();
  if(!reduced.matches)setHeroProgress(1,true);
  go(1);
});

document.querySelector('.wordmark')?.addEventListener('click',event=>{
  event.preventDefault();
  go(0,{resetHero:true});
});

const hash=Number(location.hash.replace('#slide-',''))-1;
const initial=Number.isInteger(hash)&&hash>=0&&hash<slides.length?hash:0;
sync(initial);
setHeroProgress(initial===0?0:1,true);
if(initial)slides[initial].scrollIntoView({behavior:'auto'});
}());
