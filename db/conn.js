const mongoose = require('mongoose');
require('dotenv').config()

const User = require('../models/user');

const mongo_uri = process.env.MONGO_URI

main().catch(err => console.log(err));

async function main() {
    // console.log(mongo_uri);
    try {
        const db = await mongoose.connect(mongo_uri);

        if (db.connection.readyState === 1) {
            console.log('MongoDB connected successfully!');
        } else {
            console.log('MongoDB connection failed.');
        }

        // const user1 = User({
        //     username:"test1",
        //     email:"test1@gmail.com",
        // })

        // user1.save()

        User

    } catch (error) {
        console.log('Error connection database:', error);
    }
}
