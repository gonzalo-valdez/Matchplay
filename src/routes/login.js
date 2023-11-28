var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var database = require('../database')



router.post('/register', (req, res) => {
    const { username, password1, password2} = req.body;

    if(username.replace(/ /g, '') == "") {
        res.status(401).json({ message: 'Please enter a valid username' });
        return;
    }
    if(password1 != password2) {
        res.status(401).json({message: "The passwords do not match"});
        return;
    }
    if (database.users.getUserFromUsername(username)) {
        res.status(401).json({ message: 'Username already in use' });
    }
    database.users.newUser(username, password1)
    res.json({ message: 'User registered successfully' });
});
  
router.post('/', (req, res) => { //login
    const { username, password } = req.body;
    let userData = database.users.getUserFromUsername(username);
     //replace with hash check
    if (userData && userData.password == password) {
        // Create a JWT token
        console.log(userData.uid)
        const token = database.users.signToken({'uid': userData.uid.toString(), 'username': userData.username})
        res.cookie('token', token, {httpOnly: true});
        res.json({ success: true, message: 'Authentication successful' });
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