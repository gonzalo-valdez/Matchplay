const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(bodyParser.json());
const secretKey = 'c578d4aa7e64585eed9ef8ddf54e57f902022eaf4443770e9b29180599e39c9b'

// Replace with your database logic for user management
const users = [{username: "gonzalo", password: "123"}];

function verifyToken(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        // Return a JSON error response with a redirection URL if the token is missing
      return res.status(401).json({ message: 'Authentication required', redirect: '/index.html' });
    }
    
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        // Return a JSON error response with a redirection URL if the token is invalid
        return res.status(401).json({ message: 'Invalid token', redirect: '/index.html' });
      }
        if(!users.find((u) => u.username === decoded.username)){
            return res.status(401).json({ message: 'Invalid token', redirect: '/index.html' });
        }
      // If the token is valid, you can store the user information in the request object
      req.user = decoded;
      next();
    });
  }

app.use(express.static(path.join(__dirname, 'public')));
//HTML URLS

app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/public/chat.html');
});

app.get('/index.html', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


//GETS 

app.get('/userProfile', verifyToken, (req, res) => {
    res.json(req.user);
});


//POSTS

app.post('/register', (req, res) => {
    const { username, password1, password2} = req.body;
    // Add user to your database (for simplicity, users are stored in memory)
    if(username.replace(/ /g, '') == "") {
        res.status(401).json({ message: 'Please enter a valid username' });
        return;
    }
    if(password1 != password2) {
        res.status(401).json({message: "The passwords do not match"});
        return;
    }
    if (users.find((u) => u.username === username)) {
        res.status(401).json({ message: 'Username already in use' });
    }
    users.push({ username: username, password: password1 });
    res.json({ message: 'User registered successfully' });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Check if the user exists in your database
    const user = users.find((u) => u.username === username && u.password === password);
    if (user) {
        // Create a JWT token and send it as a response
        const token = jwt.sign({ username }, secretKey);
        res.json({token });
    } else {
        res.status(401).json({ message: 'Authentication failed' });
    }
});




//
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
