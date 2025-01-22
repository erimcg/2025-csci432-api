const express = require('express')
const router = new express.Router()

router.get('/user', async (req, res) => {
    try {
        res.status(201).send("Joe User")
    } catch (error) {
        res.status(400).send("Error")
    }
})

module.exports = router