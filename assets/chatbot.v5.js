
// C2C Chatbot v8 Overlay Panel (CSP-safe, accessible, single instance)
(() => {
	const cta = document.getElementById('c2c-chat-cta');
	const overlay = document.getElementById('c2c-chatbot-overlay');
	if (!cta || !overlay) return;
	const panel = overlay.querySelector('.c2c-chatbot-panel');
	const closeBtn = overlay.querySelector('#c2c-chatbot-close');
	const iframe = overlay.querySelector('iframe');
	const backdrop = overlay.querySelector('.c2c-chatbot-backdrop');
	let lastActive = null;

	// Open chat overlay
	function openChat() {
		if (overlay.hasAttribute('hidden')) {
			overlay.removeAttribute('hidden');
			overlay.setAttribute('aria-hidden', 'false');
			cta.setAttribute('aria-expanded', 'true');
			lastActive = document.activeElement;
			setTimeout(() => {
				panel && panel.focus();
			}, 10);
			// Load chat iframe if needed
			if (iframe && !iframe.src || iframe.src === 'about:blank') {
				iframe.src = 'https://wa.me/61466873332?text=Hi%20C2C%2C%20keen%20to%20chat.';
			}
			document.body.style.overflow = 'hidden';
		}
	}

	// Close chat overlay
	function closeChat() {
		overlay.setAttribute('hidden', '');
		overlay.setAttribute('aria-hidden', 'true');
		cta.setAttribute('aria-expanded', 'false');
		document.body.style.overflow = '';
		if (lastActive) setTimeout(() => lastActive.focus(), 10);
	}

	// Trap focus inside panel
	function trapFocus(e) {
		if (!overlay || overlay.hasAttribute('hidden')) return;
		const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.key === 'Tab') {
			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		} else if (e.key === 'Escape') {
			closeChat();
		}
	}

	// Open on CTA click
	cta.addEventListener('click', openChat);
	// Close on close button or backdrop click
	closeBtn && closeBtn.addEventListener('click', closeChat);
	backdrop && backdrop.addEventListener('click', closeChat);
	// Keyboard accessibility
	overlay.addEventListener('keydown', trapFocus);

	// Dismiss on route/page change (SPA safety)
	window.addEventListener('hashchange', closeChat);

	// Mobile: close on resize if overlay open and viewport gets too small
	window.addEventListener('resize', () => {
		if (!overlay.hasAttribute('hidden') && window.innerWidth < 400) closeChat();
	});

	// Prevent background scroll when overlay is open (iOS fix)
	document.addEventListener('touchmove', function(e) {
		if (!overlay.hasAttribute('hidden')) e.preventDefault();
	}, { passive: false });
})();

