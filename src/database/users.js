let users = []

const { Snowflake } = require('nodejs-snowflake');
var jwt = require('jsonwebtoken');

let userdatabase = []


const key = 'c578d4aa7e64585emd9ef8ddf54e57f9020j2eaf4443770e9b29180599e39c9b'
users.verifyToken = function(req, res, next) {
  const token = req.cookies.token
  if (!token) {
    return res.redirect("/");
  }
  
  jwt.verify(token, key, (err, decodedData) => {
    if (err || !users.getUserFromUsername(decodedData.username)) {
        res.clearCookie('token');
        return res.redirect("/");
    }

    // store the user information in res
    res.userData = {username: decodedData.username};
    next();
  });
}

users.signToken = function(data){
    return jwt.sign(data, key);
}

users.newUser = function(username, password){
    let uid = new Snowflake();
    let data = {'uid': uid.getUniqueID(), 'username': username, 'password': password} //replace with hash
    userdatabase.push(data)
    return data
}


users.getUserFromId = function(uid){
    userdatabase.find((userData) => {
        if(userData.uid == uid){
            return userData
        }
    })
    return false
}

users.getUserFromUsername = function(username) {
    return userdatabase.find((userData) => {       
        if(userData.username == username){  
            return userData
        }
    })
}


module.exports = users