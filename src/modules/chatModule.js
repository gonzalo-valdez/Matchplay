const { Snowflake } = require('nodejs-snowflake');
const cookie = require("cookie");
const database = require('../database');

let socketList = [];

const initialize = function(server) {
  var io = require('socket.io')(server);

  io.on("connection", async (socket) => {
    let userToken = cookie.parse(socket.handshake.headers.cookie).token;
    let userData = await database.users.verifyToken(userToken);
    if (!userData) {
      return;
    }
    socket.emit("send userData", { username: userData.username, userId: userData.uid });
    for (chatId of userData.chats) {
      // Send all chatData to the client
      let data = await database.chats.getChatData(chatId);
      socket.emit("load chat", data);

      joinRoom(userData.uid, socket, chatId);
    }

    socket.on("create chat", async (chatName) => {
      let data = await database.chats.generateChatData(userData, chatName);
      await database.users.joinChat(userData.uid, data.uid);
      joinRoom(userData.uid, socket, data.uid);
      socket.emit("load chat", data);
    });

    socket.on("send message", async (message, chatId) => {
      let userData = await database.users.verifyToken(userToken);
      let chatData = await database.chats.getChatData(chatId);
      if (!chatData.members[userData.uid]) {
        return;
      }
  
      let messageData = { username: userData.username, timestamp: getCurrentTime(), message: message };
      await database.chats.addMessage(messageData, chatId);
      socket.to(chatId).emit("receive message", messageData, chatId);
    });

    socket.on("generate invite", async (chatData) => {
      let inviteId = await database.chats.generateChatInviteId(userData.uid, chatData.uid, 1);
      socket.emit("receive invite id", chatData, inviteId);
    });

    socket.on("use invite id", async (inviteId) => {
      let userData = await database.users.verifyToken(userToken);
      let chatId = await database.chats.consumeChatInvite(userData, inviteId);
      if (chatId == false) {
        return; // Later emit error to show "invite id not valid"
      }
      let data = await database.chats.getChatData(chatId);

      let joinedMsg = { username: userData.username, message: `${userData.username} has joined the chat.`, timestamp: getCurrentTime(), joinedleft: true };
      socket.to(chatId).emit("receive user joinedleft", joinedMsg, chatId);
      await database.chats.addMessage(joinedMsg, chatId);

      joinRoom(userData.uid, socket, chatId);
      socket.emit("load chat", data);
    });

    socket.on("leave chat", async (chatData) => {
      let chatId = chatData.uid;
      let userData = await database.users.verifyToken(userToken);
      if (!userData.chats.find((id) => id == chatId)) {
        socket.emit("leave chat", chatId);
        return;
      }
      await database.chats.leaveChat(userData.uid, chatId);
      socket.leave(chatId);
      socket.emit("leave chat", chatId);

      let joinedMsg = { username: userData.username, message: `${userData.username} has left the chat.`, timestamp: getCurrentTime(), joinedleft: true };
      socket.to(chatId).emit("receive user joinedleft", joinedMsg, chatId);
    });

    socket.on("kick member", async (memberId, chatId) => {
      let userData = await database.users.verifyToken(userToken);
      let chatData = await database.chats.getChatData(chatId);
      if (!chatData.admins.find((id) => id == userData.uid) || (chatData.admins.find((id) => id == memberId) && chatData.founder != userData.uid)) {
        // If the user is not an admin or trying to kick an admin but isn't the founder, return
        return;
      }
      let memberData = await database.users.getUserFromId(memberId);
      await database.chats.leaveChat(memberId, chatId);
      kickFromRoom(memberId, chatId);

      let leftMsg = { username: memberData.username, message: `${memberData.username} has been kicked.`, timestamp: getCurrentTime(), joinedleft: true };
      io.to(chatId).emit("receive user joinedleft", leftMsg, chatId);
      await database.chats.addMessage(leftMsg, chatId);
    });
  });
};

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function joinRoom(userId, socket, chatId) {
  if (!socketList[chatId]) {
    socketList[chatId] = [];
  }
  socket.join(chatId);
  socketList[chatId].push({ userId: userId, socket: socket });
}

function kickFromRoom(userId, chatId) {
  if (!socketList[chatId]) return;
  let data = socketList[chatId];
  for (let i = 0; i < data.length; i++) {
    if (data[i].userId == userId) {
      let kickedMsg = { username: "You", message: `You have been kicked.`, timestamp: getCurrentTime(), joinedleft: true };
      data[i].socket.emit("receive user joinedleft", kickedMsg, chatId);
      data[i].socket.leave(chatId);
      delete data[i];
    }
  }
}

module.exports = {initialize: initialize};
