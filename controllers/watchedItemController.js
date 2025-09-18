const {User, WatchedItem} = require('../models');

exports.GetWatchedItems = async (req, res) => {
    try {
        const email = req.user?.email;
        const user = await User.findByPk(email);
        if (!user) return res.status(400).json({ error: 'User not found for token email' });
        const watchedItems = await user.getWatchedItems({
          attributes: ['id'],                  
          joinTableAttributes: ['dateTime']    
        });
        const result = watchedItems.map(item => ({
          id: item.id,
          dateTime: item.WatchedItem.dateTime
        }));
        res.status(200).json(result);
    } catch (err) {
        console.error('GetWatchedItems error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addWatchedItem = async (req, res) => {
    try {
        const { itemId } = req.body;
        const emailAddress = req.user?.email;
        if (!itemId) return res.status(400).json({ error: 'itemId is required' });

        const user = await User.findByPk(emailAddress);
        if (!user) return res.status(400).json({ error: 'User not found for token email' });
        const [watched, created] = await WatchedItem.findOrCreate({
            where: { emailAddress, itemId },
            defaults: { emailAddress, itemId }
        });

        if (!created) {
            await watched.update({ dateTime: new Date() });
        }
        res.status(201).json(watched);
    } catch (err) {
        console.error('addWatchedItem error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};