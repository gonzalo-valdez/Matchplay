const socket = io();
var username;
var userId;
var chatList = []
var currentChat;
$(document).ready(function() {
  socket.on("send userData", (userData) => {
    username = userData.username
    userId = userData.userId
  })

  socket.on("load chat", (chatData) => {
    createChat(chatData)
  })

  socket.on("receive invite id", (chatData, inviteURL) => {
    getChatData(chatData.uid).chatSettings.find(".generated-invite-link").html(inviteURL)
  })

  socket.on("receive message", (messageData, chatId) => {
    addIncomingMessage(messageData, chatId)
    if(currentChat && currentChat.uid != chatId) {
      increaseUnreadMessages(chatId)
    }
  })
  
  socket.on("receive user joinedleft", (messageData, chatId) => {
    userJoinedLeftMessage(messageData, chatId)
  })

  socket.on("leave chat", (chatId) => {
    leaveChat(chatId)
  })

  function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0'); // Pad with leading zero if needed
    const minutes = now.getMinutes().toString().padStart(2, '0'); // Pad with leading zero if needed
    return `${hours}:${minutes}`;
  }

  // CHAT MESSAGING

  function addIncomingMessage(messageData, chatId) {
    let chatMessages = getChatData(chatId).chatContent.find(".chat-messages");
    const messageHtml = `
    <div class="chat-message-others">
      <img class="chat-image" src="https://api-private.atlassian.com/users/cb85ff85de1b228dc2759792e63e728e/avatar" alt="" draggable="false">
      <div class="chat-message-bubble">
        <div class="message-data">
          <span class="chat-message-bubble-username">${messageData.username}</span>
          <span class="chat-message-text">${messageData.message}</span>
        </div>
        <h6 class="chat-message-timestamp">${messageData.timestamp}</h6>
      </div>
    </div>
    `;
    chatMessages.append(messageHtml);
    setLastMessage(messageData, chatId)
    chatMessages.scrollTop(chatMessages[0].scrollHeight);
  }
  function addSelfMessage(message, timestamp, chatId) {
    let chatMessages = getChatData(chatId).chatContent.find(".chat-messages");
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
    setLastMessage({username:'You', message: message, timestamp: timestamp}, chatId)
    chatMessages.scrollTop(chatMessages[0].scrollHeight);
  }
  function userJoinedLeftMessage(messageData, chatId) {
    let messageHtml = `<p class="user-joined-left-message">${messageData.message}</p>`
    let chatMessages = getChatData(chatId).chatContent.find(".chat-messages");
    chatMessages.append(messageHtml);
    chatMessages.scrollTop(chatMessages[0].scrollHeight);
    setLastMessage(messageData, chatId)
  }

  function setLastMessage(messageData, chatId) {
    let chatItem = getChatData(chatId).chatItem
    chatItem.find(".chat-timestamp").html(messageData.timestamp)
    chatItem.find(".chat-last-message").html(`${messageData.joinedleft ? "" : messageData.username + ": "} ${messageData.message}`)
  }
  
  function increaseUnreadMessages(chatId) {
    let chatData = getChatData(chatId)
    if(chatData) {
      let item = chatData.chatItem.find(".chat-unread-messages")
      chatData.unreadMessages += 1;
      item.html(chatData.unreadMessages)
      item.show()
    }
  }
  function clearUnreadMessages(chatId){
    let chatData = getChatData(chatId)
    if(!chatData)
      return false

    let item = chatData.chatItem.find(".chat-unread-messages")
    item.hide()
    chatData.unreadMessages = 0;
    item.html(chatData.unreadMessages)
  
  }
  function addChatMember(userData, chatId) {
    let chatData = getChatData(chatId)
    if(!chatData)
      return false

    let adminRank = ""
    if(chatData.admins.includes(userData.uid)){
      adminRank = "Admin"
    } 
    if (chatData.founder == userData.uid) {
      adminRank = "Founder"
    }

    let membersList = chatData.chatSettings.find(".chat-settings-members-list")
    let chatMember = $(`<div class="chat-member">
      <h4 class="chat-member-username">${userData.username}</h4>
      <p class="chat-member-adminrank">${adminRank}</p>
    </div>`)

    //add buttons if my userId is admin and if userData isnt admin/founder
    let chatMemberPromoteButton = $(`<button class="promote-member-button"><i class="bi bi-chevron-double-up"></i></button>`)
    let chatMemberKickButton = $(`<button class="kick-member-button"><i class="bi bi-x-circle"></i></button>`)

    if(chatData.admins.includes(userId) && !chatData.admins.includes(userData.uid) && chatData.founder != userData.uid) {
      //connect onclick todo

      chatMemberKickButton.click(function(e){
        socket.emit("kick member", userData.uid, chatData.uid)
      })

      chatMember.append(chatMemberPromoteButton)
      chatMember.append(chatMemberKickButton)
    }

    membersList.append(chatMember)
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

  const createChatButton = $("#create-chat-button");
  createChatButton.click(function(e){
    e.stopPropagation();
    const chatNameInput = $("#popup-create-chatname");
    toggleJoinCreatePopup();
    socket.emit("create chat", chatNameInput.val())
  })

  const joinChatButton = $("#join-chat-button");
  joinChatButton.click((e) => {
    e.stopPropagation();
    const chatIdInput = $("#popup-join-chatid");
    toggleJoinCreatePopup();
    socket.emit("use invite id", chatIdInput.val()) 
  })



  //Chat creation

  
  function getChatData(uid) {
    return chatList.find((e) => e.uid == uid)
  }

  function hideChats(){
    for(chat of chatList){
      if(chat.created){
        chat.container.hide();
        chat.chatSettings.hide();
        chat.chatContent.show();
      }
    }
  }
  function openChat(uid) {
    let chatContainer = $("#chat-container")
    let chatData = getChatData(uid);
    currentChat = chatData;
    if(chatData.created) {
      hideChats();
      chatData.container.show();
      let chatMessages = chatData.chatContent.find(".chat-messages") //scroll to bottom
      chatMessages.scrollTop(chatMessages[0].scrollHeight)
      clearUnreadMessages(uid)
      chatData.chatContent.find(".chat-input-box").focus() //focus chat input
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
			<button class="leave-chat-button">LEAVE</button>
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
				
			  </div>
			</div>
		  </div>
    `)

    // add elements if ADMIN
    let invSection = $(`<div class="invite-section">
        <button class="generate-invite-button">Generate Invite Link</button>
        <button class="copy-invite-button">copy<i class="bi bi-clipboard"></i></button>
        <p class="generated-invite-link"></p>
      </div`)
    
    if(chatData.admins.includes(userId)) {
      invSection.insertAfter(chatSettingsHtml.find(".chat-header"))
    }


    chatData['created'] = true;
    chatData['container'] = containerDiv;
    chatData['chatContent'] = chatHtml;
    chatData['chatSettings'] = chatSettingsHtml;


    //load members

    for(const [uid,username] of Object.entries(chatData.members)) {
      addChatMember({uid: uid, username: username},chatData.uid)
    }


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
              socket.emit("send message", message, chatData.uid)
              addSelfMessage(message,  getCurrentTime(), chatData.uid)
              $(this).val('');
          }
      }
    });
    
    //generate invite
    chatSettingsHtml.find(".generate-invite-button").click((e) => {
      e.stopPropagation()
      socket.emit("generate invite", chatData)
    })
    
    //copy invite
    chatSettingsHtml.find(".copy-invite-button").click((e) => {
      e.stopPropagation()
      navigator.clipboard.writeText(chatSettingsHtml.find(".generated-invite-link").text())
    })


    //leave chat
    chatSettingsHtml.find(".leave-chat-button").click((e) => {
      e.stopPropagation()
      socket.emit("leave chat", chatData)
    })


    //load chatData messages
    for(msg of chatData.messages) {
      if(msg.joinedleft) {
        userJoinedLeftMessage(msg, chatData.uid)
      } else if(msg.username == username) {
        addSelfMessage(msg.message, msg.timestamp, chatData.uid)
      } else {
        addIncomingMessage(msg, chatData.uid)
      }
    }
    //todo auto scroll to bottom after loading messages

    
    containerDiv.append(chatHtml);
    containerDiv.append(chatSettingsHtml);
    chatContainer.append(containerDiv);
  }









  //create chat
  function createChat(chatData) {
    const chatListHTML = $("#chat-list");

    let lastMessageData = chatData.messages[chatData.messages.length - 1]
    let lastMessage = "";
    let lastMessageTimestamp = "";
    if(lastMessageData) {
      lastMessageTimestamp = lastMessageData.timestamp 
      if("joinedleft" in lastMessageData) {
        lastMessage = `${lastMessageData.username} has ${lastMessageData.joinedleft ? 'joined' : 'left'} the chat.`
      } else {
        lastMessage = `${lastMessageData.username == username ? 'You' : lastMessageData.username}: ${lastMessageData.message}` 
      }
    }

   
    let chatItem = $(`
    <button type="button" class="chat-list-item">
      <img class="chat-image" src="https://api-private.atlassian.com/users/cb85ff85de1b228dc2759792e63e728e/avatar" alt="" draggable="false">
      <div class="chat-info">
        <div class="chat-info-timestamp">
          <h4 class="chat-name">
            ${chatData.chatName}
          </h4>
          <h5 class="chat-timestamp">
            ${lastMessageTimestamp}
          </h5>
        </div>

        <div class="chat-info-preview">
          <span class="chat-last-message">${lastMessage}</span>
          <span class="chat-unread-messages" style="display:none"></span>
        </div>
      </div>
    </button>`)

    chatData['chatItem'] = chatItem
    chatList.push(chatData)

    chatListHTML.append(chatItem);
    chatItem.click(function(e){
      openChat(chatData.uid);
    });
    openChat(chatData.uid)

    
    return chatData;
  }




  //leave chat


  function leaveChat(uid) {
    let chatData = getChatData(uid);
    if(chatData) {
      chatData.container.remove();
      chatData.chatItem.remove();
      for(let i = 0; i < chatList.length; i++) {
        if(chatList[i].uid == chatData.uid) {
          delete chatList[i]
          return true
        }
      }
    }
  }



});
  


