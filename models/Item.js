const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Item = sequelize.define('Item', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    priceRange: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ownerEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: User,
            key: 'email'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
}, { timestamps: true });

// Associations
User.hasMany(Item, { foreignKey: 'ownerEmail' });
Item.belongsTo(User, { foreignKey: 'ownerEmail' });

module.exports = Item;
