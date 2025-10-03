// models/index.js
const User = require('./User');
const InterestedCatagory = require('./InterestedCatagory');
const Blocked = require('./Blocked');
const ItemPicture = require('./ItemPicture');
const Item = require('./Item');
const ItemCatagory = require('./ItemCatagory');
const Message = require('./Message');
// const Rating = require('./Rating');   // <- remove this
const TradeItem = require('./TradeItem');
const WatchedItem = require('./WatchedItem');
const TradeTransaction = require('./TradeTransaction');

module.exports = {
    User,
    InterestedCatagory,
    Blocked,
    ItemPicture,
    Item,
    ItemCatagory,
    Message,
    TradeItem,
    WatchedItem,
    TradeTransaction,
};
