const socket = io();

socket.on("connect", () => {

})

$(document).ready(function() {
  

  // CHAT MESSAGING

  function getCurrentTime() {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0'); // Pad with leading zero if needed
      const minutes = now.getMinutes().toString().padStart(2, '0'); // Pad with leading zero if needed
      return `${hours}:${minutes}`;
  }
  function addIncomingMessage(sender, message, timestamp) {
    let chatMessages = currentChat.chatContent.find(".chat-messages");
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
    chatMessages.append(messageHtml);
  }
  function addSelfMessage(message) {
    let chatMessages = currentChat.chatContent.find(".chat-messages");
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
    chatMessages.append(messageHtml);
    chatMessages.scrollTop(chatMessages[0].scrollHeight);
  }


  



 




  
  //USER-PANEL OPTIONS MENU
  const logoutButton = $("#logout-button");
  const menuButton = $("#user-panel-options-menu-button");
  const userMenu = $("#user-panel-options-menu");
  
  const chatSettingsSidebar = $("#current-chat-settings-sidebar");
  const overlay = $("#screen-blur-overlay");
  function openMenu() {
      const buttonPosition = menuButton.offset();
      userMenu.css({
          display: "block",
          top: buttonPosition.top + menuButton.outerHeight(),
          left: buttonPosition.left - userMenu.outerWidth() + menuButton.outerWidth(),
      });
      
  }
  function closeMenu() {
    userMenu.css("display", "none");
  }

  menuButton.click(function(e) {
    e.stopPropagation(); 
    if(userMenu.css("display") == "none") {
      openMenu()
    } else {
      closeMenu()
    }
  });
  userMenu.click(function(e) {
    e.stopPropagation();
  });

  $(document).click(function() {
    //hiding popups
    closeMenu();

    
    if(joinChatPopup.is(":visible")){
      rotateJoinChatButton();
      joinChatPopup.hide();
      overlay.toggle();
    }
  });

  


  //Log out button

  logoutButton.click(function(e) {
    e.stopPropagation()
    fetch('/login/logout', {
      method: 'POST',
      credentials: 'include',
    })
    .then(response => {
      if (response.status === 200) {
        // Redirect
        window.location.href = '/'; 
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  })
  

  //Join-Create chat popup
  const joinChatPopup = $("#popup-join-create-chat");
  const openJoinButton = $("#sidebar-join-chat-button");
  let rot = 0;
  function toggleJoinCreatePopup(){
    overlay.toggle();
    joinChatPopup.toggle();
    rot = rot + 45;
    if(rot==90) rot = 0;
    openJoinButton.css({
      'transform': `rotate(${rot}deg)`
    })
  }
  openJoinButton.click(function(e) {
    e.stopPropagation();
    toggleJoinCreatePopup();
  })

  const joinChatTab = $("#popup-join-chat-tab");
  const createChatTab = $("#popup-create-chat-tab");
  const joinChatTabButton = $("#join-chat-tab-button");
  const createChatTabButton = $("#create-chat-tab-button");
  const popupJoinCreateChat = $("#popup-join-create-chat");

  popupJoinCreateChat.click(function(e){
    e.stopPropagation();
  })
  joinChatTabButton.click(function(e) {
    e.stopPropagation();
    joinChatTab.show();
    createChatTab.hide();
  })
  createChatTabButton.click(function(e) {
    e.stopPropagation();
    joinChatTab.hide();
    createChatTab.show();
  })

  //Chat creation

  chatList = []
  let currentChat;
  function getChatData(uid) {
    return chatList.find((e) => e.uid == uid)
  }

  function hideChats(){
    for(chat of chatList){
      if(chat.loaded){
        chat.container.hide();
        chat.chatSettings.hide();
        chat.chatContent.show();
      }
    }
  }
  function openChat(uid) {
    let chatContainer = $("#chat-container");
    let chatData = getChatData(uid);
    currentChat = chatData;
    if(chatData.loaded) {
      hideChats();
      chatData.container.show();
      return
    }
    let containerDiv = $("<div class='chat-content-container' style='display:none'></div>");
    let chatHtml = $(`
    <div class="chat-content" id="${uid}">
      <div class="chat-header">
        <img class="chat-image" src="https://api-private.atlassian.com/users/cb85ff85de1b228dc2759792e63e728e/avatar" alt="" draggable="false">
        <div class="chat-info">
          <h2 class="chat-name-current">${chatData.chatName}</h2>
        </div>
        <div class="chat-settings">
          <button class="current-chat-settings-button"><i class="bi bi-gear-fill"></i></button>
        </div>
      </div>
      <div class="chat-messages">

      </div>
      <div class="chat-input">
        <input class="chat-input-box" type="text" placeholder="Type your message">
      </div>
    </div>`)

    let chatSettingsHtml = $(`
    <div class="current-chat-settings-sidebar">
			<div class="chat-header">
			  <h4 class="chat-settings-sidebar-title">Chat Info</h4>
			  <button class="close-chat-settings-button"><i class="bi bi-x-circle-fill"></i></button>
			</div>
			
			<h2 class="chat-settings-name-current">${chatData.chatName}</h2>
			<img class="chat-settings-image" src="https://api-private.atlassian.com/users/cb85ff85de1b228dc2759792e63e728e/avatar" alt="" draggable="false">
			<h2 class="chat-settings-description-title">
			  Description
			  <button class="edit-description-button"><i class="bi bi-pencil-fill"></i></button>
			</h2>
			<p class="chat-settings-description">
				Grupo para quedar para padel
			</p>
			<div class="chat-settings-members-container">
			  <h2 class="chat-members-title">Chat members</h2>
			  <div class="chat-settings-members-list">
				<div class="chat-member">
				  <h4 class="chat-member-username">pibe1</h4>
				  <p class="chat-member-adminrank">Founder</p>
				  <button class="promote-member-button"><i class="bi bi-chevron-double-up"></i></button>
				  <button class="kick-member-button"><i class="bi bi-x-circle"></i></button>
				</div>
			  </div>
			</div>
		  </div>
    `)

    //Open/Close chat settings
    let openChatSettingsButton = chatHtml.find(".current-chat-settings-button");
    let closeChatSettingsButton = chatSettingsHtml.find(".close-chat-settings-button");
    function toggleChatSettings() {
      chatSettingsHtml.css("display", chatSettingsHtml.css("display") == "none" ? "flex" : "none");
      chatHtml.toggle()
    }
    closeChatSettingsButton.click(toggleChatSettings);
    openChatSettingsButton.click(toggleChatSettings);


    //CHAT INPUT BOX
    chatHtml.find('.chat-input-box').on('keydown', function(event) {
      if (event.keyCode === 13) { 
          event.preventDefault(); 
          const message = $(this).val(); 
          if (message.trim() !== '') { 
              addSelfMessage(message);
              $(this).val('');
          }
      }
    });

    chatData['loaded'] = true;
    chatData['container'] = containerDiv;
    chatData['chatContent'] = chatHtml;
    chatData['chatSettings'] = chatSettingsHtml;
    containerDiv.append(chatHtml);
    containerDiv.append(chatSettingsHtml);
    chatContainer.append(containerDiv);
  }

  function createChat(chatData) {
    const chatListHTML = $("#chat-list");
    let chatItem = $(`
    <button type="button" class="chat-list-item">
      <img class="chat-image" src="https://api-private.atlassian.com/users/cb85ff85de1b228dc2759792e63e728e/avatar" alt="" draggable="false">
      <div class="chat-info">
        <div class="chat-info-timestamp">
          <h4 class="chat-name">
            ${chatData.chatName}
          </h4>
          <h5 class="chat-timestamp">
            16:24
          </h5>
        </div>
        
        <div class="chat-info-preview">
          <span class="chat-last-message">pibe1 ha creado una actividad padel pibes</span>
          <span class="chat-unread-messages">24</span>
        </div>
      </div>
    </button>`)

    chatListHTML.append(chatItem);
    chatItem.click(function(e){
      openChat(chatData.uid);
    });
    openChat(chatData.uid)
    return chatData;
  }



  const createChatButton = $("#create-chat-button");
  createChatButton.click(function(e){
    e.stopPropagation();
    const chatNameInput = $("#popup-create-chatname");
    toggleJoinCreatePopup();
    createChat(chatNameInput.val());
  })

});
  


