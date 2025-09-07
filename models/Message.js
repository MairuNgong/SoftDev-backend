// models/Message.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Message = sequelize.define('Message', {
    messageId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    senderEmail: {
        type: DataTypes.STRING,
        allowNull: false,
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
    receiverEmail: {
        type: DataTypes.STRING,
        allowNull: false,
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
    context: {
        type: DataTypes.STRING, // message text kept as string
        allowNull: false
    },
    dateTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, { timestamps: false, tableName: 'Messages' });

// Associations
User.hasMany(Message, { foreignKey: 'senderEmail', as: 'SentMessages' });
User.hasMany(Message, { foreignKey: 'receiverEmail', as: 'ReceivedMessages' });
Message.belongsTo(User, { foreignKey: 'senderEmail', as: 'Sender' });
Message.belongsTo(User, { foreignKey: 'receiverEmail', as: 'Receiver' });

module.exports = Message;
