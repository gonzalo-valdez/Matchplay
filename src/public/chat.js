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

  function getCurrentTime() {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0'); // Pad with leading zero if needed
      const minutes = now.getMinutes().toString().padStart(2, '0'); // Pad with leading zero if needed
      return `${hours}:${minutes}`;
  }
  function addIncomingMessage(sender, message, timestamp) {
    const messageHtml = `
    <div class="chat-message-others">
      <img class="chat-image" src="https://api-private.atlassian.com/users/cb85ff85de1b228dc2759792e63e728e/avatar" alt="" draggable="false">
      <div class="chat-message-bubble">
        <div class="message-data">
          <span class="chat-message-bubble-username">${sender}</span>
          <span class="chat-message-text">${message}?</span>
        </div>
        <h6 class="chat-message-timestamp">${timestamp}</h6>
      </div>
    </div>
    `;
    $('#chat-messages').append(messageHtml);
  }
  function addSelfMessage(message) {
    const timestamp = getCurrentTime();
    const messageHtml =`
    <div class="chat-message-self">
      <div class="chat-message-bubble">
        <div class="message-data">
          <span class="chat-message-text">${message}</span>
        </div>
        <h6 class="chat-message-timestamp">${timestamp}</h6>
      </div>
    </div>
    `;
    $('#chat-messages').append(messageHtml);
    rescrollBottom();
  }

  $('#chat-input-box').on('keydown', function(event) {
    if (event.keyCode === 13) { 
        event.preventDefault(); 
        const message = $(this).val(); 
        if (message.trim() !== '') { 
            addSelfMessage(message);
            $(this).val('');
        }
    }
  });
  function rescrollBottom(){
    var chatMessages = $('#chat-messages');
    chatMessages.scrollTop(chatMessages[0].scrollHeight);
  }



  
  //USER-PANEL OPTIONS MENU
  const logoutButton = $("#logout-button");
  const menuButton = $("#user-panel-options-menu-button");
  const menu = $("#user-panel-options-menu");
  const openChatSettingsButton = $("#current-chat-settings-button");
  const closeChatSettingsButton = $("#close-chat-settings-button");
  const chatSettingsSidebar = $("#current-chat-settings-sidebar");
  const chatContent = $("#chat-content");

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
  }

  menuButton.click(function(e) {
    e.stopPropagation(); 
    if(menu.css("display") == "none") {
      openMenu()
    } else {
      closeMenu()
    }
  });

  $(document).click(function() {
    closeMenu();
  });

  menu.click(function(e) {
    e.stopPropagation();
  });


  //Log out button

  logoutButton.click(function(e) {
    e.stopPropagation()
    localStorage.removeItem("token");
    window.location.href="/"
  })
  

  //Open/Close chat settings
  function toggleChatSettings() {
    chatSettingsSidebar.css("display", chatSettingsSidebar.css("display") == "none" ? "flex" : "none");
    chatContent.toggle()
  }
  closeChatSettingsButton.click(toggleChatSettings);
  openChatSettingsButton.click(toggleChatSettings);

});
  


