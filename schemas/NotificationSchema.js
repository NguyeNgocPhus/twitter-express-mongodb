
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = mongoose.Schema({

    userTo:{type:Schema.Types.ObjectId,ref:'User'},
    userFrom :{type:Schema.Types.ObjectId,ref:'User'},
    notificationType:String,
    opened:{type:Boolean,default:false},
    entityId:Schema.Types.ObjectId
},{ timestamps: true })



notificationSchema.statics.insertNotification = async (Model,userTo,userFrom,notificationType,entityId)=>{
    const data = {
        userTo,
        userFrom,
        notificationType,
        entityId
    }
    await Model.deleteOne(data);
    return await Model.create(data);
}

module.exports = mongoose.model('Notification',notificationSchema);
