const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Notification = require('../../schemas/NotificationSchema');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.session.user.username}-${Date.now()}.${ext}`);
  },
});
var upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: false }));
// tìm user với regex
router.get('/', async (req, res, next) => {
  const user = await User.find({
    $or: [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { username: { $regex: req.query.search, $options: 'i' } },
    ],
  });
  res.status(200).send(user);
});

router.put('/:userId/follow', async (req, res, next) => {
  const userId = req.params.userId;

  const user = await User.findById(userId);

  const isFollow =
    user.followers && user.followers.includes(req.session.user._id);
  const option = isFollow ? '$pull' : '$addToSet';

  req.session.user = await User.findByIdAndUpdate(
    req.session.user._id,
    {
      [option]: { following: userId },
    },
    { new: true }
  );
  if(!isFollow){
    await Notification.insertNotification(Notification,userId,req.session.user._id,'follow',req.session.user._id);
  }
  await User.findByIdAndUpdate(
    userId,
    {
      [option]: { followers: req.session.user._id },
    },
    { new: true }
  );
  res.status(200).send(req.session.user);
});

router.get('/:userId/following', async (req, res, next) => {
  User.findById(req.params.userId)
    .populate('following')
    .then((results) => {
      res.status(200).send(results);
    })
    .catch((error) => {
      console.log(error);
      res.sendStatus(400);
    });
});

router.get('/:userId/followers', async (req, res, next) => {
  User.findById(req.params.userId)
    .populate('followers')
    .then((results) => {
      res.status(200).send(results);
    })
    .catch((error) => {
      console.log(error);
      res.sendStatus(400);
    });
});
router.post(
  '/profilePicture',
  upload.single('croppedImage'),
  async (req, res, next) => {
    req.session.user = await User.findByIdAndUpdate(
      req.session.user._id,
      {
        profilePic: `/images/${req.file.filename}`,
      },
      { new: true }
    );

    res.status(200).send('ok');
  }
);
router.post(
  '/coverPhoto',
  upload.single('croppedImage'),
  async (req, res, next) => {
    req.session.user = await User.findByIdAndUpdate(
      req.session.user._id,
      {
        coverPhoto: `/images/${req.file.filename}`,
      },
      { new: true }
    );

    res.status(200).send('ok');
  }
);
module.exports = router;
