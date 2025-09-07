const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User'); // import the User model

const InterestedCategory = sequelize.define('InterestedCategory', {
  ID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'email'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  CategoryName: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { timestamps: true });

// Set up association
User.hasMany(InterestedCategory, { foreignKey: 'email', as: 'interests' });
InterestedCategory.belongsTo(User, { foreignKey: 'email', as: 'user' });

module.exports = InterestedCategory;