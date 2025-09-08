const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Item = require('./Item');

const ItemCategory = sequelize.define('ItemCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Item,
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  categoryName: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { timestamps: true });

Item.hasMany(ItemCategory, { foreignKey: 'itemId' });
ItemCategory.belongsTo(Item, { foreignKey: 'itemId' });

module.exports = ItemCategory;
