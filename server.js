'use strict';
global.__base = __dirname + '/';
global.__logger = require(__base + 'lib/logger');

const express = require('express');
const bodyParser = require('body-parser');
const responder = require(__base + 'lib/responder');
const pmResponder = require(__base + 'lib/pm-responder');
const url = require('url');
const fs = require('fs');

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

//Startup
require(__base + 'lib/registerhooks');

// App
const app = express();
app.use(bodyParser.json()); // for parsing application/json

app.get('/', (req, res) => {
	res.status(200).end();
});

app.post('/respond', function (req, res) {
	responder.respond(req.body);
});

app.post('/pm', function (req, res) {
	pmResponder.respond(req.body);
});

app.get('/results', function (req, res) {
	try {
		var url_parts = url.parse(req.url, true);
		var query = url_parts.query;
		res.download(__base + query.filename);
	} catch (e) {
		__logger.error(`Error in server /results:\n${e.message}`);
		res.status(404).end();
	}
});

app.get('/test', function (req, res) {
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	fs.readFile(__base + query.filename, 'utf8', function(err, data) {
        if (err) {
			throw err;
		}

        __logger.debug(data);
        return res.send('<p style="font-family:monospace">' + data.replace(new RegExp('\r\n', 'g'), '<br/>').replace(new RegExp(' ', 'g'), '&nbsp;') + '</p>');
      })
});

app.listen(PORT, HOST);

__logger.debug(`Running on http://${HOST}:${PORT}`);
