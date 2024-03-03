const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const Transaction = require('../models/transaction');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/authenticate')

// for user registration

router.get('/', (req, res) => {
    res.send('hello from server.');
})

router.post("/register", async (req, res) => {
    // console.log(req.body);
    const { username, email, password, cpassword } = req.body;
    if (!username || !email || !password || !cpassword) {
        res.status(422).json({ error: "fill all the details" });
    }
    else {
        try {
            const preuser = await User.findOne({ email: email });
            if (preuser) {
                res.status(422).json({ error: "This email is already exist" })
            }
            else if (password != cpassword) {
                res.status(422).json({ error: "password and confirm password are not match" });
            }
            else {
                const finalUser = new User({
                    username, email, password
                });
                // console.log("hello");
                // console.log(finalUser)
                // here password hashing in done in userSchema.js
                const storeData = await finalUser.save();
                // console.log(storeData);
                // console.log("hello");
                res.status(201).json({ status: 201, storeData });
            }
        } catch (error) {
            // console.log(error);
            res.status(422).json(error);
            console.log("catch block error");
        }
    }
});

// user login

router.post("/login", async (req, res) => {
    // console.log(req.body);
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(422).json({ error: "fill all the details" });
    }
    else {
        try {
            const userValid = await User.findOne({ email: email });

            if (userValid) {
                const isMatch = await bcrypt.compare(password, userValid.password);
                console.log("Is match : ", isMatch);
                if (!isMatch) {
                    res.status(422).json({ error: "Invalid details!" });
                }
                else {
                    // token generate

                    const token = await userValid.generateAuthtoken();

                    console.log(token);

                    // cookie generate
                    res.cookie("usercookie", token, {
                        expires: new Date(Date.now() + 900000),
                        httpOnly: true
                    });

                    const result = {
                        userValid,
                        token,
                    };
                    console.log("result : ", result);
                    res.status(201).json({ status: 201, result });
                }
            }

        } catch (error) {
            res.status(401).json(error);
            console.log("catch block");
        }
    }
});

router.get("/validuser", authenticate, async (req, res) => {
    // console.log("done");
    try {
        const ValidUserOne = await User.findOne({ _id: req.userId })
        res.status(201).json({ status: 201, ValidUserOne });
    } catch (error) {
        res.status(401).json({ status: 401, error });
    }
});

router.get("/logout", authenticate, async (req, res) => {
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((curelem) => {
            return curelem.token === req.token;
        });

        // console.log(req.rootUser.tokens);

        await req.rootUser.save();

        res.clearCookie("usercookie", { path: "/" });

        res.status(201).json({ status: 201 });
    } catch (error) {

        res.status(201).json({ status: 401, error });

    }
});

// router.post("/makefriend", authenticate, async (req, res) => {
//     const { email, femail } = req.body;
//     if (!email) {
//         res.status(422).json({ error: "Email is empty" });
//     }
//     else {
//         const user = await User.findOne({ email: email });
//         const userFriend = await User.findOne({ email: femail });

//         const updatedUser1 = await User.findOneAndUpdate(
//             { _id: user._id },
//             { $addToSet: { friends: userFriend._id } },
//             { new: true }
//         );

//         const updatedUser2 = await User.findOneAndUpdate(
//             { _id: userFriend._id },
//             { $addToSet: { friends: user._id } },
//             { new: true }
//         );


//         res.status(201).json({ "message": "ok" })
//     }
// });
router.post("/makefriend", authenticate, async (req, res) => {
    const { email, femail } = req.body;
    // console.log(email);
    // console.log(femail);
    try {
        // Check if email or femail is empty
        if (!email || !femail) {
            return res.status(422).json({ error: "Email is empty" });
        }

        // Find the users with the provided emails
        const user = await User.findOne({ email: email });
        const userFriend = await User.findOne({ email: femail });
        // console.log(user)
        // console.log(userFriend)
        // Check if user and userFriend exist
        if (!user || !userFriend) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if user and userFriend are the same
        if (user._id.toString() === userFriend._id.toString()) {
            return res.status(400).json({ error: "Cannot add yourself as a friend" });
        }

        // Update user's friends list
        const updatedUser1 = await User.findOneAndUpdate(
            { _id: user._id },
            { $addToSet: { friends: userFriend._id } },
            { new: true }
        );

        // Update userFriend's friends list
        const updatedUser2 = await User.findOneAndUpdate(
            { _id: userFriend._id },
            { $addToSet: { friends: user._id } },
            { new: true }
        );

        res.status(201).json({ message: "Friend added successfully" });
    } catch (error) {
        console.error('Error making friends:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.post("/maketransaction/:userId/:friendId", authenticate, async (req, res) => {
    const { userId, friendId } = req.params;
    const { amount, description, splittype, date } = req.body; // Added 'date' field
    console.log(userId);
    console.log(friendId);
    console.log(splittype);
    try {
        // Validate data
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!splittype || !["you paid split equally", "other paid split equally", "you paid full amount", "other paid full amount"].includes(splittype)) {
            return res.status(400).json({ error: 'Invalid split type' });
        }

        // Check if 'date' is provided, otherwise use current date as default
        const currentDate = date ? new Date(date) : new Date();

        const author = await User.findById(userId);
        const other = await User.findById(friendId);

        // Create new transaction object with default or custom date
        const newTransaction = new Transaction({
            amount,
            author: userId,
            other: friendId,
            description,
            splittype,
            date: currentDate // Assigning default or custom date
        });

        // Save transaction to the database
        await newTransaction.save();
        author.transactions.push(newTransaction._id);
        other.transactions.push(newTransaction._id);
        await Promise.all([author.save(), other.save()]);
        res.status(201).json({ message: 'Expense added successfully', transaction: newTransaction });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get("/totalexpense/:userId/:friendId", async (req, res) => {
    const { userId, friendId } = req.params;

    try {
        // Find transactions where either the author or other matches userId or friendId
        const transactions = await Transaction.find({
            $or: [
                { $and: [{ author: userId }, { other: friendId }] },
                { $and: [{ author: friendId }, { other: userId }] }
            ]
        });

        // res.status(200).json({ transactions });
        // Initialize variables to track total money owed and owing
        var youWillGive = 0;
        var youWillReceive = 0;

        // Iterate through transactions and calculate total money owed and owing
        // Iterate through transactions and calculate total money owed and owing
        transactions.forEach(transaction => {
            // console.log(transaction);
            let amount = Number(transaction.amount);

            if (transaction.author.toString() === userId) {
                // User is the author of the transaction

                if (transaction.splittype === 'you paid split equally') {

                    youWillReceive = youWillReceive + amount / 2;
                } else if (transaction.splittype === 'you paid full amount') {

                    youWillReceive = youWillReceive + amount;
                }
                else if (transaction.splittype === 'other paid split equally') {

                    youWillGive = youWillGive + amount / 2;
                } else if (transaction.splittype === 'other paid full amount') {

                    youWillGive = youWillGive + amount;
                }
            } else if (transaction.other.toString() === userId) {
                // User is the other party in the transaction

                if (transaction.splittype === 'you paid split equally') {

                    youWillGive = youWillGive + amount / 2;
                } else if (transaction.splittype === 'you paid full amount') {

                    
                    youWillGive = youWillGive + amount;
                }
                else if (transaction.splittype === 'other paid split equally') {

                    youWillReceive = youWillReceive + amount / 2;
                } else if (transaction.splittype === 'other paid full amount') {

                    youWillReceive = youWillReceive + amount;
                }
            }
        });
        const netAmount = youWillReceive - youWillGive;

        let total = {};
        if (netAmount > 0) {
            total = { type: "youWillReceive", amount: netAmount };
        } else {

            total = { type: "youWillGive", amount: Math.abs(netAmount) };
        }
        res.status(200).json(total);

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})
router.get("/getfriends", authenticate, async (req, res) => {
    try {
        // Get the authenticated user's ID from the request object
        const userId = req.userId;

        const user = await User.findById(userId).populate('friends');

        // Extract friends array from the populated 'friends' field
        const friends = user.friends;

        res.status(200).json({ friends });


    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(401).json({ error: 'Internal server error' });
    }
})

router.get("/gettransaction/:userId/:friendId", authenticate, async (req, res) => {
    const { userId, friendId } = req.params;

    try {
        // Find transactions where either the author or other matches userId or friendId
        const transactions = await Transaction.find({
            $or: [
                { $and: [{ author: userId }, { other: friendId }] },
                { $and: [{ author: friendId }, { other: userId }] }
            ]
        });

        // res.status(200).json({ transactions });
        // Initialize variables to track total money owed and owing
        var youWillGive = 0;
        var youWillReceive = 0;

        // Iterate through transactions and calculate total money owed and owing
        transactions.forEach(transaction => {
            // console.log(transaction);
            let amount = Number(transaction.amount);

            if (transaction.author.toString() === userId) {
                // User is the author of the transaction

                if (transaction.splittype === 'you paid split equally') {

                    youWillReceive = youWillReceive + amount / 2;
                } else if (transaction.splittype === 'you paid full amount') {

                    youWillReceive = youWillReceive + amount;
                }
                else if (transaction.splittype === 'other paid split equally') {

                    youWillGive = youWillGive + amount / 2;
                } else if (transaction.splittype === 'other paid full amount') {

                    youWillGive = youWillGive + amount;
                }
            } else if (transaction.other.toString() === userId) {
                // User is the other party in the transaction

                if (transaction.splittype === 'you paid split equally') {

                    youWillGive = youWillGive + amount / 2;
                } else if (transaction.splittype === 'you paid full amount') {

                    youWillGive = youWillGive + amount;
                }
                else if (transaction.splittype === 'other paid split equally') {

                    youWillReceive = youWillReceive + amount / 2;
                } else if (transaction.splittype === 'other paid full amount') {

                    youWillReceive = youWillReceive + amount;
                }
            }
        });
        const netAmount = youWillReceive - youWillGive;

        let total = {};
        if (netAmount > 0) {
            total = { type: "youWillReceive", amount: netAmount };
        } else {

            total = { type: "youWillGive", amount: Math.abs(netAmount) };
        }

        res.status(200).json({ transactions, youWillGive, youWillReceive, total });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete("/transaction/:transactionId", authenticate, async (req, res) => {
    const { transactionId } = req.params;

    try {
        // Find the transaction by its ID and delete it
        const deletedTransaction = await Transaction.findByIdAndDelete(transactionId);

        if (!deletedTransaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put("/transaction/:transactionId", authenticate, async (req, res) => {
    const { transactionId } = req.params;
    const { amount, description, splittype, date } = req.body; // Updated transaction data

    try {
        // Find the transaction by its ID
        let transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Update transaction data
        if (amount) transaction.amount = amount;
        if (description) transaction.description = description;
        if (splittype) transaction.splittype = splittype;
        if (date) transaction.date = date;

        // Save the updated transaction
        transaction = await transaction.save();

        res.status(200).json({ message: 'Transaction updated successfully', transaction });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;