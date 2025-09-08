// models/TradeItem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const TradeTransaction = require('./TradeTransaction');
const Item = require('./Item');

const TradeItem = sequelize.define('TradeItem', {
    transactionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: TradeTransaction,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
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
    }
}, {
    timestamps: false,
    tableName: 'TradeItems'
});

// Associations
TradeTransaction.belongsToMany(Item, {
    through: TradeItem,
    foreignKey: 'transactionId',
    otherKey: 'itemId',
    as: 'Items'
});

Item.belongsToMany(TradeTransaction, {
    through: TradeItem,
    foreignKey: 'itemId',
    otherKey: 'transactionId',
    as: 'Trades'
});

// Optional direct relations
TradeTransaction.hasMany(TradeItem, { foreignKey: 'transactionId' });
Item.hasMany(TradeItem, { foreignKey: 'itemId' });
TradeItem.belongsTo(TradeTransaction, { foreignKey: 'transactionId' });
TradeItem.belongsTo(Item, { foreignKey: 'itemId' });

module.exports = TradeItem;
