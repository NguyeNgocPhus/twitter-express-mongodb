const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const User = require('../schemas/UserSchema');
const Chat = require('../schemas/ChatSchema');
const mongoose = require('mongoose');
app.set('view engine', 'pug');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));

router.get('/', async (req, res, next) => {
  res.render('inboxPage', {
    pageTitle: 'inBox',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  });
});

/// new message
router.get('/new', async (req, res, next) => {
  res.render('newMessage', {
    pageTitle: 'new message',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  });
});
router.get('/:chatId', async (req, res, next) => {
  const chatId = req.params.chatId;
  const userId = req.session.user._id;
  var isValidId = mongoose.isValidObjectId(chatId);
 // console.log(chatId);
  var payload = {
    pageTitle: 'Chat',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };

  if (!isValidId) {
    payload.errorMessage =
      'Chat does not exist or you do not have permission to view it.';
    return res.status(200).render('chatPage', payload);
  }

  let chat = await Chat.findOne({
    _id: chatId,
    users: { $elemMatch: { $eq: userId } },
  }).populate('users');
  if (!chat) {
    const user = await User.findById(chatId);

    if (!user) {
      payload.errorMessage = 'không tồn tại nhóm chat ';
      return res.status(200).render('chatPage', payload);
    }
    chat = await getChatByUserId(user._id, userId);
    console.log(chat);
  }
  if (chat == null) {
    payload.errorMessage = 'không tồn tại nhóm chat';
  } else {
    payload.chat = chat;
  }
  res.status(200).render('chatPage', payload);
});
///new ko tìm thấy update thì sẽ tự tạo thêm chat
function getChatByUserId(userLoggedInId, otherUserId) {
  return Chat.findOneAndUpdate(
    {
      isGroupChat: false,
      users: {
        $size: 2,
        $all: [
          { $elemMatch: { $eq: userLoggedInId } },
          { $elemMatch: { $eq: otherUserId } },
        ],
      },
    },
    {
      $setOnInsert: {
        users: [userLoggedInId, otherUserId],
      },
    },
    {
      new: true,
      upsert: true,///new ko tìm thấy update thì sẽ tự tạo thêm chat
    }
  ).populate('users');
}

module.exports = router;
