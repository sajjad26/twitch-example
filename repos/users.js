const axios = require('axios');
const config = require('../config');
const User = require('../database/models/user');

module.exports.loginTwitchUser = async (code) => {
  try {
    const data = await this.authorizeTwitchUser(code);
    const user = await this.getTwitchUser(data.access_token);
    let dbUser = await User.findOne({
      where: { email: user.email }
    });
    if(!dbUser){
      dbUser = await User.create({
        access_token: data.access_token,
        _id: user._id,
        email: user.email,
        name: user.display_name,
        logo: user.logo
      });
    }else{
      dbUser.access_token = data.access_token;
      dbUser.email = user.email;
      dbUser.name = user.display_name;
      dbUser.logo = user.logo;
      await dbUser.save();
    }
    return dbUser;
  } catch (err) {
    const error = (err.response && err.response.data) ? err.response.data : { err: err.toString() };
    return error;
  }
}

module.exports.authorizeTwitchUser = async (code) => {
  const url = `https://id.twitch.tv/oauth2/token?client_id=${config.client_id}&client_secret=${config.client_secret}&code=${code}&grant_type=${config.grant_type}&redirect_uri=${config.redirect_uri}`;
  const res = await axios.post(url);
  const data = res.data;
  if (!data.access_token) {
    throw new Error(data.message || 'Authorization failed');
  }
  return data;
}

module.exports.getTwitchUser = async (token) => {
  const url = `https://api.twitch.tv/kraken/user`;
  const headers = {
    "Authorization": `OAuth ${token}`,
    "Client-ID": config.client_id,
    "Accept": "application/vnd.twitchtv.v5+json"
  };
  const res = await axios.get(url, {
    headers: headers
  });
  const data = res.data;
  if (!data._id) {
    throw new Error(data.message || 'User not found');
  }
  return data;
}

module.exports.getTwitchStreamer = async (id) => {
  const url = `https://api.twitch.tv/helix/users?login=${id}`;
  const headers = {
    "Client-ID": config.client_id,
    "Accept": "application/vnd.twitchtv.v5+json"
  };
  const res = await axios.get(url, {
    headers: headers
  });
  const data = (res.data && res.data.data) ? res.data.data : [{}];
  const user = data.pop();
  if (user.login != id) {
    throw new Error(data.message || 'User not found');
  }
  return user;
}

module.exports.getUser = async (access_token) => {
  let dbUser = await User.findOne({
    where: { access_token: access_token }
  });
  return dbUser;
}

module.exports.getAllUsers = async () => {
  return User.findAll();
}

module.exports.getAccessToken = (req) => {
  const access_token = req.cookies['access_token'] || null;
  return access_token;
}

module.exports.isLoggedIn = (req) => {
  return this.getAccessToken(req) ? true : false;
}

module.exports.checkUserMiddleware = async (req, res, next) => {
  const access_token = this.getAccessToken(req);
  if(access_token){
    const user = await this.getUser(access_token);
    res.locals.user = user;
    res.locals.access_token = access_token;
    return next();
  }
  return res.json({
    status: 'unauthorized',
    'message': 'You are unauthorized'
  });
};

module.exports.updateUserStreamer = async (user, streamer) => {
  user.streamer = streamer;
  return user.update();
};

module.exports.getChannelPosts = async (req, channelId) => {
  const url = `https://api.twitch.tv/kraken/feed/${channelId}/posts`;
  const params = {
    limit: 10
  };
  const headers = {
    "Authorization": `OAuth ${this.getAccessToken(req)}`,
    "Client-ID": config.client_id,
    "Accept": "application/vnd.twitchtv.v5+json"
  };
  console.log(url, params, headers);
  try{
    const res = await axios.get(url, {
      params: params,
      headers: headers
    });
    return res.data;
  }catch(err){
    console.log(err.toString());
    return [];
  }
};