// models/TradeTransaction.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const TradeTransaction = sequelize.define('TradeTransaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    offerEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: User,
            key: 'email'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        validate: { isEmail: true }
    },

    accepterEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: User,
            key: 'email'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        validate: { isEmail: true }
    },

    // Only 3 possible values
    status: {
        type: DataTypes.ENUM('Offering', 'Matching', 'Complete'),
        allowNull: false,
        defaultValue: 'Offering'
    },

    dateTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },

    // Money amounts (use DECIMAL to avoid float rounding issues)
    offerMoney: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: { min: 0 }
    },

    requestMoney: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: { min: 0 }
    },

    isOffererIDCard: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    isAccepterIDCard: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    timestamps: false,              // you provided your own dateTime field
    tableName: 'TradeTransactions',
    indexes: [
        { fields: ['offerEmail'] },
        { fields: ['accepterEmail'] },
        { fields: ['status'] }
    ],
    // optional safety: prevent self-trades
    validate: {
        differentParties() {
            if (this.offerEmail === this.accepterEmail) {
                throw new Error('offerEmail and accepterEmail must be different.');
            }
        }
    }
});

// Associations
User.hasMany(TradeTransaction, {
    foreignKey: 'offerEmail',
    as: 'OfferedTrades'
});
User.hasMany(TradeTransaction, {
    foreignKey: 'accepterEmail',
    as: 'AcceptedTrades'
});
TradeTransaction.belongsTo(User, {
    foreignKey: 'offerEmail',
    as: 'Offerer'
});
TradeTransaction.belongsTo(User, {
    foreignKey: 'accepterEmail',
    as: 'Accepter'
});

module.exports = TradeTransaction;
