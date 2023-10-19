$(document).ready(function() {
  const token = localStorage.getItem('token');
  let userData;
  fetch('/userProfile', {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (response.status === 200) {
        return response.json(); // Parse the response as JSON
      } else {
        return response.json().then(data => {
          if (data.redirect) {
            // Redirect to the URL specified in the JSON response
            window.location.href = data.redirect;
          } else {
            console.error('Error:', data.message);
          }
        });
      }
    })
    .then(data => {
      userData = data;
      //load all data
      $('.username').html(userData.username);
      
    })
    .catch(error => {
      console.error('Error:', error);
    });
        
    
  // CHAT MESSAGING
  
  /*const socket = new WebSocket("ws://your-websocket-server-url");

  // Handle incoming messages from the WebSocket server
  socket.onmessage = function(event) {
    const message = JSON.parse(event.data);
    chatMessages.append(`<div class="chat-message-others">
				<img class="chat-image" src="https://api-private.atlassian.com/users/cb85ff85de1b228dc2759792e63e728e/avatar" alt="">
				<div class="chat-message-bubble">
					<span class="chat-message-bubble-username">
						${message.username}
					</span>
					<span class="chat-message">
						${message.text}
					</span>
				</div>
			</div>`);
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
  });*/

  //USER-PANEL OPTIONS MENU
  const logoutButton = $("#logout-button");
  const menuButton = $("#user-panel-options-menu-button");
  const menu = $("#user-panel-options-menu");

  function openMenu() {
      const buttonPosition = menuButton.offset();
      menu.css({
          display: "block",
          top: buttonPosition.top + menuButton.outerHeight(),
          left: buttonPosition.left - menu.outerWidth() + menuButton.outerWidth(),
      });
      
  }
  function closeMenu() {
    menu.css("display", "none");
    overlay.css("display", "none");
  }

  menuButton.click(function(e) {
    e.stopPropagation(); // Prevent the click event from propagating to the document
    if(menu.css("display") == "none") {
      openMenu()
    } else {
      closeMenu()
    }
  });

  // Add a click event listener to the document (body) to close the menu
  $(document).click(function() {
    closeMenu();
  });

  // Prevent clicks inside the menu from closing it
  menu.click(function(e) {
    e.stopPropagation();
  });


  //Log out button

  logoutButton.click(function(e) {
    e.stopPropagation()
    localStorage.removeItem("token");
    window.location.href="/"
  })
});
  


