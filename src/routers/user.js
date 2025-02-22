const express = require('express')
const User = require('../models/user')
//const { sendWelcomeEmail } = require('../emails/join.js')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')

const router = new express.Router()

// Add a new user
router.post('/user', async (req, res) => {

    try {
        const user = new User(req.body)

        await user.save()
        const token = await user.generateAuthToken()

        res.status(201).send({ user, token })
    }
    catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})

// Log user in
router.post('/user/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

// Log out user
router.post("/user/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// Get user account
router.get("/user", auth, async (req, res) => {
    res.send(req.user)
})

// Modify user account
router.patch('/user', auth, async (req, res) => {
    const mods = req.body
    const props = Object.keys(mods)
    const modifiable = ['firstName', 'lastName', 'userName', 'password', 'email']
    const isValid = props.every((prop) => modifiable.includes(prop))

    if (!isValid) {
        return res.status(400).send({ error: 'Invalid updates.' })
    }

    try {
        const user = req.user
        props.forEach((prop) => user[prop] = mods[prop])
        await user.save()
        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Delete user account
router.delete('/user', auth, async (req, res) => {
    try {
        console.log(req.user)
        await User.deleteOne({_id: req.user._id})
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

/* Search users
    query params:
        search=firstName|lastname|userName:text
        sortBy=property:asc|desc 
        skip=#
        limit=#
*/
router.get('/users', auth, async (req, res) => {
    let filter = {}

    try {
        let search = []
        if (req.query.search) {
            let args = req.query.search.split(':')
            let text = args[1]
            const fields = args[0].split('|')
            for (let field of fields) {
                let obj = {}
                obj[field] = { $regex: text, $options: 'i' }
                search.push(obj)
            }
        }

        console.log(search)
        if (search.length > 0) {
            filter = { $or: search }
        }
        console.log(filter)
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e)
    }

    const pipeline = User.aggregate([
        { $match: filter },
        { $project: {
                "firstName": 1,
                "lastName": 1,
                "userName": 1,
                "_id": 1
            }
        },
    ])

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        const sort = {}
        sort[parts[0]] = (parts[1] === 'asc') ? 1 : -1
        pipeline.append({ $sort: sort })
    }

    if (req.query.skip) {
        pipeline.append({ $skip: parseInt(req.query.skip) })
    }

    if (req.query.limit) {
        pipeline.append({ $limit: parseInt(req.query.limit) })
    }

    try {
        const users = await pipeline.exec()
        //const count = await User.aggregate([{ $match: filter }]).count("total").exec()
        //const total = (count.length > 0) ? count[0].total : 0

        res.send(users)
        return
    }
    catch (e) {
        console.log(e)
        res.status(500).send()
    }    
})


module.exports = router