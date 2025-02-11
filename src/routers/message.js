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
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "sender",
                as: "sender"
            }
        },
        {
            $project: {
                "_id": 1,
                "text": 1,
                "updatedAt": 1,

                "sender.firstName": 1,
                "sender.lastName": 1
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

        const count = await Message.aggregate([{ $match: filter }]).count("total").exec()
        const total = (count.length > 0) ? count[0].total : 0

        res.send({ results, total })
        return
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

module.exports = router

