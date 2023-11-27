var express = require('express');
var router = express.Router();
const { Snowflake } = require('nodejs-snowflake');

router.get('/', function(req, res, next) {
  res.render('chat', {username: res.userData.username});
});


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

function useInvite(username, inviteid) {
  if(chatInvites[inviteid]){
    addMember(username, chatInvites[inviteid].chatid)
    chatInvites[inviteid].uses = chatInvites[inviteid].uses - 1
    if(chatInvites[inviteid].uses <= 0) {
      chatInvites.delete(inviteid)
    }
  }
}

router.post('/updateDescription', (req, res) => {
  console.log(req.headers)
})

router.post('/createChat', (req, res) => {
  let data = generateChatData(res.userData.username, req.headers.chatName)
})




module.exports = router;
