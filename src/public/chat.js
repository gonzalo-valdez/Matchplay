$(document).ready(function() {
    const messageForm = $("#message-form");
    const messageInput = $("#message-input");
    const chatMessages = $("#chat-messages");
    const logoutButton = $("#logout-button");
  
    // Replace with your WebSocket server URL
    const socket = new WebSocket("ws://your-websocket-server-url");
  
    // Handle incoming messages from the WebSocket server
    socket.onmessage = function(event) {
      const message = JSON.parse(event.data);
      chatMessages.append(`<p><strong>${message.username}:</strong> ${message.text}</p>`);
    };
  
    messageForm.on("submit", function(e) {
      e.preventDefault();
      const text = messageInput.val();
      if (text.trim() !== "") {
        const message = {
          text: text,
        };
        socket.send(JSON.stringify(message));
        messageInput.val("");
      }
    });
  
    logoutButton.on("click", function() {
      // Clear the token from local storage
      localStorage.removeItem("token");
      // Redirect to the login page or perform any other action
      window.location.href="/";
    });
  });
  