// models/Rating.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Rating = sequelize.define('Rating', {
    raterId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
            model: User,
            key: 'email'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        validate: { isEmail: true }
    },
    ratedId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
            model: User,
            key: 'email'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        validate: { isEmail: true }
    },
    score: {
        type: DataTypes.FLOAT, // rating score, e.g., 1–5
        allowNull: false,
        validate: {
            min: 0,
            max: 5
        }
    },
    review: {
        type: DataTypes.TEXT, // allow longer written reviews
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'Ratings'
});

// Associations
User.belongsToMany(User, {
    through: Rating,
    as: 'GivenRatings',      // ratings this user gave
    foreignKey: 'raterId',
    otherKey: 'ratedId'
});

User.belongsToMany(User, {
    through: Rating,
    as: 'ReceivedRatings',   // ratings this user received
    foreignKey: 'ratedId',
    otherKey: 'raterId'
});

module.exports = Rating;
