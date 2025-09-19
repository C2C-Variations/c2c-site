

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
