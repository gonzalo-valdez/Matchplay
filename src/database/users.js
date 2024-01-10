let users = []

const { Snowflake } = require('nodejs-snowflake');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt')

//let userdatabase = [{uid: 1, username: 'a', password: 'a', chats: []}]
const { MongoClient } = require('mongodb')
url = 'mongodb://localhost:27017'
const client = new MongoClient('mongodb://localhost:27017');

async function connect() {
  await client.connect();
}


const key = 'c578d4aa7e64585emd9ef8ddf54e57f9020j2eaf4443770e9b29180599e39c9b'
users.verifyTokenRouter = function(req, res, next) {
  const token = req.cookies.token
  if (!token) {
    return res.redirect("/");
  }
  
  jwt.verify(token, key, async (err, decodedData) => {
    let userData = await users.getUserFromUsername(decodedData.username)
    if (err || !userData) {
        res.clearCookie('token');
        return res.redirect("/");
    }

    // store the user information in res
    res.userData = {username: decodedData.username};
    next();
  });
}

users.verifyToken = async function(token) {
    return jwt.verify(token, key, async (err, decodedData) => {
        let userData = await users.getUserFromId(decodedData.uid);
        if (err || !userData) {
           return false
        }

        return userData
    })
}

users.signToken = function(data){
    return jwt.sign(data, key);
}

users.newUser = async function(username, password){
    try {
        await connect();

        let usersCollection = client.db('matchplay').collection('users');

        const hash = await bcrypt.hash(password, 10);
        uid = new Snowflake()

        let userData = {
            uid: uid.getUniqueID().toString(),
            username: username,
            password: hash,
            chats: [],
        };

        await usersCollection.insertOne(userData);
        return userData;

    } catch (error) {
        console.error('Error creating new user:', error);
        throw error; 

    }
};

users.joinChat = async function (userId, chatId) {
    await connect();
  
    try {
      let usersCollection = client.db('matchplay').collection('users');
  
      // Update the user document to add the chatId to the chats array
      await usersCollection.updateOne({ uid: userId }, { $push: { chats: chatId } });
    } catch (error) {
      console.error('Error joining chat:', error);
      throw error;
    }
  };

users.leaveChat = async function(userId, chatId) {
    try {
        let usersCollection = client.db('matchplay').collection('users');

        // Find the user by userId
        const user = await usersCollection.findOne({ uid: userId });

        if (user) {
            // Remove chatId from the chats array
            const updatedChats = user.chats.filter((id) => id !== chatId);

            // Update the user document with the modified chats array
            await usersCollection.updateOne({ uid: userId }, { $set: { chats: updatedChats } });

            return true;
        }

        return false;
    } catch (error) {
        console.error('Error leaving chat:', error);
        return false;
    }
}


users.getUserFromId = async function (uid) {
    try {
        // Get reference to the users collection
        let usersCollection = client.db('matchplay').collection('users');

        // Find user by uid
        let userData = await usersCollection.findOne({ uid: uid });

        return userData;
    } catch (error) {
        console.error('Error getting user by ID:', error);
        throw error; // Rethrow the error for handling in the calling code
    }
};

users.getUserFromUsername = async function (username) {
    try {
        // Get reference to the users collection
        let usersCollection = client.db('matchplay').collection('users');

        // Find user by username
        let userData = await usersCollection.findOne({ username: username });

        return userData;
    } catch (error) {
        console.error('Error getting user by username:', error);
        throw error; // Rethrow the error for handling in the calling code
    }
};


module.exports = users