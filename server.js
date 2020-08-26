const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
// Load models
const Message = require('./models/message');
const User = require('./models/user');
const app = express();
// load keys file
const Keys = require('./config/keys');
// Load Helpers

// use body parser middleware
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
// confirguration for authentication
app.use(cookieParser());
app.use(session({
    secret: 'mysecret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());


// setup express static folder to serve js, css files
app.use(express.static('public'));
// Make user global object
app.use((req,res, next) => {
    res.locals.user = req.user || null;
    next();
});
// load passport
require('./passport/facebook');
// connect to mLab MongoDB
mongoose.connect(Keys.mongoDB, {useNewUrlParser : true}).then(() => {
    console.log('server is connected to mongoDB');
}).catch((err) => {
    console.log(err);
});
// environment var for port
const port = process.env.PORT || 3000;
// setup view engine
app.engine('handlebars',exphbs({defaultLayout:'main'}));
app.set('view engine','handlebars');

app.get('/',(req,res) => {
    res.render('home', {
        title: 'Home'
    });
});

app.get('/about',(req,res) => {
    res.render('about',{
        title:'About'
    });
});

app.get('/contact',(req,res) => {
    res.render('contact',{
        title: 'Contact'
    });
});

app.get('/auth/facebook',passport.authenticate('facebook',{
    scope: ['email']
}));
app.get('/auth/facebook/callback',passport.authenticate('facebook',{
    successRedirect: '/profile',
    failureRedirect: '/'
}));


app.get('/profile', (req,res) => {
    User.findById({_id:req.user._id}).then((user) => {
        if (user) {
          
                res.render('profile', {
                    title: 'Profile',
                        user: user
                    });
                }
            });
        });
    


app.post('/contactUs',(req,res) => {
    console.log(req.body);
    const newMessage = {
        fullname: req.body.fullname,
        email: req.body.email,
        message: req.body.message,
        date: new Date()
    }
    new Message(newMessage).save((err,message) => {
        if (err) {
            throw err;
        }else{
            Message.find({}).then((messages) => {
                if (messages) {
                    res.render('newmessage', {
                        title: 'Sent',
                        messages:messages
                    });
                }else{
                    res.render('noMessage',{
                        title: 'Not Found'
                    });
                }
            });
        }
    });
});

app.listen(port,() => {
    console.log(`Server is running on port ${port}`);
});
