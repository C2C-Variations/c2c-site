(function () {
  const BTN_ID = "c2c-chatbot-button";
  const PANEL_ID = "c2c-chatbot-container";

  function getEl(id) {
    return document.getElementById(id);
  }

  function showPanel(show) {
    const panel = getEl(PANEL_ID);
    const btn = getEl(BTN_ID);
    if (!panel || !btn) return;

    if (show) {
      panel.removeAttribute("hidden");
      btn.setAttribute("aria-expanded", "true");
    } else {
      panel.setAttribute("hidden", "");
      btn.setAttribute("aria-expanded", "false");
    }
  }

  function togglePanel() {
    const panel = getEl(PANEL_ID);
    if (!panel) return;
    const isHidden = panel.hasAttribute("hidden");
    showPanel(isHidden);
  }

  // Close when clicking outside
  function onDocClick(e) {
    const panel = getEl(PANEL_ID);
    const btn = getEl(BTN_ID);
    if (!panel || !btn) return;
    const open = !panel.hasAttribute("hidden");
    if (!open) return;

    if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      showPanel(false);
    }
  }

  // Close with Escape
  function onKeyDown(e) {
    if (e.key === "Escape") showPanel(false);
  }

  // Wire up once DOM is ready (no inline JS → CSP-safe)
  window.addEventListener("DOMContentLoaded", () => {
    const btn = getEl(BTN_ID);
    const panel = getEl(PANEL_ID);
    if (!btn || !panel) return;

    btn.addEventListener("click", togglePanel);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);

    // Optional: prime iframe with a neutral page until your backend is ready
    const iframe = panel.querySelector("iframe");
    if (iframe && iframe.src === "about:blank") {
      iframe.srcdoc = `
        <style>
          body{margin:0;background:#0f0f0f;color:#fff;font:14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;display:grid;place-items:center;height:100%}
          .card{max-width:80%;text-align:center;opacity:.85}
          .pill{display:inline-block;padding:.2rem .6rem;border-radius:999px;background:#1d1d1d;border:1px solid #333;color:#aaa;margin-top:.5rem}
        </style>
        <div class="card">
          <div>👋 The C2C chat will appear here.</div>
          <div class="pill">Backend connect coming next</div>
        </div>`;
    }

    console.log("[C2C] chat wired (CSP-safe).");
  });
})();


function toggleC2CChat() {
  const chatbot = document.getElementById("c2c-chatbot-container");
  if (!chatbot) return;
  chatbot.style.display =
    chatbot.style.display === "block" ? "none" : "block";
}

// Close if user clicks outside the chat
document.addEventListener("click", function (e) {
  const chatbot = document.getElementById("c2c-chatbot-container");
  const button = document.getElementById("c2c-chatbot-button");
  if (!chatbot || !button) return;

  if (
    chatbot.style.display === "block" &&
    !chatbot.contains(e.target) &&
    e.target !== button
  ) {
    chatbot.style.display = "none";
  }
});

console.log("C2C Chatbot script loaded sitewide");
