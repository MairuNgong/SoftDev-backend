// models/index.js
const User = require('./User');
const InterestedCatagory = require('./InterestedCatagory');
const Blocked = require('./Blocked');
const ItemPicture = require('./ItemPicture');
const Item = require('./Item');
const ItemCatagory = require('./ItemCatagory'); // keep project spelling
const Message = require('./Message');
const Rating = require('./Rating');
const TradeItem = require('./TradeItem');
const WatchedItem = require('./WatchedItem');

module.exports = {
    User,
    InterestedCatagory,
    Blocked,
    ItemPicture,
    Item,
    ItemCatagory,
    Message,
    Rating,
    TradeItem,
    WatchedItem
};
