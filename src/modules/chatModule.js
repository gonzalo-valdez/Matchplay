const { Snowflake } = require('nodejs-snowflake');
const cookie = require("cookie")
const database = require('../database')

let chatData = []

function generateChatData(userData, chatName) {
  let uid = new Snowflake();
  let data = {'uid': uid.getUniqueID().toString(), 'chatName': chatName, 'description': "", 
    'members': {}, 'admins': [userData.uid], 'messages': [], 'founder': userData.uid
  };
  data.members[userData.uid] = userData.username
  chatData.push(data);
  return data;
}

function getChatData(chatId) {
  return chatData.find((data) => {
    if(data.uid == chatId) {
      return data
    }
  })
}

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0'); // Pad with leading zero if needed
  const minutes = now.getMinutes().toString().padStart(2, '0'); // Pad with leading zero if needed
  return `${hours}:${minutes}`;
}


function addMember(userData, chatId) {
  return chatData.find((chat) => {
    if(chat.uid == chatId) {
      chat.members[userData.uid] = userData.username
      database.users.joinChat(userData.uid, chatId)
      return true
    }
  })
}



let chatInvites = {}
function generateChatInviteId(adminId, chatId, uses) {
  let data = getChatData(chatId)
  if(!data) return false
  if(!data.admins.includes(adminId)) return false
  
  let inviteData = {'userId': adminId,'chatId': chatId, 'uses': uses}
  let sf = new Snowflake()
  let uid = sf.getUniqueID().toString()
  chatInvites[uid] = inviteData
  return uid
}

function consumeChatInvite(userData, inviteId) {
  if(chatInvites[inviteId]){
    let chatId = chatInvites[inviteId].chatId
    addMember(userData, chatId)
    chatInvites[inviteId].uses = chatInvites[inviteId].uses - 1
    if(chatInvites[inviteId].uses <= 0) {
      delete chatInvites[inviteId]
    }
    return chatId
  }
  return false
}

function addMessage(messageData, chatId) {
  let chat = getChatData(chatId)
  if(chat) {
    chat.messages.push(messageData)
    return true
  } 
  return false
}

let funcs = []
funcs.initialize = function(server) {
  var io = require('socket.io')(server)

  io.on("connection", (socket) => {
    let userToken = cookie.parse(socket.handshake.headers.cookie).token
    let userData = database.users.verifyToken(userToken)
    if(!userData){
      return
    }
    socket.emit("send userData", {username: userData.username, userId: userData.uid})
    for(chatId of userData.chats) {
      //send all chatData to client
      let data = getChatData(chatId)
      socket.emit("load chat", data)
  
      socket.join(chatId) //todo leave rooms on kickmember, join on add member
    }

    socket.on("create chat", (chatName) => {
      let data = generateChatData(userData, chatName)
      database.users.joinChat(userData.uid, data.uid)
      socket.join(data.uid)
      socket.emit("load chat", data)
    })

    socket.on("send message", (message, chatId) => {
      let userData = database.users.verifyToken(userToken)
      let messageData = {username: userData.username, timestamp: getCurrentTime(), message: message}
      addMessage(messageData, chatId)
      socket.to(chatId).emit("receive message", messageData, chatId)
    })

    socket.on("generate invite", (chatData) => {
      let inviteId = generateChatInviteId(userData.uid, chatData.uid, 1)
      socket.emit("receive invite id", chatData, inviteId)
    })

    socket.on("use invite id", (inviteId) => {
      let userData = database.users.verifyToken(userToken)
      let chatId = consumeChatInvite(userData, inviteId)
      if(chatId == false) {
        return //later emit error to show "invite id not valid"
      }
      let data = getChatData(chatId)

      let joinedMsg = {username: userData.username, message: `${userData.username} has joined the chat.`,timestamp: getCurrentTime(), joinedleft: true}
      socket.to(chatId).emit("receive user joinedleft", joinedMsg, chatId)
      addMessage(joinedMsg, chatId)

      socket.join(chatId)
      socket.emit("load chat", data)
    })
  })  

}

module.exports = funcs