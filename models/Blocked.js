// models/Blocked.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Blocked = sequelize.define('Blocked', {
    blockerId: {
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
    blockedId: {
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
    reason: {
        type: DataTypes.STRING, // short reason
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'Blocked'
});

// Associations
User.belongsToMany(User, {
    through: Blocked,
    as: 'BlockedUsers',
    foreignKey: 'blockerId',
    otherKey: 'blockedId'
});

User.belongsToMany(User, {
    through: Blocked,
    as: 'BlockedBy',
    foreignKey: 'blockedId',
    otherKey: 'blockerId'
});

module.exports = Blocked;
