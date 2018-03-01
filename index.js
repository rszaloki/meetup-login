const express = require('express');
const passport = require('passport');
const MeetupStrategy = require('passport-meetup-oauth2').Strategy;
const axios = require('axios');

const MEETUP_KEY = 'dpl7nvtfqgmtqfmcoga1l7rhu7';
const MEETUP_SECRET = 'sk17ec22psrp05ufkro3skghtl';
const MEETUP_API_KEY = '86634792c1fd4d4f4ff272c7b390';
const NEWTECH_GROUP_ID = 408089;

passport.use(new MeetupStrategy({
      clientID: MEETUP_KEY,
      clientSecret: MEETUP_SECRET,
      callbackURL: 'http://localhost:3000/auth/meetup/callback',
      scope: 'profile_edit',
    },
    function(accessToken, refreshToken, profile, done) {
      axios.get('https://api.meetup.com/members/self?&sign=true&photo-host=public&fields=memberships&page=20', {
        headers: {'Authorization': `Bearer ${accessToken}`},
      }).then(response => {
        const data = response.data;
        let role = ['member'];


        if (data.memberships && data.memberships.organizer &&
            data.memberships.organizer.some(e => e.group.id === NEWTECH_GROUP_ID)) {
          role.push('organizer');
        }

        return done(null, {
          id: data.id,
          name: data.name,
          email: data.email,
          photo: data.photo,
          role,
        });
      }).catch((err) => done(err, false));
    }));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

const app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('express-session')({secret: 'keyboard cat', resave: true, saveUninitialized: true}));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (request, response) => response.render('home', {user: request.user}));
app.get('/profile', (request, response) => response.render('profile', {user: request.user}));

app.get('/login',
    function(req, res) {
      res.render('login');
    });

app.get('/auth/meetup', passport.authenticate('meetup'));

app.get('/auth/meetup/callback',
    passport.authenticate('meetup', {failureRedirect: '/login'}),
    function(req, res) {
      console.log(req.user);
      res.redirect('/');
    });

app.listen(3000);
