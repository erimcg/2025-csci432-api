const mongoose = require('mongoose')

console.log(`Connecting to ${process.env.MONGODB_URL}`)

mongoose.connect(process.env.MONGODB_URL)
    .then(() => { console.log('Connection to database successful.') })
    .catch((e) => { console.log('Error: ' + e) })