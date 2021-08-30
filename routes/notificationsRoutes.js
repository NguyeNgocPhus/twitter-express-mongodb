const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt");
const User = require('../schemas/UserSchema');
const Notification = require('../schemas/NotificationSchema');


router.get("/", (req, res, next) => {

    var payload = {
        pageTitle: "Notification",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
        postId: req.params.id
    }
    
    res.status(200).render("notificationPage", payload);
})

module.exports = router;