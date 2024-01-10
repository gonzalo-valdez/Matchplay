var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var database = require('../database')
var bcrypt = require('bcrypt')


router.post('/register', async (req, res) => {
    const { username, password1, password2} = req.body;

    if(username.replace(/ /g, '') == "") {
        res.status(401).json({ message: 'Please enter a valid username' });
        return;
    }
    if(password1 != password2) {
        res.status(401).json({message: "The passwords do not match"});
        return;
    }
    let userData = await database.users.getUserFromUsername(username)

    if(userData){
        res.status(401).json({ message: 'Username already in use' });
        return
    }


    await database.users.newUser(username, password1)
    .then(data => {
        res.json({ message: `User ${data.username} registered successfully` })
    })
    
});
  
router.post('/', async (req, res) => { //login
    const { username, password } = req.body;
    let userData = await database.users.getUserFromUsername(username);
    if (userData) {
        bcrypt.compare(password, userData.password)
        .then(da => {
             // Create a JWT token
            const token = database.users.signToken({'uid': userData.uid, 'username': userData.username})
            res.cookie('token', token, {httpOnly: true});
            res.json({ success: true, message: 'Authentication successful' });
        })
    } else {
        res.status(401).json({ message: 'Authentication failed' });
    }
});

router.post("/logout", (req, res) => {
    //Clear Cookies
    res.clearCookie('token');
    res.json({ message: 'Logout successful' });
});






  
module.exports = router;