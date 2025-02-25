const express = require('express')
const mongoose = require('mongoose')

const Message = require('../models/message')
const auth = require('../middleware/auth')

const router = new express.Router()

/* Post Public Message */

router.post('/message', auth, async (req, res) => {
    const user = req.user

    try {
        const message = new Message({
            ...req.body,
            sender: user._id
        })

        await message.save()

        res.status(201).send(message)
        return
    }
    catch (e) {
        res.status(400).send(e)
    }
})

/* Get Public Messages
    query params:
        before=Date
        after=Date
        limit=#
*/
router.get('/messages', auth, async (req, res) => {

    let filter = {}

    filter.$and = [{ receiver: null }]

    if (req.query.hasOwnProperty('before')) {
        filter.$and.push({ updatedAt: { $lt: new Date(req.query.before) } })
    }

    if (req.query.hasOwnProperty('after')) {
        filter.$and.push({ updatedAt: { $gt: new Date(req.query.after) } })    
    }

    //console.log(JSON.stringify(filter))

    const pipeline = Message.aggregate([
        { $match: filter },
        { $lookup: {
                localField: "sender",
                as: "sender",
                from: "users",
                foreignField: "_id"
            }
        },
        {
            $set: {
                sender: { $arrayElemAt: ["$sender", 0] }
            }
        },
        {
            $project: {
                messageId: "$_id",
                _id: 0,
                text: 1,
                updatedAt: 1,

                senderId: "$sender._id",
                senderName: {
                    $concat: ["$sender.firstName", ' ', "$sender.lastName" ]
                },
            }
        }
    ])

    pipeline.append({ $sort: { updatedAt: -1 } })

    if (req.query.limit) {
        pipeline.append({ $limit: parseInt(req.query.limit)})
    }

    if (req.query.skip) {
        pipeline.append({ $skip: parseInt(req.query.skip) })
    }

    try {
        const results = await pipeline.exec()
        res.send(results)
    }
    catch (e) {
        console.log(e)
        res.status(500).send()
    }
})
    
* / Get Public Message Count */

router.get('/messages/count', auth, async (req, res) => {
    let filter = {}

    filter.$and = [{ receiver: null }]

    if (req.query.hasOwnProperty('after')) {
        filter.updatedAt = { $gt: new Date(req.query.after) }
    }

    try {
        const count = await Message.aggregate([{ $match: filter }]).count("total").exec()
        const total = (count.length > 0) ? count[0].total : 0

        res.send({ total })
    }
    catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

/****************************************************
 * Private Messages
 ****************************************************/

/* Post Private Message */

router.post('/message/:userId', auth, async (req, res) => {
    const user = req.user

    try {
        const message = new Message({
            ...req.body,
            sender: user._id,
            receiver: req.params.userId
        })

        await message.save()

        res.status(201).send(message)
        return
    }
    catch (e) {
        res.status(400).send(e)
    }
})

/* Get Private Messages
    query params:
        before=Date
        after=Date
        limit=#
*/
router.get('/messages/:id', auth, async (req, res) => {

    const user = req.user

    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).send("Invalid objectId")
        return
    }

    const userId = req.params.id

    let filter = {}

    filter.$and = [
        {
            $or: [
                {
                    $and: [
                        { receiver: new mongoose.Types.ObjectId(userId) },
                        { sender: user._id }
                    ]
                },
                {
                    $and: [
                        { sender: new mongoose.Types.ObjectId(userId) },
                        { receiver: user._id }
                    ] 
                }
            ]
        }
    ]

    if (req.query.hasOwnProperty('before')) {
        filter.$and.push({ updatedAt: { $lt: new Date(req.query.before) } })
    }

    if (req.query.hasOwnProperty('after')) {
        filter.$and.push({ updatedAt: { $gt: new Date(req.query.after) } })
    }

    const pipeline = Message.aggregate([
        { $match: filter },
        {
            $lookup: {
                localField: "sender",
                as: "sender",
                from: "users",
                foreignField: "_id"
            }
        },
        {
            $set: {
                sender: { $arrayElemAt: ["$sender", 0] }
            }
        },
        {
            $lookup: {
                localField: "receiver",
                as: "receiver",
                from: "users",
                foreignField: "_id"
            }
        },
        {
            $set: {
                receiver: { $arrayElemAt: ["$receiver", 0] }
            }
        },
        {
            $project: {
                messageId: "$_id",
                _id: 0,
                text: 1,
                updatedAt: 1,

                senderId: "$sender._id",
                senderName: {
                    $concat: ["$sender.firstName", ' ', "$sender.lastName"]
                },

                receiverId: "$receiver._id",
                receiverName: {
                    $concat: ["$receiver.firstName", ' ', "$receiver.lastName"]
                },
            }
        }
    ])

    pipeline.append({ $sort: { updatedAt: -1 } })

    if (req.query.limit) {
        pipeline.append({ $limit: parseInt(req.query.limit) })
    }

    if (req.query.skip) {
        pipeline.append({ $skip: parseInt(req.query.skip) })
    }

    try {
        const results = await pipeline.exec()
        res.send(results)
    }
    catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

/* Get Private Message Count */

router.get('/messages/:id/count', auth, async (req, res) => {

    const user = req.user

    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).send("Invalid objectId")
        return
    }

    const userId = req.params.id

    let filter = {}

    filter.$and = [
        {
            $or: [
                {
                    $and: [
                        { receiver: new mongoose.Types.ObjectId(userId) },
                        { sender: user._id }
                    ]
                },
                {
                    $and: [
                        { sender: new mongoose.Types.ObjectId(userId) },
                        { receiver: user._id }
                    ]
                }
            ]
        }
    ]

    if (req.query.hasOwnProperty('after')) {
        filter.$and.push({ updatedAt: { $gt: new Date(req.query.after) } } )
    }

    try {
        const count = await Message.aggregate([{ $match: filter }]).count("total").exec()
        const total = (count.length > 0) ? count[0].total : 0

        res.send({ total })
    }
    catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

module.exports = router

