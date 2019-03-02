const express = require('express');
const moment = require('moment');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  path: '/socket.io',
  serveClient: true,
});
const config = require('./config');
const { 
  loginTwitchUser, 
  getTwitchUser, 
  getTwitchStreamer, 
  getAllUsers, 
  isLoggedIn,
  checkUserMiddleware,
  updateUserStreamer,
  getChannelPosts,
  subscribeToChannelWebHooks,
  unsubscribeUserFollowedWebHook,
  generateTwitchAppToken
} = require('./repos/users');
const database = require('./database');

const port = process.env.PORT || 4000;
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/static'));

// const sockets = [];

app.get('/', async (req, res) => {
  const users = await getAllUsers();
  const data = {
    user: null,
    users: users,
    moment: moment,
    redirectUrl: config.redirect_uri,
    clientId: config.client_id,
    loggedIn: isLoggedIn(req)
  };
  return res.render('index', data);
});

app.get('/authorize', async (req, res) => {
  const code = req.query.code;
  if(!code){
    return res.redirect('/');
  }
  try{
    const user = await loginTwitchUser(code);
    res.cookie('access_token', user.access_token, { maxAge: (1000 * 60 * 60 * 24) });
    return res.redirect('/stream');
  }catch(err){
    return res.json(err);
  }
});

app.get('/stream', checkUserMiddleware, async (req, res) => {
  const user = res.locals.user;
  if(!user.streamer){
    return res.redirect('/add-streamer');
  }
  return res.render(`stream`, {
    user: user,
    access_token: res.locals.access_token
  });
});

app.get('/add-streamer', checkUserMiddleware, async (req, res) => {
  const user = res.locals.user;
  return res.render('addStreamer', {
    user: user
  });
});

app.post('/add-streamer', checkUserMiddleware, async (req, res) => {
  const user = res.locals.user;
  const streamerId = req.body.streamer;
  if (!streamerId){
    throw new Error('not streamer specified');
  }
  try{
    const streamer = await getTwitchStreamer(streamerId);
    const oldStreamerId = user.streamer_id;
    user.streamer = streamer.login;
    user.streamer_id = streamer.id;
    await user.save();
    if(oldStreamerId){
      // remove old webhook for streamer
      await unsubscribeUserFollowedWebHook(oldStreamerId);
    }
    // now subscribe to this user events webhooks
    const subscribed = await subscribeToChannelWebHooks(streamer);
    return res.json({
      data: user,
      status: 'success'
    });
  }catch(err){
    const error = (err.response && err.response.data) ? err.response.data : { error: err.toString() };
    res.json(Object.assign(error, {
      status: 'failure'
    }));
  }
});

/** Web Hooks Verify */
app.get('/api/webhooks/user-followed-channel', function (req, res) {
  // console.log('in user followd api');
  // console.log(req.query);
  // res.sendStatus(202);
  return res.send(req.query['hub.challenge']);
});

app.post('/api/webhooks/user-followed-channel', function(req, res){
  res.sendStatus(202);
  const notif = (req.body.data && req.body.data.length) ? req.body.data.pop() : null;
  if(notif){
    // then do something with it
    // emit this to clients subscribed
    const room = `channels/${notif.to_id}`;
    io.to(room).emit('userFollowed', {
      data: notif
    });
  } 
});


database.sync().then(() => {
  generateTwitchAppToken().then((token) => {
    http.listen(port, () => console.log(`Server is listening on ${port}`));
    // Setup socketio
    io.on('connection', function (socket) {
      console.log('a user connected');
      socket.on('joinRoom', function (data) {
        var room = data.room;
        socket.join(room);
      });
      socket.on('leaveRoom', function (data) {
        var room = data.room;
        socket.leave(room);
      });
    });
  }).catch(err => {
    console.log(err.toString());
  });
});