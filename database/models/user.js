const Sequelize = require('sequelize');
const sequelize = require('../index');

const User = sequelize.define('user', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  _id: Sequelize.INTEGER,
  email: {
    type: Sequelize.STRING,
    validate: {
      isEmail: true
    }
  },
  name: Sequelize.STRING,
  access_token: Sequelize.STRING,
  logo: Sequelize.STRING,
  streamer: Sequelize.STRING,
  streamer_id: Sequelize.INTEGER
}, {
  tableName: 'users'
});

module.exports = User;