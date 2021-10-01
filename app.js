const express = require('express');
const app = express();

const middleware = require('./middleware');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('./database');
const session = require('express-session');
const compression = require('compression');

require('dotenv').config()

const port= process.env.PORT;

const server = app.listen(port, () =>
  console.log('Server listening on port ' + port)
);
const io = require('socket.io')(server);

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression())
app.use(
  session({
    secret: 'bbq chips',
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
);

// Routes
const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');
const postRoute = require('./routes/postRoutes');
const profileRoute = require('./routes/profileRoutes');
const userRoute = require('./routes/api/users');
const messageRoute = require('./routes/messageRoutes');
const searchRoute = require('./routes/searchRoutes');
const chatRoute = require('./routes/api/chat');
const message = require('./routes/api/messages');
const notificationRoute = require('./routes/notificationsRoutes');
const notification = require('./routes/api/notifications');
// Api routes
const postsApiRoute = require('./routes/api/posts');
app.use('/notifications', middleware.requireLogin,notificationRoute);
app.use('/api/notifications', middleware.requireLogin,notification);
app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/posts', middleware.requireLogin, postRoute);
app.use('/profile', middleware.requireLogin, profileRoute);
app.use('/api/users', middleware.requireLogin, userRoute);
app.use('/api/posts', middleware.requireLogin, postsApiRoute);
app.use('/search', middleware.requireLogin, searchRoute);
app.use('/messages', middleware.requireLogin, messageRoute);
app.use('/api/chat', middleware.requireLogin, chatRoute);
app.use('/api/messages', middleware.requireLogin, message);

app.get('/', middleware.requireLogin, (req, res, next) => {
  var payload = {
    pageTitle: 'Home',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };
  res.status(200).render('home', payload);
});

io.on('connection', (socket) => {
  socket.on('set-up', (userLoggedIn) => {
    socket.join(userLoggedIn._id);
    socket.emit('connected');
  });

  socket.on('join room', (room) => {
    socket.join(room);
  });
  socket.on('typing', (room) => {
    socket.in(room).emit('typing');
  });
  socket.on('sendmessage', (data) => {});
  socket.on('stop-typing', (room) => {
    socket.in(room).emit('stop-typing');
  });
  socket.on('new message', (data) => {
    const chat = data.chat.users;
    chat.forEach((room) => {
      socket.in(room._id).emit('message received', data);
    });
  });
});
//test thoi dc chua