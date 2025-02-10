const mongoose = require('mongoose')

const Schema = mongoose.Schema

const postSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxLength: 280
    }
})

postSchema.methods.toJSON = function () {
    const post = this

    const postObject = post.toObject()

    delete postObject.__v

    return postObject
}

const Post = mongoose.model('Post', postSchema)
module.exports = Post