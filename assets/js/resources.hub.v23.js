(function(){
  const REGIONS=[National,VIC,NSW,QLD,WA,SA,TAS,NT,ACT];
  const toolbar=document.querySelector('.toolbar'); if(!toolbar) return;
  function filter(region){
    document.querySelectorAll('.resource-item').forEach(it=>{
      const tags=(it.dataset.regions||'').split(',').map(s=>s.trim()).filter(Boolean);
      const isNational=!tags.length || tags.includes('National');
      const match = region==='National' ? (isNational || tags.includes('National')) : (isNational || tags.includes(region));
      it.style.display = match ? '' : 'none';
    });
  }
  function renderChips(){
    toolbar.innerHTML='';
    const useLoc=document.createElement('button'); useLoc.textContent='Use my location'; useLoc.className='chip';
    useLoc.addEventListener('click',()=>navigator.geolocation?.getCurrentPosition(pos=>{
      const lat=pos.coords.latitude; let r='National'; if(lat<-37) r='VIC';
      toolbar.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c.textContent===r));
      filter(r);
    },()=>filter('National')));
    toolbar.appendChild(useLoc);
    REGIONS.forEach(r=>{
      const b=document.createElement('button'); b.textContent=r; b.className='chip';
      b.addEventListener('click',()=>{ toolbar.querySelectorAll('.chip').forEach(c=>c.classList.remove('active')); b.classList.add('active'); filter(r); });
      toolbar.appendChild(b);
    });
    toolbar.querySelectorAll('.chip').forEach(c=>{ if(c.textContent==='National') c.classList.add('active'); });
  }
  renderChips(); filter('National');
})();