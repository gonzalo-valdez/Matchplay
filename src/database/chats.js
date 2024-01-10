const { Snowflake } = require('nodejs-snowflake');
const { MongoClient } = require('mongodb');
const userdatabase = require('./users')
const databaseUrl = 'mongodb://localhost:27017';
const client = new MongoClient(databaseUrl)

const chatInvites = {};

async function connect() {
  await client.connect();
}

async function generateChatData(userData, chatName) {
  const uid = new Snowflake().getUniqueID().toString();
  const chatData = {
    uid: uid,
    chatName: chatName,
    description: "",
    members: {},
    admins: [userData.uid],
    messages: [],
    founder: userData.uid
  };
  chatData.members[userData.uid] = userData.username;

  await connect();
  const chatsCollection = client.db('matchplay').collection('chats');
  await chatsCollection.insertOne(chatData);

  return chatData;
}

async function getChatData(chatId) {
  await connect();
  const chatsCollection = client.db('matchplay').collection('chats');
  return await chatsCollection.findOne({ uid: chatId });
}

async function deleteChat(chatId) {
  await connect();
  const chatsCollection = client.db('matchplay').collection('chats');
  const result = await chatsCollection.deleteOne({ uid: chatId });
  return result.deletedCount > 0;
}

async function leaveChat(userId, chatId) {
    const chat = await getChatData(chatId);
    if (chat) {
        await userdatabase.leaveChat(userId, chatId);
        delete chat.members[userId];
        
        if (userId in chat.admins) {
            delete chat.admins[userId];
        }

        if (Object.keys(chat.members).length <= 0) {
            await deleteChat(chatId);
        } else {
            await connect();
            const chatsCollection = client.db('matchplay').collection('chats');
            await chatsCollection.updateOne({ uid: chatId }, { $set: chat });
        }
    }
}

async function addMember(userData, chatId) {
    let chat = await getChatData(chatId);
    if (chat) {
        chat.members[userData.uid] = userData.username;
        await userdatabase.joinChat(userData.uid, chatId);
        // Update the chat data in the database
        await connect();
        const chatsCollection = client.db('matchplay').collection('chats');
        await chatsCollection.updateOne({ uid: chatId }, { $set: chat });
        return true;
    }
    return false;
}
async function generateChatInviteId(adminId, chatId, uses) {
    let data = await getChatData(chatId);
    if (!data) return false;
    if (!data.admins.includes(adminId)) return false;
  
    let inviteData = { userId: adminId, chatId: chatId, uses: uses };
    let sf = new Snowflake();
    let uid = sf.getUniqueID().toString();
    chatInvites[uid] = inviteData;
    return uid;
}
  
function consumeChatInvite(userData, inviteId) {
    if (chatInvites[inviteId]) {
        let chatId = chatInvites[inviteId].chatId;
        addMember(userData, chatId);
        chatInvites[inviteId].uses = chatInvites[inviteId].uses - 1;
        if (chatInvites[inviteId].uses <= 0) {
            delete chatInvites[inviteId];
        }
        return chatId;
    }
    return false;
}
  
async function addMessage(messageData, chatId) {
    await connect();
    const chatsCollection = client.db('matchplay').collection('chats');
    await chatsCollection.updateOne({ uid: chatId }, { $push: { messages: messageData } });
    return true;
  }

module.exports = {
  generateChatData,
  getChatData,
  deleteChat,
  leaveChat,
  addMessage,
  consumeChatInvite,
  generateChatInviteId
};
