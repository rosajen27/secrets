//jshint esversion:6
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

// initialize session with initial configuration
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

// initialize passport + use passport for managing the session
app.use(passport.initialize());
app.use(passport.session());

// connect to mongodb

mongoose.connect("mongodb+srv://admin:root@cluster0.e0jml.mongodb.net/userDB?retryWrites=true&w=majority", { useNewUrlParser: true });

mongoose.set("useCreateIndex", true);

// create user Schema
// object created from mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

// add passport-local-mongoose plugin 
// to hash and salt passwords and save users to database
userSchema.plugin(passportLocalMongoose);

// use userschema to set up new user model
const User = new mongoose.model("User", userSchema);

// passport-local configuration
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        User.find({ "secret": { $ne: null } }, function (err, foundUsers) {
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("secrets", { usersWithSecrets: foundUsers });
                }
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/submit", function (req, res) {
    // check to see if user is logged in
    // if they are, render submit page
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function (req, res) {
    // save the secret the user typed in
    const submittedSecret = req.body.secret;

    // find current user in DB & save secret into their file
    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            // if no errors and if the user exists, 
            // set the found user secret field to equal submitted secret
            // then save this user with newly updated secret
            // then redirect to secrets page
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function () {
                    res.redirect("/secrets");
                });
            }
        }
    });

});

app.get("/logout", function (req, res) {
    //deauthenticate user to end the session and redirect to home page
    req.logout();
    res.redirect("/");
});

// Post new user credentials on register route
app.post("/register", function (req, res) {

    // register user using function from passport-local-mongoose package
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        // if there is an error, log error and redirect user back to register page
        if (err) {
            console.log(err);
            res.redirect("/register");

            // otherwise if no errors, authenticate the user using passport and redirect to secrets page
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
});

// check to see if we have a user with the credentials that we put in
app.post("/login", function (req, res) {

    // create a new user with login form
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    // use passport to login and authenticate user
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port 3000.");
});