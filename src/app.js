var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var cookie = require('cookie-parser');

var indexRouter = require('./routes/index');
var chatRouter = require('./routes/chat');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/chat', verifyToken, chatRouter);

app.locals.title = "Matchplay"



app.use(bodyParser.json());
const key = 'c578d4aa7e64585eed9ef8ddf54e57f902022eaf4443770e9b29180599e39c9b'

// Replace with your database logic for user management
const users = [{username: "gonzalo", password: "123"}];


function verifyToken(req, res, next) {
    const token = req.cookies.token
    if (!token) {
        // Return a JSON error response with a redirection URL if the token is missing
      return res.redirect("/");
    }
    
    jwt.verify(token, key, (err, decoded) => {
      if (err) {
        // Return a JSON error response with a redirection URL if the token is invalid
        return res.redirect("/");
      }
        if(!users.find((u) => u.username === decoded.username)){
          return res.redirect("/");
        }
      // If the token is valid, you can store the user information in the request object
      res.userData = {username: decoded.username};
      next();
    });
  }






app.post('/register', (req, res) => {
  const { username, password1, password2} = req.body;

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
  const user = users.find((u) => u.username === username && u.password === password);
  if (user) {
      // Create a JWT token
      const token = jwt.sign({ username }, key);
      res.cookie('token', token, {httpOnly: true});
      res.json({ success: true, message: 'Authentication successful' });
  } else {
      res.status(401).json({ message: 'Authentication failed' });
  }
});

app.post("/logout", (req, res) => {
  //Clear Cookies
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});


module.exports = app;
