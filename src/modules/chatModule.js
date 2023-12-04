const { Snowflake } = require('nodejs-snowflake');
const cookie = require("cookie")
const database = require('../database')

let chatData = []

function generateChatData(userId, chatName) {
  let uid = new Snowflake();

  let data = {'uid': uid.getUniqueID().toString(), 'chatName': chatName, 'description': "", 
    'members': [userId], 'admins': [userId], 'messages': [], 'founder': userId,
  };
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

function promoteMember(adminId, memberId, chatId) {
  chatData.find((chat) => {
    if(chat.uid == chatId && chat.admins.includes(adminId) && chat.members.includes(memberId)) {
      chat.admins.push(memberId)
    }
  })
}

function kickMember(adminId, memberId, chatId) {
  chatData.find((chat) => {
    if(chat.uid == chatId && chat.admins.includes(adminId) && chat.members.includes(memberId) && chat.founder != memberId) {
      chat.members.splice(chat.members.indexOf(memberId), 1)
    }
  })
}

function addMember(userId, chatId) {
  return chatData.find((chat) => {
    if(chat.uid == chatId) {
      chat.members.push(userId)
      return true
    }
  })
}

function updateDescription(adminId, chatId, description) {
  chatData.find((chat) => {
    if(chat.uid == chatId && chat.admins.includes(adminId)) {
      chat.description = description
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

function consumeChatInvite(userId, inviteId) {
  console.log(chatInvites, inviteId)
  if(chatInvites[inviteId]){
    let chatId = chatInvites[inviteId].chatId
    addMember(userId, chatId)
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
    socket.emit("send username", userData.username)
    for(chatId of userData.chats) {
      //send all chatData to client
      let data = getChatData(chatId)
      console.log(data)
      socket.emit("load chat", data)

      socket.join(chatId) //todo leave rooms on kickmember, join on add member
    }

    socket.on("create chat", (chatName) => {
      let data = generateChatData(userData.uid, chatName)
      database.users.joinChat(userData.uid, data.uid)
      socket.join(data.uid)
      socket.emit("load chat", data)
    })

    socket.on("send message", (message, chatId) => {
      let messageData = {username: userData.username, timestamp: getCurrentTime(), message: message}
      addMessage(messageData, chatId)
      socket.to(chatId).emit("receive message", messageData, chatId)
    })

    socket.on("generate invite", (chatData) => {
      let inviteId = generateChatInviteId(userData.uid, chatData.uid, 1)
      socket.emit("receive invite id", chatData, inviteId)
    })

    socket.on("use invite id", (inviteId) => {
      let chatId = consumeChatInvite(userData.uid, inviteId)
      if(chatId == false) {
        return //later emit error to show "invite id not valid"
      }
      let data = getChatData(chatId)
      socket.join(chatId)
      socket.emit("load chat", data)
    })
  })  

}

module.exports = funcs