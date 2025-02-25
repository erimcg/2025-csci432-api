const mongoose = require('mongoose')

const Schema = mongoose.Schema

const messageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxLength: 280
    }
}, { timestamps: true })

messageSchema.methods.toJSON = function () {
    const message = this
    const messageObject = message.toObject()
    delete messageObject.__v
    delete messageObject.createdAt
    return messageObject
}

const Message = mongoose.model('Message', messageSchema)
module.exports = Message