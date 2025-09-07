const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');


const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true 
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  Location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ProfilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  RatingScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.0
  },
  Contact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  IDcard: {type: DataTypes.STRING,
    allowNull: true
  }
}, {timestamps: true});
  

module.exports = User;