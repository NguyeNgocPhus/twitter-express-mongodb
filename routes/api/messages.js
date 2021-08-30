const express = require('express');
const app = express();
const router = express.Router();
const Message = require('../../schemas/MessageSchema');
const User = require('../../schemas/UserSchema');
const Chat = require('../../schemas/ChatSchema');
const Post = require('../../schemas/PostSchema');
const Notification = require('../../schemas/NotificationSchema'); 
router.post('/', async (req, res, next) => {
  //console.log(req.body.content);

  Message.create({
    sender: req.session.user._id,
    content: req.body.content,
    chat: req.body.chatId,
  }).then(async (message) => {
    message = await User.populate(message, { path: 'sender' });
    message = await Chat.populate(message, { path: 'chat' });
    message = await User.populate(message, { path: 'chat.users' });

    const update = await Chat.findByIdAndUpdate(
      req.body.chatId,
      { latestMessage: message },
      { new: true }
    );
    insertNotifications(update, message);
    // console.log(update);
    res.status(200).send(message);
  });
});
function insertNotifications(chat, message) {
    chat.users.forEach(userId => {
        if(userId == message.sender._id.toString()) return;
        Notification.insertNotification(Notification,userId, message.sender._id, "newMessage", message.chat._id);
    })
}
module.exports = router;
