const express = require('express');
const mongoose = require('mongoose');
const router = require("./routes/router");
const cors = require('cors');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const User = require('./models/user.js');
const Transaction = require('./models/transaction.js');
const transaction = require('./models/transaction.js');

const app = express()
const PORT = process.env.PORT || 8000
const HOST = process.env.HOST || "0.0.0.0"
const CLIENT = process.env.CLIENT 

require('./db/conn')

app.use(cors({
    origin: ['http://localhost:3000','https://localhost:3000', `http://${CLIENT}`, `https://${CLIENT}`],
    credentials: true,
})); // to remove CORS(cross oregin resource shering) error (front end  port 3000 and back end port 8009) 

// app.use(methodOverride('_method'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(router);

// app.get("/", (req, res) => {
//     res.send("hello from server.")
// })

// app.post("/register", (req, res) => {
//     res.send(req.body);
// })
// app.post("/login", (req, res) => {
//     res.send(req.body);
// })


app.listen(PORT, HOST, () => {
    console.log(`🚀Server is running on http://${HOST}:${PORT}`);
});