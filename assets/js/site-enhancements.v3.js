console.info('C2C site enhancements BOOT v3');
(()=>{console.info("C2C site enhancements boot");
const h=document.getElementById("c2c-header");const t=document.getElementById("c2c-nav-toggle");
if(t&&h){t.addEventListener("click",()=>{const open=h.classList.toggle("nav-open");t.setAttribute("aria-expanded",String(open));});}
})();

