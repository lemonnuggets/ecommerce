if (process.env.NODE_ENV != 'production') {
  require('dotenv').config()
}

console.log('Server running at localhost:3000');
const express = require('express');
const app = express();
const server = app.listen(3000);
const passport = require('passport')
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const {hasher} = require('pcypher');
const MongoClient = require('mongodb').MongoClient;

const mongoUrl = `mongodb+srv://adam:${process.env.mongo_pwd}@cluster0.mn0ld.mongodb.net/${process.env.mongo_usr}?retryWrites=true&w=majority`;
const databaseName = 'storeDB';
const USER = 'user';
const ITEM ='item';

const initializePassport = require('./passport-config');
initializePassport(passport);


app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
  })
)

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.engine('html', require('ejs').renderFile)

function checkAuthenticated (req, res, next) {
  console.log(req.isAuthenticated())
  if (req.isAuthenticated()) {
    console.log('verified')
    return next()
  }
  res.redirect('/login')
}
function checkNotAuthenticated (req, res, next) {
  // console.log(req)
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.get('/', checkAuthenticated, (req, res) => {
  res.render('account.ejs', {
    name: req.user.name,
    username: req.user.username,
    cart: req.user.cart,
    bought: req.user.bought
  })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPwd = await hasher(req.body.password)
    let obj = {
      name: req.body.name,
      username: req.body.username,
      password: hashedPwd,
      cart: [],
      bought: []
    }
    console.log('Inserting vv \n',obj)
    MongoClient.connect(mongoUrl,{ useNewUrlParser: true, useUnifiedTopology: true }, (err, db)=>{
      if(err) throw err;
      let storeDB = db.db(databaseName)
      storeDB.collection(USER).insertOne(obj, (error, response) => {
        if(error) throw error;
        console.log(`${obj.username}'s info has been inserted`)
      })
    })
    res.redirect('/login')
  } catch (error) {
    res.redirect('/register')
  }
})
app.post(
  '/login',
  checkNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  })
)
app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})