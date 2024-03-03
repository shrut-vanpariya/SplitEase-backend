const jwt = require('jsonwebtoken');
const userdb = require('../models/user');
require('dotenv').config();


const keysecret = process.env.KEYSECRATE;


const authenticate = async(req,res,next) => {
    try {
        const token = req.headers.authorization;
        // console.log(token);
        const veryfytoken = jwt.verify(token,keysecret);
        // console.log(veryfytoken);
        const rootUser = await userdb.findOne({_id:veryfytoken._id});
        // console.log(rootUser);
        if(!rootUser){
            throw new Error("user not found")
        }
        
        req.token = token;  // set token in req
        req.rootUser = rootUser; // set rootuser in req
        req.userId = rootUser._id; // set id in req
        
        next();

    } catch (error) {
        res.status(401).json({status:401,message:"Unauthorized no token provide"});
    }
}


module.exports = authenticate