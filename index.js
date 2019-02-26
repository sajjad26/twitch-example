const express = require('express');
const moment = require('moment');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const config = require('./config');
const { 
  loginTwitchUser, 
  getTwitchUser, 
  getTwitchStreamer, 
  getAllUsers, 
  isLoggedIn,
  checkUserMiddleware,
  updateUserStreamer,
  getChannelPosts
} = require('./repos/users');
const database = require('./database');

const port = process.env.PORT || 4000;
const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use('/static', express.static(__dirname + '/static'));

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
  const channelPosts = await getChannelPosts(req, user.streamer_id);
  console.log(channelPosts);
  /** WebSocket */
  // let socket = sockets[user.id];
  // if(!socket){
  //   console.log('new socket');
  //   socket = new WebSocket('wss://pubsub-edge.twitch.tv');
  //   sockets[user.id] = socket;
  //   socket.onopen = function (event) {
  //     console.log('socket openend', event.type);
  //     setInterval(() => {
  //       socket.send(JSON.stringify({
  //         type: 'PING'
  //       }));
  //     }, 1000 * 5);
  //   };
  //   socket.onerror = function (error) {
  //     console.log('error on socket', error);
  //   };
  //   socket.onmessage = function (event) {
  //     console.log('message on socket', event.type, event.data);
  //   };
  //   socket.onclose = function () {
  //     console.log('close socket');
  //   };
  // }
  return res.render(`stream`, {
    user: user,
    channelPosts: channelPosts,
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
    user.streamer = streamer.login;
    user.streamer_id = streamer.id;
    await user.save();
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

database.sync().then(() => {
  app.listen(port, () => console.log(`Server is listening on ${port}`));
});