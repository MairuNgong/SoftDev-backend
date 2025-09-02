const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');


const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
}, {timestamps: true});
  

module.exports = User;