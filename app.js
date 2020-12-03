//jshint esversion:6
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

// connect to mongodb
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

// create user Schema
// object created from mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// use userschema to set up new user model
const User = new mongoose.model("User", userSchema);

// Render Webpages
app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

// Post new user credentials on register route
app.post("/register", function (req, res) {
    const newUser = new User({
        email: req.body.username,
        password: md5("req.body.password")
    });

    // if no errors, render the secrets page
    newUser.save(function (err) {
        if (err) {
            console.log(err)
        } else {
            res.render("secrets");
        }
    });
});

// check to see if we have a user with the credentials that we put in
app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = md5("req.body.password");

    // check them against the database
    User.findOne({ email: username }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("secrets");
                }
            }
        }
    });
});

app.listen(3000, function () {
    console.log("Server started on port 3000.");
});