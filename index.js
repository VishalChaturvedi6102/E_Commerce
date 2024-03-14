if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
} 

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const session = require('express-session');
const connectFlash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const MongoStore = require('connect-mongo')
const PORT = process.env.PORT || 8000;


const dbURL = process.env.dbUrl || 'mongodb://127.0.0.1:27017/shoppingCart';
const secret = process.env.SECRET;


mongoose.connect(dbURL)
    .then(() => { console.log('DB connected!') })
    .catch(e => console.log(e));


const store = MongoStore.create({
    secret:secret,
    mongoUrl:dbURL,
    touchAfter:24*60*60
})


const sessionConfig = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
}


app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session(sessionConfig));
app.use(connectFlash());


// Initializing middleware for passport
app.use(passport.initialize());
app.use(passport.session());

// telling passport to check for username and password using authenticate method provided by the passport-local-mongoose
passport.use(new LocalStrategy(User.authenticate()));

// this tells passport to use passport-local-mongoose methods to add or remove user from session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {

    let totalQuantity = 0;
    if (req.user && req.user.cart) {
        req.user.cart.forEach((item) => {
            if(item.quantity > 0){
                totalQuantity += item.quantity;
            }
        });
    }

    res.locals.totalQuantity = totalQuantity;

    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


// --------------- routes
const productRoutes = require('./routes/products');
const reviewRoutes = require('./routes/review');
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');

// APIs
const productApis = require('./routes/api/productapi')
const paymentApis = require('./routes/api/payment');

app.use(productRoutes);
app.use(reviewRoutes);
app.use(authRoutes);
app.use(cartRoutes);
app.use(productApis);
app.use(paymentApis);

app.get('/', (req, res) => {
    res.render('home');
});

app.all('*', (req, res)=>{
    res.render('error', {err:'You are requesting a wrong url!!!'});
})

app.listen(PORT, () => {
    console.log('Server is Up at port ', PORT);
})



