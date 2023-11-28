const { Snowflake } = require('nodejs-snowflake');
const cookie = require("cookie")
const database = require('../database')

let chatData = []

function generateChatData(username, chatName) {
  let uid = new Snowflake();

  let data = {'uid': uid.getUniqueID(), 'chatName': chatName, 'description': "", 
    'members': [username], 'admins': [username], 'messages': [], 'founder': username,
  };
  chatData.push(data);
  return data;
}



function promoteMember(adminUser, memberUser, chatid) {
  chatData.find((chat) => {
    if(chat.uid == chatid && chat.admins.includes(adminUser) && chat.members.includes(memberUser)) {
      chat.admins.append(memberUser)
    }
  })
}

function kickMember(adminUser, memberUser, chatid) {
  chatData.find((chat) => {
    if(chat.uid == chatid && chat.admins.includes(adminUser) && chat.members.includes(memberUser) && chat.founder != memberUser) {
      chat.members.splice(chat.members.indexOf(memberUser), 1)
    }
  })
}

function addMember(username, chatid) {
  chatData.find((chat) => {
    if(chat.uid == chatid) {
      chat.members.append(username)
      return true
    }
  })
  return false
}

function updateDescription(adminUser, chatid, description) {
  if(verifyAdmin(adminUser)) {
    chatData.find((chat) => {
      if(chat.uid == chatid) {
        chat.description = description
      }
    })
  }
}


let chatInvites = []
function generateChatInviteId(adminUser, chatid, uses) {
  let inviteData = {'username': adminUser,'chatid': chatid, 'uses': uses}
  let uid = new Snowflake()
  chatInvites[uid.getUniqueID()] = inviteData
  return uid.getUniqueID()
}

function consumeChatInvite(username, inviteid) {
  if(chatInvites[inviteid]){
    addMember(username, chatInvites[inviteid].chatid)
    chatInvites[inviteid].uses = chatInvites[inviteid].uses - 1
    if(chatInvites[inviteid].uses <= 0) {
      chatInvites.delete(inviteid)
    }
  }
}


let funcs = []
funcs.initialize = function(server) {
  var io = require('socket.io')(server)

  io.on("connection", (socket) => {
    let userToken = cookie.parse(socket.handshake.headers.cookie).token
    let userData = database.users.verifyToken(userToken)
    console.log(userData)
  })  

}

module.exports = funcs