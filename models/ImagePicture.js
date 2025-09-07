const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Item = require('./Item');

const ImagePicture = sequelize.define('ImagePicture', {
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

Item.hasMany(ImagePicture, { foreignKey: 'itemId' });
ImagePicture.belongsTo(Item, { foreignKey: 'itemId' });

module.exports = ImagePicture;
