var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var session = require('express-session')


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.use(session({secret: 'jamie is a total fucking boss, and errybody knows it'}))
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

var sess;

app.get('/', 
function(req, res) {
  if (req.session.loggedIn) { ///////11am

  res.render('index');////////

  } else {//////////
    res.redirect('/login');////////
  }////////////
});

app.get('/create', 
function(req, res) {
  if (req.session.loggedIn) { ///////11am

  res.render('index');////////

  } else {//////////
    res.redirect('/login');////////
  }////////////
});

app.get('/links', 
function(req, res) {
  if (req.session.loggedIn) { ///////11am
    Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
    });
  } else {//////////
    res.redirect('/login');////////
  }////////////
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

app.get('/signup', 
function(req, res) {
  res.render('signup');
});

app.post('/signup', 
function(req, res) {
  var body = req.body;
  var user = new User({username : body.username});
  user.fetch().then(function(found) {console.log('found',found)
    if (found) {
      res.send(418);

    } else {
        var user = new User(body);

        user.save().then(function(newUser) {
          Users.add(newUser);
          req.session.loggedIn = true;
          res.redirect('/');
        });
    }
  });
});

app.get('/login', 
function(req, res) {
  res.render('login');
});

app.post('/login', 
function(req, res) {
  var body = req.body;  
  new User({username : body.username}).fetch().then(function(found) {
    if(found){
      if (bcrypt.compareSync(body.password, found.get('password'))) {
        req.session.loggedIn = true;
        console.log(req.session.cookie)
        res.redirect('/');
      }
      else {
      console.log("Wrong username/password combination")
      res.redirect('/login');
      }
    }else {
      console.log("Wrong username/password combination")
      res.redirect('/login');
    }
  });
});
app.get('/logout', 
  function(req, res){
    req.session.destroy(function(err){})
    res.redirect('/login');
});
/************************************************************/
// Write your authentication routes here
/************************************************************/
/* some code for handling unautheroize posts and gets
if it is unauthorized, redirect
if !un then create a new user
on login, give cookie
on log out, delete cookie from database


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568 biatch');
app.listen(4568);
