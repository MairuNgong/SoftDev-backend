const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const InterestedCategory = sequelize.define('InterestedCategory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
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
    categoryName: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, { timestamps: true });

User.hasMany(InterestedCategory, { foreignKey: 'email' });
InterestedCategory.belongsTo(User, { foreignKey: 'email' });

module.exports = InterestedCategory;
