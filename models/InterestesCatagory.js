const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
// REMOVE THIS: const User = require('./User'); // ← This causes circular dependency

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
      model: 'Users', // ← Use table name string instead of model reference
      key: 'email'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  CategoryName: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'interested_categories' // Explicit table name
});

module.exports = InterestedCategory;