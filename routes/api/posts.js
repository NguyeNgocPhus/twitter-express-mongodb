const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Notification = require('../../schemas/NotificationSchema');


app.use(bodyParser.urlencoded({ extended: false }));
// lấy các  các bài đăng
router.get('/', async (req, res, next) => {
  var searchObj = req.query;
  // tìm post vs regex
  if (searchObj.search !== undefined) {
    searchObj.content = { $regex: req.query.search, $options: 'i' };

    delete searchObj.search;
  }
  if (searchObj.isReply !== undefined) {
    var isReply = searchObj.isReply == 'true';
    //  {
    //   postedBy: '60f28fcd2b64ea4b000adfb0',
    //   isReply: 'false',
    //   replyTo: { '$exists': false } những tr ko replyTo dc xuất ra,
    // }
    // {
    //   postedBy: '60f28fcd2b64ea4b000adfb0',
    //   isReply: 'true',
    //   replyTo: { '$exists': true } những tr có  replyTo dc xuất ra 
    // }
    searchObj.replyTo = { $exists: isReply };

    delete searchObj.isReply;
 
  }

  var results = await getPosts(searchObj);
  res.status(200).send(results);
});
// tìm kiếm bài đăng với :Id và các bài đăng reply nó
router.get('/:id', async (req, res, next) => {
  var postId = req.params.id;
 // tìm kiếm các bài đăng 
  var postData = await getPosts({ _id: postId });
  
  postData = postData[0];
 
  var results = {
    postData: postData,
  };
  
  if (postData.replyTo !== undefined) {
    results.replyTo = postData.replyTo;
  }
  // tìm kiếm các bài đăng reply nó
  results.replies = await getPosts({ replyTo: postId });

  res.status(200).send(results);
});
// xóa bài đăng
router.delete('/:id', (req, res, next) => {
  Post.findByIdAndDelete(req.params.id)
    .then(() => res.sendStatus(202))
    .catch((error) => {
      console.log(error);
      res.sendStatus(400);
    });
});
// tạo bài đăng 
router.post('/', async (req, res, next) => {
  if (!req.body.content) {
    console.log('Content param not sent with request');
    return res.sendStatus(400);
  }

  var postData = {
    content: req.body.content,
    postedBy: req.session.user,
  };

  if (req.body.replyTo) {
    postData.replyTo = req.body.replyTo;
  }

  Post.create(postData)
    .then(async (newPost) => {
      newPost = await User.populate(newPost, { path: 'postedBy' });
      newPost = await Post.populate(newPost, { path: 'replyTo' });

      
      if(newPost.replyTo !== undefined && newPost.replyTo.postedBy != req.session.user._id ) {
            //console.log(newPost.replyTo.postedBy, req.session.user._id, "reply", newPost._id);
            await Notification.insertNotification(Notification,newPost.replyTo.postedBy, req.session.user._id, "reply", newPost._id);
      }
      res.status(201).send(newPost);
    })
    .catch((error) => {
      console.log(error);
      res.sendStatus(400);
    });
});
// nút like
router.put('/:id/like', async (req, res, next) => {
  var postId = req.params.id;
  var userId = req.session.user._id;

  var isLiked =
    req.session.user.likes && req.session.user.likes.includes(postId);

  var option = isLiked ? '$pull' : '$addToSet';

  // Insert user like
  req.session.user = await User.findByIdAndUpdate(
    userId,
    { [option]: { likes: postId } },
    { new: true }
  ).catch((error) => {
    console.log(error);
    res.sendStatus(400);
  });

  // Insert post like
  var post = await Post.findByIdAndUpdate(
    postId,
    { [option]: { likes: userId } },
    { new: true }
  ).catch((error) => {
    console.log(error);
    res.sendStatus(400);
  });
  if(option === '$addToSet'){

      await Notification.insertNotification(Notification,post.postedBy,req.session.user._id,'like',post._id);
  }
  res.status(200).send(post);
});
// nút retweet
router.post('/:id/retweet', async (req, res, next) => {
  var postId = req.params.id;
  var userId = req.session.user._id;

  // Try and delete retweet
  var deletedPost = await Post.findOneAndDelete({
    postedBy: userId,
    retweetData: postId,
  }).catch((error) => {
    console.log(error);
    res.sendStatus(400);
  });

  var option = deletedPost != null ? '$pull' : '$addToSet';

  var repost = deletedPost;

  if (repost == null) {
    repost = await Post.create({ postedBy: userId, retweetData: postId }).catch(
      (error) => {
        console.log(error);
        res.sendStatus(400);
      }
    );
  }

  // Insert user like
  req.session.user = await User.findByIdAndUpdate(
    userId,
    { [option]: { retweets: repost._id } },
    { new: true }
  ).catch((error) => {
    console.log(error);
    res.sendStatus(400);
  });

  // Insert post like
  var post = await Post.findByIdAndUpdate(
    postId,
    { [option]: { retweetUsers: userId } },
    { new: true }
  ).catch((error) => {
    console.log(error);
    res.sendStatus(400);
  });
  if(option === '$addToSet'){

      await Notification.insertNotification(Notification,post.postedBy,req.session.user._id,'retweet',post._id);
  }
  res.status(200).send(post);
});

async function getPosts(filter) {
  var results = await Post.find(filter)
    .populate('postedBy')
    .populate('retweetData')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .catch((error) => console.log(error));

  // console.log(results);
  results = await User.populate(results, { path: 'replyTo.postedBy' });
  return await User.populate(results, { path: 'retweetData.postedBy' });
}

module.exports = router;
