const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Chat = require('../../schemas/ChatSchema');
const Message = require('../../schemas/MessageSchema');

router.post('/', async (req, res) => {
  const users = JSON.parse(req.body.data);
  users.push(req.session.user);
  const data = {
    users,
    isGroupchat: true,
  };
  const results = await Chat.create(data);
  res.status(200).send(results);
});

router.get('/', async (req, res) => {
  Chat.find({
    users: { $elemMatch: { $eq: req.session.user._id } },
  })
    .populate('users')
    .populate('latestMessage')
    .sort({ createdAt: 1 })
    .then(async (results) => {
      results = await User.populate(results, { path: 'latestMessage.sender' });
      res.status(200).send(results);
    });
});

router.get('/:chatId', async (req, res) => {
  // console.log(req.params.chatId);
  const chats = await Chat.findOne({
    _id: req.params.chatId,
    users: { $elemMatch: { $eq: req.session.user._id } },
  }).populate('users');
  //console.log(chats);
  res.status(200).send(chats);
});
router.put('/:chatId', async (req, res) => {
  // console.log(req.params.chatId);
  Chat.findByIdAndUpdate(req.params.chatId, req.body)
    .then((results) => res.sendStatus(204))
    .catch((error) => {
      console.log(error);
      res.sendStatus(400);
    });
});
router.get('/:chatId/message', async (req, res) => {
  // console.log(req.params.chatId);
  const messages = await Message.find({ chat: req.params.chatId }).populate(
    'sender'
  );
  res.status(200).send(messages);
});

module.exports = router;
