const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Item = require('./Item');

const ItemPicture = sequelize.define('ItemPicture', {
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
    imageLink: {
        type: DataTypes.STRING, 
        allowNull: false
    }
}, { timestamps: true });

Item.hasMany(ItemPicture, { foreignKey: 'itemId' });
ItemPicture.belongsTo(Item, { foreignKey: 'itemId' });

module.exports = ItemPicture;
