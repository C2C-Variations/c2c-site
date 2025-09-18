
// C2C Chatbot Widget v5
(function(){
  // Utility: get page topic for context
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

  // Expose toggle globally for inline button
  window.toggleC2CChat = function toggleC2CChat() {
    var cont = document.getElementById('c2c-chatbot-container');
    if (!cont) return;
    var panel = document.getElementById('c2c-chat-panel');
    if (!panel) {
      // Inject panel markup on first open
      var topic = getTopic();
      panel = document.createElement('div');
      panel.id = 'c2c-chat-panel';
      panel.innerHTML = `
        <div id="c2c-chat-header">
          <span id="c2c-chat-title">C2C Assistant</span>
          <button id="c2c-chat-close" aria-label="Close chat">&times;</button>
        </div>
        <div id="c2c-chat-body">
          <p><strong>Hi!</strong> Need help with <em>${topic}</em>?</p>
          <ul style="margin:10px 0 0 0;padding-left:18px;">
            <li>How does C2C work?</li>
            <li>What do I get on this plan?</li>
            <li>How do I get support?</li>
          </ul>
          <p style="margin-top:10px;font-size:13px;opacity:.7;">Prefer WhatsApp? <a href="https://wa.me/61466873332" target="_blank" rel="noopener">Message us</a>.</p>
        </div>
      `;
      cont.appendChild(panel);
      // Add close handler
      panel.querySelector('#c2c-chat-close').onclick = function(){ panel.style.display = 'none'; };
    }
    // Toggle panel
    panel.style.display = (panel.style.display === 'flex' || panel.style.display === 'block') ? 'none' : 'block';
  };
})();
