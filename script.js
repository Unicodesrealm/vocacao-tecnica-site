// === Vocação Técnica — script.js (NAV mobile + tema dinâmico + componentes) ===
document.addEventListener("DOMContentLoaded", () => {
  const isMobile = window.matchMedia('(max-width: 680px)').matches;
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===========================
   *  NAV: HAMBÚRGUER + GAVETA
   * =========================== */
  (function setupMobileNav(){
    const header = document.querySelector('header');
    const nav    = header?.querySelector('nav');
    if (!header || !nav) return;

    // botão hambúrguer
    let toggle = header.querySelector('.nav-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'nav-toggle';
      toggle.setAttribute('aria-label','Menu');
      toggle.setAttribute('aria-expanded','false');
      toggle.innerHTML = `
        <span class="nav-toggle-bar"></span>
        <span class="nav-toggle-bar"></span>
        <span class="nav-toggle-bar"></span>`;
      nav.appendChild(toggle);
    }

    // overlay (para click-fora)
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      document.body.appendChild(overlay);
    }

    // gaveta
    let drawer = document.querySelector('.nav-drawer');
    if (!drawer) {
      drawer = document.createElement('aside');
      drawer.className = 'nav-drawer';
      drawer.setAttribute('aria-hidden','true');
      drawer.innerHTML = `<ul class="drawer-list"></ul>`;
      document.body.appendChild(drawer);
    }

    // clonar links
    const srcUl = nav.querySelector('ul');
    const dstUl = drawer.querySelector('.drawer-list');
    if (srcUl && dstUl && !dstUl.childElementCount) {
      Array.from(srcUl.children).forEach(li => dstUl.appendChild(li.cloneNode(true)));
    }

    const openDrawer = () => {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden','false');
      overlay.classList.add('open');
      document.body.classList.add('menu-open');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded','true');
    };

    const closeDrawer = () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden','true');
      overlay.classList.remove('open');
      document.body.classList.remove('menu-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded','false');
    };

    toggle.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('open');
      isOpen ? closeDrawer() : openDrawer();
    });
    overlay.addEventListener('click', closeDrawer);

    // fecha ao clicar num link
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeDrawer();
      if (e.target === drawer) closeDrawer();
    });

    // Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });

    // sair do mobile
    window.addEventListener('resize', () => {
      if (window.innerWidth > 680 && drawer.classList.contains('open')) closeDrawer();
    });

    // swipe para fechar
    let startX = null;
    drawer.addEventListener('touchstart', (e)=>{ startX = e.touches[0].clientX; }, {passive:true});
    drawer.addEventListener('touchend', (e)=>{
      if (startX == null) return;
      const diff = startX - e.changedTouches[0].clientX;
      if (diff > 40) closeDrawer();
      startX = null;
    }, {passive:true});
  })();

  /* =====================================================
   * NAV ACTIVE + THEME DINÂMICO (scroll + load + resize)
   * ===================================================== */
  (function setupNavActiveAndTheme(){
    const header = document.querySelector('header');
    const navLinks = Array.from(document.querySelectorAll('nav a'))
      .filter(a => a.getAttribute('href')?.startsWith('#'));
    const logo = document.getElementById('siteLogo');

    if (!header) return;

    function updateLogo(isDark){
      if (!logo) return;
      const nextSrc = isDark ? logo?.dataset?.dark : logo?.dataset?.light;
      if (nextSrc && logo.getAttribute('src') !== nextSrc) {
        logo.setAttribute('src', nextSrc);
      }
    }

    const linkById = new Map(
      navLinks.map(a => [a.getAttribute('href').slice(1), a])
    );

    const sections = Array.from(document.querySelectorAll('main[id], section[id]'))
      .filter(s => linkById.has(s.id));

    const DARK_IDS = new Set(['sobre','contactos']);
    let currentActiveId = null;

    function setActive(id){
      if (id === currentActiveId) return;
      currentActiveId = id;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    }

    function computeState(){
      // Special rule for Carreiras page
      if (document.body.classList.contains('careers-page')) {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        if (y > 100) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        return; // stop here
      }

      // Default behavior for other pages
      const mid = window.innerHeight * 0.5;
      let best = { id:null, dist: Infinity };

      for (const sec of sections) {
        const r = sec.getBoundingClientRect();
        const center = (r.top + r.bottom) / 2;
        const dist = Math.abs(center - mid);
        const visible = r.top < window.innerHeight * 0.8 && r.bottom > window.innerHeight * 0.2;
        if (visible && dist < best.dist) best = { id: sec.id, dist };
      }

      if (best.id) {
        setActive(best.id);

        const allowTheme = !document.body.classList.contains('menu-open');
        const shouldBeDark = DARK_IDS.has(best.id);
        if (allowTheme) {
          header.classList.toggle('orange-theme', shouldBeDark);
          updateLogo(shouldBeDark);
        }
      }

      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const scrolled = y > 100;
      if (scrolled) {
        header.classList.add('scrolled');
        header.classList.remove('transparent');
      } else {
        header.classList.add('transparent');
        header.classList.remove('scrolled');
      }
    }

    let ticking = false;
    function onScrollResize(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { computeState(); ticking = false; });
    }

    window.addEventListener('scroll', onScrollResize, { passive:true });
    window.addEventListener('resize', onScrollResize, { passive:true });
    window.addEventListener('load', () => {
      computeState();
      setTimeout(computeState, 0);
    });

    computeState();
    updateLogo(header.classList.contains('orange-theme'));
  })();


  /* ===========================
   *  FADE-IN
   * =========================== */
  (function fadeIn(){
    const nodes = document.querySelectorAll(".fade-section, .car-fade");
    if (!nodes.length) return;
    if (isMobile || prefersReduce) {
      nodes.forEach(n => n.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    nodes.forEach(n => io.observe(n));
  })();


  /* ===========================
   *  SLIDER STACK
   * =========================== */
  (function heroSlider(){
    if (isMobile || prefersReduce) return;
    const boxes = [document.querySelector('.box0'), document.querySelector('.box1'), document.querySelector('.box2')].filter(Boolean);
    const dots = document.querySelectorAll('.dot');
    if (boxes.length !== 3 || dots.length !== 3) return;

    let index = 0, interval;
    function updateStack() {
      boxes.forEach((box, i) => {
        const pos = (i + index) % 3;
        if (pos === 0) { box.style.zIndex = 3; box.style.transform = 'translateX(0) scale(1)'; }
        else if (pos === 1) { box.style.zIndex = 2; box.style.transform = 'translateX(20px) scale(0.95)'; }
        else { box.style.zIndex = 1; box.style.transform = 'translateX(40px) scale(0.9)'; }
      });
      dots.forEach(dot => dot.classList.remove('active'));
      dots[index % 3].classList.add('active');
    }
    function startLoop() {
      interval = setInterval(() => { index = (index + 1) % 3; updateStack(); }, 3000);
    }
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        index = i; updateStack(); clearInterval(interval); startLoop();
      });
    });
    updateStack(); startLoop();
  })();


  /* ===========================
   *  SVG WAVES
   * =========================== */
  function createTopoBackground(svgEl, opts = {}) {
    const { numLines=25, waveLength=100, waveHeight=20, stroke="#3a3a3a", opacity=0.5, speed=1, stepX=10 } = opts;
    let spacing = 0, paths = [], time = 0;
    function createPath(yOffset) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("stroke", stroke); path.setAttribute("fill", "none");
      path.setAttribute("stroke-width", "1"); path.setAttribute("stroke-opacity", String(opacity));
      path.dataset.offset = yOffset; svgEl.appendChild(path); return path;
    }
    function init() {
      svgEl.innerHTML = "";
      const height = svgEl.clientHeight || svgEl.parentElement?.clientHeight || 600;
      spacing = height / numLines;
      paths = Array.from({ length: numLines }, (_, i) => createPath(i * spacing));
    }
    function animate() {
      const width  = svgEl.clientWidth  || svgEl.parentElement?.clientWidth  || window.innerWidth;
      const height = svgEl.clientHeight || svgEl.parentElement?.clientHeight || 600;
      svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
      paths.forEach(path => {
        let yOffset = parseFloat(path.dataset.offset);
        yOffset = (yOffset - 0.5 * speed + height) % height; path.dataset.offset = yOffset;
        let d = "";
        for (let x = 0; x <= width; x += stepX) {
          const waveY = yOffset + Math.sin((x / waveLength + time / 50)) * waveHeight;
          d += (x === 0) ? `M ${x},${waveY}` : ` L ${x},${waveY}`;
        }
        path.setAttribute("d", d);
      });
      time += speed; requestAnimationFrame(animate);
    }
    window.addEventListener("resize", init);
    init(); animate();
  }
  if (!isMobile && !prefersReduce) {
    const topoSVG=document.getElementById("topoSVG"), sobreSVG=document.getElementById("sobreSVG"), contSVG=document.getElementById("contactosSVG");
    if (topoSVG)  createTopoBackground(topoSVG,  { stroke:'#3a3a3a', opacity:.35, numLines:25, speed:1, stepX:10, waveLength:100, waveHeight:20 });
    if (sobreSVG) createTopoBackground(sobreSVG, { stroke:'#f6f6f6', opacity:.28, numLines:22, speed:0.9, stepX:10, waveLength:120, waveHeight:16 });
    if (contSVG)  createTopoBackground(contSVG,  { stroke:'#ffffff', opacity:.40, numLines:32, speed:0.8, stepX:12, waveLength:100, waveHeight:20 });
  }

// === Carreiras — Animated Topographic Contours (Desktop only) ===
(function careersTopography(){
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isMobile || prefersReduce) return; // não roda no mobile nem se reduzir movimento

  const svg = document.getElementById('carreirasTopo');
  if (!svg) return;

  const NS = 'http://www.w3.org/2000/svg';

  // Configuração
  const GAP = 18;              // espaçamento vertical entre linhas
  const MIN_LEVELS = 8;        // número mínimo de linhas de contorno
  const MAX_LEVELS = 20;       // número máximo de linhas de contorno
  const STEPS = 120;           // pontos por linha
  const SPEED = 0.012;         // velocidade de movimento
  const PEAKS = 3;             // número de montanhas/ondas

  let W = 1200, H = 420;
  function resize(){
    W = svg.clientWidth  || svg.parentElement?.clientWidth  || 1200;
    H = svg.clientHeight || svg.parentElement?.clientHeight || 420;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }
  resize();
  window.addEventListener('resize', resize, {passive:true});

  // Definir centros das montanhas
  const peaks = Array.from({length: PEAKS}, (_, i) => ({
    cx: (i+1) * (W/(PEAKS+1)),
    cy: H * (0.4 + 0.15*Math.random()),
    seed: Math.random()*1000
  }));

  function noise(theta, t, seed){
    return (
      0.45*Math.sin(theta*1.3 + t*0.6 + seed) +
      0.25*Math.sin(theta*2.1 - t*0.35 + seed*1.2) +
      0.15*Math.sin(theta*3.7 + t*0.2 + seed*0.7)
    );
  }

  function ringPath(cx, cy, radius, t, seed){
    const pts = [];
    for (let s=0; s<=STEPS; s++){
      const ang = (s/STEPS) * Math.PI * 2;
      const r = radius * (1 + 0.1*noise(ang, t, seed));
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      pts.push([x,y]);
    }
    let d=`M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)} `;
    for(let i=1;i<pts.length;i++){
      const [x,y]=pts[i];
      d+=`L ${x.toFixed(2)},${y.toFixed(2)} `;
    }
    d+="Z";
    return d;
  }

  // Grupo de paths
  const g = document.createElementNS(NS, 'g');
  svg.appendChild(g);

  function ensurePaths(n){
    while(g.childNodes.length<n){
      const p=document.createElementNS(NS,'path');
      p.setAttribute('fill','none');
      p.setAttribute('stroke-width','1.2');
      g.appendChild(p);
    }
    while(g.childNodes.length>n){
      g.removeChild(g.lastChild);
    }
  }

  let time=0, levelCount=MIN_LEVELS, dir=1, tick=0;

  function animate(){
    time += 0.02;
    tick++;
    if (tick%40===0){
      levelCount += dir;
      if(levelCount>=MAX_LEVELS||levelCount<=MIN_LEVELS){
        dir*=-1;
        levelCount=Math.max(MIN_LEVELS,Math.min(MAX_LEVELS,levelCount));
      }
    }

    ensurePaths(levelCount*PEAKS);

    let idx=0;
    peaks.forEach(peak=>{
      for(let i=0;i<levelCount;i++){
        const radius=(i+1)*GAP;
        const path=g.childNodes[idx++];
        const d=ringPath(peak.cx,peak.cy,radius,time,peak.seed+i*200);
        path.setAttribute('d',d);
        path.setAttribute('stroke','rgba(255,255,255,'+(0.25+0.5*(1-i/levelCount)).toFixed(2)+')');
      }
    });

    requestAnimationFrame(animate);
  }

  animate();

})();


// === Carreiras — Mountain Contour Animation ===
(function careersTopography(){
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isMobile || prefersReduce) return;

  const svg = document.getElementById("carreirasTopo");
  if (!svg) return;

  const NS = "http://www.w3.org/2000/svg";

  // Config
  const GAP = 22;            // distance between rings
  const MIN_LEVELS = 6;
  const MAX_LEVELS = 14;
  const STEPS = 140;         // smoothness of path
  const SPEED = 0.01;        // morph speed
  const PEAKS = 2;           // number of "mountains"

  let W = svg.clientWidth || 1200;
  let H = svg.clientHeight || 420;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  function resize(){
    W = svg.clientWidth || 1200;
    H = svg.clientHeight || 420;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }
  window.addEventListener("resize", resize);

  // Mountain centers
  const peaks = Array.from({length: PEAKS}, (_, i) => ({
    cx: (i+1) * (W/(PEAKS+1)),
    cy: H * (0.55 + 0.1*Math.random()),
    seed: Math.random()*1000
  }));

  // Noise function (layered sine)
  function noise(theta, t, seed){
    return (
      0.5 * Math.sin(theta*1.7 + t*0.6 + seed) +
      0.3 * Math.sin(theta*3.1 - t*0.3 + seed*1.2) +
      0.2 * Math.sin(theta*5.2 + t*0.25 + seed*0.8)
    );
  }

  // Build one ring path
  function ringPath(cx, cy, radius, t, seed){
    const pts = [];
    for (let s=0; s<=STEPS; s++){
      const ang = (s/STEPS) * Math.PI * 2;
      const r = radius * (1 + 0.12*noise(ang, t, seed));
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      pts.push([x,y]);
    }
    let d=`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i=1;i<pts.length;i++){
      d+=`L${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`;
    }
    d+="Z";
    return d;
  }

  // Group
  const g = document.createElementNS(NS,"g");
  svg.appendChild(g);

  function ensurePaths(n){
    while(g.childNodes.length<n){
      const p=document.createElementNS(NS,"path");
      p.setAttribute("fill","none");
      p.setAttribute("stroke-width","1.2");
      g.appendChild(p);
    }
    while(g.childNodes.length>n){
      g.removeChild(g.lastChild);
    }
  }

  let time=0, levels=MIN_LEVELS, dir=1, tick=0;

  function animate(){
    time += SPEED;
    tick++;

    // Breathing effect
    if (tick%40===0){
      levels += dir;
      if(levels>=MAX_LEVELS || levels<=MIN_LEVELS){
        dir*=-1;
        levels=Math.max(MIN_LEVELS, Math.min(MAX_LEVELS, levels));
      }
    }

    ensurePaths(levels*PEAKS);

    let idx=0;
    peaks.forEach(peak=>{
      for(let i=0;i<levels;i++){
        const radius=(i+1)*GAP;
        const path=g.childNodes[idx++];
        const d=ringPath(peak.cx, peak.cy, radius, time, peak.seed+i*100);
        path.setAttribute("d",d);
        const alpha = 0.4 - (i/levels)*0.35; // fade outer rings
        path.setAttribute("stroke",`rgba(255,255,255,${alpha.toFixed(2)})`);
      }
    });

    requestAnimationFrame(animate);
  }
  animate();
})();

  /* ===========================
   *  SOBRE SLIDER
   * =========================== */
  (function sobreSlider(){
    if (isMobile || prefersReduce) return;
    const sobreSlides=document.querySelectorAll('.sobre-slide'), sobreRange=document.querySelector('.sobre-range');
    if (!sobreSlides.length || !sobreRange) return;
    let sobreIndex=0;
    function updateSobreSlides() {
      const wrapper=document.querySelector('.sobre-slides-wrapper'); if (!wrapper) return;
      const wrapperWidth = wrapper.offsetWidth||600, slideWidth=180, slideGap=60, centerX=(wrapperWidth-slideWidth)/2;
      sobreSlides.forEach((slide,i) => {
        let offset=i-sobreIndex, total=sobreSlides.length;
        if (offset>total/2) offset-=total; if (offset<-total/2) offset+=total;
        if (offset===0){slide.style.zIndex=3;slide.style.opacity="1";slide.style.transform=`translateX(${centerX}px) scale(1)`;}
        else if (Math.abs(offset)===1){slide.style.zIndex=2;slide.style.opacity="0.7";slide.style.transform=`translateX(${centerX+offset*slideGap}px) scale(0.92)`;}
        else{slide.style.zIndex=1;slide.style.opacity="0.4";slide.style.transform=`translateX(${centerX+offset*(slideWidth*0.7)}px) scale(0.85)`;}
      });
      sobreRange.value=String(sobreIndex);
    }
    sobreRange.setAttribute('max', String(sobreSlides.length-1));
    sobreRange.addEventListener('input', e => { const v=parseInt(e.target.value,10); if (!Number.isNaN(v)){sobreIndex=v;updateSobreSlides();}});
    updateSobreSlides();
    let autoplayInterval=setInterval(()=>{sobreIndex=(sobreIndex+1)%sobreSlides.length;updateSobreSlides();},4000);
    const wrapper=document.querySelector('.sobre-slides-wrapper');
    wrapper?.addEventListener('mouseenter', ()=>clearInterval(autoplayInterval));
    wrapper?.addEventListener('mouseleave', ()=>{clearInterval(autoplayInterval);autoplayInterval=setInterval(()=>{sobreIndex=(sobreIndex+1)%sobreSlides.length;updateSobreSlides();},4000);});
    let startX=null;
    wrapper?.addEventListener('touchstart', e=>{startX=e.touches[0].clientX;});
    wrapper?.addEventListener('touchend', e=>{if(startX===null)return;const endX=e.changedTouches[0].clientX;const diff=startX-endX;
      if(Math.abs(diff)>30){sobreIndex=diff>0?(sobreIndex+1)%sobreSlides.length:(sobreIndex-1+sobreSlides.length)%sobreSlides.length;updateSobreSlides();}startX=null;});
  })();
/* ===========================
 *  PORTFÓLIO KPI + Charts (smooth, sequential, replay on scroll)
 * =========================== */
(function portfolioKPI(){
  if (isMobile || prefersReduce) {
    document.querySelectorAll('#portfolio .stat-number[data-target]')
      .forEach(el => el.textContent = el.dataset.target || '0');
    return;
  }

  const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const barSVG   = document.querySelector('#portfolio .bar-chart');
  const donutSVG = document.querySelector('#portfolio .donut-chart');
  const section  = document.getElementById('portfolio');

  const projetosPorArea = [
    { label: 'Planeamento',     value: 22 }, 
    { label: 'Arquitectura',    value: 18 },
    { label: 'Reassentamento',  value: 16 },
    { label: 'SIG & Cadastro',  value: 12 }
  ];
  const statusProjetos = [
    { label: 'Concluídos',   value: 68, color: '#e74400' },
    { label: 'Em execução',  value: 6,  color: '#777' },
    { label: 'Em proposta',  value: 4,  color: '#bbb' }
  ];

  let animated = false;

  function runAnimations(){
    if (animated) return;
    animated = true;

    // KPIs counters
    document.querySelectorAll('#portfolio .stat-number').forEach(el => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const duration = 2200;
      const start  = performance.now();
      function step(now){
        const p = Math.min(1, (now - start)/duration);
        const eased = easeOutExpo(p);
        el.textContent = Math.floor(target * eased).toLocaleString('pt-PT');
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString('pt-PT');
      }
      requestAnimationFrame(step);
    });

    // Bars
    if (barSVG) {
      barSVG.innerHTML = ''; // clear on replay
      const W = 380, H = 160, pad = 28;
      barSVG.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const max    = Math.max(...projetosPorArea.map(d => d.value));
      const innerW = W - pad*2, innerH = H - pad*2;
      const bw = innerW / projetosPorArea.length * 0.58;
      const gap = innerW / projetosPorArea.length * 0.42;

      const axis = document.createElementNS('http://www.w3.org/2000/svg','line');
      axis.setAttribute('x1', pad); axis.setAttribute('y1', H - pad);
      axis.setAttribute('x2', W - pad); axis.setAttribute('y2', H - pad);
      axis.setAttribute('stroke', '#fff'); axis.setAttribute('opacity', '0.4');
      barSVG.appendChild(axis);

      projetosPorArea.forEach((d, i) => {
        const x = pad + i*(bw+gap);
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x', x); rect.setAttribute('y', H - pad);
        rect.setAttribute('width', bw); rect.setAttribute('height', 0);
        rect.setAttribute('rx', 6);
        rect.setAttribute('fill', '#e74400'); rect.setAttribute('opacity', '0.9');
        barSVG.appendChild(rect);

        const val = document.createElementNS('http://www.w3.org/2000/svg','text');
        val.setAttribute('x', x + bw/2); val.setAttribute('y', H - pad - 6);
        val.setAttribute('text-anchor', 'middle');
        val.setAttribute('fill', '#fff'); val.setAttribute('font-size', '12'); val.setAttribute('font-weight','700');
        val.textContent = '0'; barSVG.appendChild(val);

        const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
        lbl.setAttribute('x', x + bw/2); lbl.setAttribute('y', H - pad + 20);
        lbl.setAttribute('text-anchor','middle');
        lbl.setAttribute('fill','#fff'); lbl.setAttribute('font-size','11');
        lbl.textContent = d.label; barSVG.appendChild(lbl);

        const start = performance.now();
        function animateBar(now){
          const p = Math.min(1, (now - start)/2200);
          const e = easeOutExpo(p);
          const h = (d.value / max) * innerH * e;
          const y = H - pad - h;
          rect.setAttribute('height', h);
          rect.setAttribute('y', y);
          val.setAttribute('y', y - 6);
          val.textContent = Math.round(d.value * e);
          if (p < 1) requestAnimationFrame(animateBar);
          else val.textContent = d.value;
        }
        requestAnimationFrame(animateBar);
      });
    }

    // Donut — sequential animation
    if (donutSVG) {
      donutSVG.innerHTML = ''; // clear on replay
      const cx = 60, cy = 60, r = 44, circ = 2*Math.PI*r;
      const total = statusProjetos.reduce((a,b)=>a+b.value,0);
      let offset = 0;

      const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
      txt.setAttribute('x', cx); txt.setAttribute('y', cy+4);
      txt.setAttribute('text-anchor','middle');
      txt.setAttribute('font-size','14'); txt.setAttribute('font-weight','700');
      txt.setAttribute('fill','#fff');
      txt.textContent = `${total}`;
      donutSVG.appendChild(txt);

      // Animate segments one after another
      function animateSegment(i){
        if (i >= statusProjetos.length) return;
        const s = statusProjetos[i];
        const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
        circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
        circle.setAttribute('fill','none'); circle.setAttribute('stroke', s.color);
        circle.setAttribute('stroke-width','18');
        circle.setAttribute('stroke-dasharray', `0 ${circ}`);
        circle.setAttribute('stroke-dashoffset', `${-offset}`);
        circle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
        donutSVG.insertBefore(circle, txt); // put segments behind text

        const seg = (s.value / total) * circ;
        const start = performance.now();
        function step(now){
          const p = Math.min(1, (now - start)/2200);
          const e = easeOutExpo(p);
          circle.setAttribute('stroke-dasharray', `${seg*e} ${circ - seg*e}`);
          if (p < 1) requestAnimationFrame(step);
          else { circle.setAttribute('stroke-dasharray', `${seg} ${circ-seg}`); animateSegment(i+1); }
        }
        requestAnimationFrame(step);
        offset += seg;
      }

      animateSegment(0);
    }
  }

  // Observer → trigger animations when visible, reset when hidden
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        runAnimations();
      } else if (animated) {
        // reset to allow replay
        animated = false;
        if (barSVG) barSVG.innerHTML = '';
        if (donutSVG) donutSVG.innerHTML = '';
        document.querySelectorAll('#portfolio .stat-number').forEach(el => el.textContent = '0');
      }
    });
  }, { threshold: 0.3 });

  if (section) io.observe(section);
})();

  /* ===========================
   *  FORM CONTACTO
   * =========================== */
  (function formContacto(){
    const form = document.getElementById('form-contacto');
    if (!form) return;
    const statusEl = document.getElementById('form-status');
    const validateEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome     = form.nome.value.trim();
      const email    = form.email.value.trim();
      const assunto  = form.assunto.value.trim();
      const mensagem = form.mensagem.value.trim();
      const website  = form.website ? form.website.value : '';

      if (!nome || !email || !assunto || !mensagem) {
        statusEl.textContent = 'Por favor, preencha todos os campos obrigatórios.';
        statusEl.style.color = '#ffcc00';
        return;
      }
      if (!validateEmail(email)) {
        statusEl.textContent = 'Insira um email válido.';
        statusEl.style.color = '#ffcc00';
        return;
      }
      if (website) {
        statusEl.textContent = 'Verificação anti-spam falhou.';
        statusEl.style.color = '#ff8a8a';
        return;
      }

      statusEl.textContent = 'A enviar...';
      statusEl.style.color = '#ccc';

      try {
        const res = await fetch('send.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, assunto, mensagem })
        });
        const data = await res.json().catch(()=>({ ok:false }));
        if (!res.ok || !data.ok) throw new Error(data.message || 'Falha no envio.');

        statusEl.textContent = 'Mensagem enviada com sucesso!';
        statusEl.style.color = '#9be59b';
        form.reset();
      } catch (err) {
        statusEl.textContent = err.message || 'Não foi possível enviar. Tente novamente.';
        statusEl.style.color = '#ff8a8a';
        console.error(err);
      }
    });
  })();
// 3) Blog Modal (glassy, works on desktop + mobile)
(function blogModal() {
  const modal          = document.querySelector(".modal");
  if (!modal) return;

  const modalDialog    = modal.querySelector(".modal-dialog");
  const modalImg       = modal.querySelector(".modal-img");
  const modalTitle     = modal.querySelector(".modal-title");
  const modalDate      = modal.querySelector(".modal-date");
  const modalText      = modal.querySelector(".modal-text");
  const modalClose     = modal.querySelector(".modal-close");
  const modalCloseAlt  = modal.querySelector(".mc-close");
  const modalPrev      = modal.querySelector(".mc-prev");
  const modalNext      = modal.querySelector(".mc-next");
  const modalRange     = modal.querySelector(".mc-range");
  const modalIndicator = modal.querySelector(".mc-indicator");

  const cards = Array.from(document.querySelectorAll("#blog .blog-card"));
  let currentIndex = 0;

  // ✅ Glass styling fallback (in case CSS not applied)
  if (modalDialog) {
    Object.assign(modalDialog.style, {
      background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03)), rgba(24,24,24,.65)",
      backdropFilter: "blur(22px) saturate(160%) brightness(110%)",
      WebkitBackdropFilter: "blur(22px) saturate(160%) brightness(110%)",
      border: "1px solid rgba(255,102,0,.35)",
      boxShadow: "0 20px 50px rgba(231,68,0,.35), inset 0 1px 0 rgba(255,255,255,.08)",
      borderRadius: "28px",
      color: "#fff"
    });
  }

  function loadModalContent(card, index) {
    const img   = card.querySelector("img");
    const title = card.dataset.title || card.querySelector("h3")?.textContent || "";
    const date  = card.dataset.date  || "";
    const more  = card.dataset.more  || card.querySelector("p")?.textContent || "";

    if (modalImg && img) modalImg.src = img.src || img.getAttribute("data-src");
    if (modalTitle) modalTitle.textContent = title;
    if (modalDate)  modalDate.textContent  = date;
    if (modalText)  modalText.textContent  = more;

    if (modalRange) {
      modalRange.max = cards.length - 1;
      modalRange.value = index;
    }
    if (modalIndicator) {
      const current = modalIndicator.querySelector(".mc-current");
      const total   = modalIndicator.querySelector(".mc-total");
      if (current) current.textContent = index + 1;
      if (total)   total.textContent   = cards.length;
    }
  }

  function openModal(index) {
    currentIndex = index;
    loadModalContent(cards[index], index);
    modal.classList.add("open");
    document.body.classList.add("no-scroll");
  }

  function closeModal() {
    modal.classList.remove("open");
    document.body.classList.remove("no-scroll");
  }

  function showAt(index) {
    if (index < 0) index = cards.length - 1;
    if (index >= cards.length) index = 0;
    currentIndex = index;
    loadModalContent(cards[index], index);
  }

  // Event binding helper
  function bindAll(el, handler) {
    if (!el) return;
    el.addEventListener("click", handler);
    el.addEventListener("touchend", e => { 
      e.preventDefault();
      handler(e);
    });
  }

  // Open modal on card tap/click
  cards.forEach((card, i) => {
    card.setAttribute("tabindex","0");
    card.setAttribute("role","button");
    bindAll(card, () => openModal(i));
    const img     = card.querySelector("img");
    const excerpt = card.querySelector(".excerpt");
    bindAll(img, () => openModal(i));
    bindAll(excerpt, () => openModal(i));
  });

  // Close buttons
  bindAll(modalClose, closeModal);
  bindAll(modalCloseAlt, closeModal);

  // Backdrop close
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  // Keyboard navigation
  document.addEventListener("keydown", e => {
    if (!modal.classList.contains("open")) return;
    if (e.key === "Escape")      closeModal();
    if (e.key === "ArrowRight")  showAt(currentIndex + 1);
    if (e.key === "ArrowLeft")   showAt(currentIndex - 1);
  });

  // Prev/Next buttons
  bindAll(modalPrev, () => showAt(currentIndex - 1));
  bindAll(modalNext, () => showAt(currentIndex + 1));

  // Range slider
  modalRange?.addEventListener("input", e => {
    showAt(parseInt(e.target.value, 10));
  });

  /* ===========================
   *  MODAL: POLÍTICA DE PRIVACIDADE
   * =========================== */
  (function privacyModalSetup(){
    const privacyModal   = document.getElementById("privacy-modal");
    const openPrivacy    = document.getElementById("open-privacy");
    const openPrivacyFooter = document.getElementById("open-privacy-footer");
    const closePrivacy   = document.getElementById("close-privacy");

    if (!privacyModal) return;

    function openModal(e){
      e.preventDefault();
      privacyModal.classList.add("open");
      document.body.classList.add("no-scroll");
    }
    function closeModal(){
      privacyModal.classList.remove("open");
      document.body.classList.remove("no-scroll");
    }

    openPrivacy?.addEventListener("click", openModal);
    openPrivacyFooter?.addEventListener("click", openModal);
    closePrivacy?.addEventListener("click", closeModal);
    privacyModal.addEventListener("click", e => {
      if (e.target === privacyModal) closeModal();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && privacyModal.classList.contains("open")) closeModal();
    });
  })();


})();
}); // DOMContentLoaded CLOSES ONCE