// models/WatchedItem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Item = require('./Item');

const WatchedItem = sequelize.define('WatchedItem', {
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: Item,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    emailAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
            model: User,
            key: 'email'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        validate: {
            isEmail: true
        }
    },
    dateTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false, // we’re using our own dateTime
    tableName: 'WatchedItems'
});

// Associations (many-to-many with extra column via through model)
User.belongsToMany(Item, {
    through: WatchedItem,
    foreignKey: 'emailAddress',
    otherKey: 'itemId',
    as: 'WatchedItems'
});

Item.belongsToMany(User, {
    through: WatchedItem,
    foreignKey: 'itemId',
    otherKey: 'emailAddress',
    as: 'Watchers'
});

// Optional: direct hasMany for convenience
User.hasMany(WatchedItem, { foreignKey: 'emailAddress' });
Item.hasMany(WatchedItem, { foreignKey: 'itemId' });
WatchedItem.belongsTo(User, { foreignKey: 'emailAddress' });
WatchedItem.belongsTo(Item, { foreignKey: 'itemId' });

module.exports = WatchedItem;
