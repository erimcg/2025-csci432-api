const express = require('express')
const Message = require('../models/message')
const auth = require('../middleware/auth')

const router = new express.Router()

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

/* Get Messages
    query params:
        before=Date
        after=Date
        limit=#
*/
router.get('/messages', auth, async (req, res) => {

    let filter = {
        $and: []
    }

    const now = new Date()

    if (req.query.hasOwnProperty('before')) {
        filter.$and.push({ updatedAt: { $lt: new Date(req.query.before) } })
    }


    if (req.query.hasOwnProperty('after')) {
        filter.$and.push({ updatedAt: { $gt: new Date(req.query.after) } })    
    }

    if (filter["$and"].length === 0) {
        filter = {}
    }

    console.log(JSON.stringify(filter))

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
        res.status(400).send()
    }
})

module.exports = router

