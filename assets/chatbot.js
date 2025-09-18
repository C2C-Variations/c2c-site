(function(){
  function toggleC2CChat(){
    var p = document.getElementById('c2c-chat-panel');
    if(!p) return;
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
  }
  function closeC2CChat(){
    var p = document.getElementById('c2c-chat-panel');
    if(p) p.style.display = 'none';
  }
  // attach once the DOM is ready
  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.getElementById('c2c-chat-toggle');
    if(btn){ btn.addEventListener('click', toggleC2CChat); }
    var x = document.getElementById('c2c-chat-close');
    if(x){ x.addEventListener('click', closeC2CChat); }
  });

  // expose in case inline onclick ever needed
  window.toggleC2CChat = toggleC2CChat;
  window.closeC2CChat = closeC2CChat;
})();
(function(){
  // Derive topic from meta tag or filename
  function getTopic(){
    const m = document.querySelector('meta[name="page-topic"]');
    if (m && m.content) return m.content;
    const path = location.pathname.toLowerCase();
    if (path.includes('pricing')) return 'Pricing';
    if (path.includes('partners')) return 'Partners';
    if (path.includes('testimonials')) return 'Testimonials';
    if (path.includes('docs')) return 'Documentation';
    if (path.includes('privacy')) return 'Privacy';
    if (path.includes('terms')) return 'Terms';
    if (path.includes('about')) return 'About';
    if (path.includes('404')) return 'Not Found';
    return 'Home';
  }

  const topic = getTopic();
  window.C2C_CHAT_CONTEXT = {
    topic,
    path: location.pathname,
    title: document.title
  };

  // Inject launcher + panel
  const launch = document.createElement('a');
  launch.id = 'c2c-chat-launch';
  launch.href = '#';
  launch.setAttribute('aria-label','Open chat');
  launch.innerText = 'Chat with C2C';
  document.body.appendChild(launch);

  const panel = document.createElement('div');
  panel.id = 'c2c-chat-panel';
  panel.innerHTML = `
    <div id="c2c-chat-header">
      C2C Assistant — <span id="c2c-topic">${topic}</span>
      <span id="c2c-chat-close" aria-label="Close chat" role="button" tabindex="0">✕</span>
    </div>
    <div id="c2c-chat-body">
      <p><strong>Hi!</strong> You’re viewing: <em>${topic}</em>.</p>
      <p>Ask a question and I’ll tailor my answer to this page.</p>
      <p><small>Prefer WhatsApp? <a href="https://wa.me/61466873332">Message us</a>.</small></p>
    </div>
    <div id="c2c-chat-input">
      <input id="c2c-input" placeholder="Type your question…" />
      <button id="c2c-send">Send</button>
    </div>
  `;
  document.body.appendChild(panel);

  function openPanel(){ panel.style.display='flex'; }
  function closePanel(){ panel.style.display='none'; }
  launch.addEventListener('click', e=>{ e.preventDefault(); openPanel(); });
  panel.querySelector('#c2c-chat-close').addEventListener('click', closePanel);

  // Placeholder “send” handler — just echoes and shows context
  panel.querySelector('#c2c-send').addEventListener('click', ()=>{
    const input = panel.querySelector('#c2c-input');
    const txt = input.value.trim();
    if(!txt) return;
    const body = panel.querySelector('#c2c-chat-body');
    const you = document.createElement('p'); you.textContent = 'You: ' + txt; body.appendChild(you);
    const bot = document.createElement('p');
    bot.innerHTML = 'Bot (context: <em>'+topic+'</em>): Thanks! This will be answered using the page topic. (Hook real backend here.)';
    body.appendChild(bot);
    input.value='';
    body.scrollTop = body.scrollHeight;
  });
})();
