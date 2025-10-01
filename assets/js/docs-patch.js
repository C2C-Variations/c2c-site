(function(){
  const seen=new Set();
  document.querySelectorAll('.doc-card').forEach(card=>{
    const key=(card.dataset.id||card.textContent||'').trim();
    if(seen.has(key)) card.remove(); else seen.add(key);
  });
  document.querySelectorAll('.bucket h2').forEach(h=>{
    const sec=h.closest('.bucket'); if(!sec) return;
    h.tabIndex=0; h.classList.add('clickable');
    h.addEventListener('click',()=>sec.classList.toggle('open'));
    h.addEventListener('keypress',e=>{ if(e.key==='Enter') sec.classList.toggle('open'); });
  });
})();