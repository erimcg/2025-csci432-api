const express = require('express')
const router = new express.Router()

// Add a new user 

router.get('/user', async (req, res) => {

    try {
        res.status(201).send("Joe Smoozer")
    }
    catch (error) {
        res.status(400).send("Error") 
    }
})

module.exports = router