const Sequelize = require('sequelize');

const sequelize = new Sequelize('streamlabexample', 'streamlabsuser', 'testing', {
  host: 'localhost',
  dialect: 'sqlite',
  operatorsAliases: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false,
  storage: './database/database.sqlite'
});

module.exports = sequelize;