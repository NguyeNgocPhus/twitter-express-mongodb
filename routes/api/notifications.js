const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Notification = require('../../schemas/NotificationSchema');


app.use(bodyParser.urlencoded({ extended: false }));

router.get('/', async (req, res, next) => {
     const notification =await  Notification.find({userTo:req.session.user._id,notification:{$ne:"newMessage"}})
     .populate("userTo")
     .populate("userFrom")
     .sort({createdAt:-1});
     res.status(200).send(notification)
})
router.put("/:id/markAsOpened", async (req, res, next) => {
    
    Notification.findByIdAndUpdate(req.params.id, { opened: true })
    .then(() => res.sendStatus(204))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

})

router.put("/markAsOpened", async (req, res, next) => {
    
    Notification.updateMany({ userTo: req.session.user._id }, { opened: true })
    .then(() => res.sendStatus(204))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

})

module.exports = router;
