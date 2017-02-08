var express = require('express');
var app = express();

// Controllers
var postsController = require('cloud/controllers/postsController.js');
var usersController = require('cloud/controllers/usersController.js');
var sourcesController = require('cloud/controllers/sourcesController.js');
var sessionChecker = require('cloud/middleware/sessionChecker.js');

// Global app configuration section
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());

app.get('/api/me', sessionChecker.interceptor, usersController.me);
app.get('/api/posts', sessionChecker.interceptor, postsController.list);
app.post('/api/post', sessionChecker.interceptor, postsController.save);
app.post('/api/deletePosts', sessionChecker.interceptor, postsController.delete);
app.put('/api/notifyPosts', sessionChecker.interceptor, postsController.notify); 
app.get('/api/sources', sessionChecker.interceptor, sourcesController.list);
app.put('/api/source', sessionChecker.interceptor, sourcesController.update);
app.get('/api/forcePush', postsController.forcePush);
app.listen();
