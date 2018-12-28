'use strict';
import __logger from './lib/logger';
import express from 'express';
import bodyParser from 'body-parser';
import responder from './lib/responder';
import pmResponder from './lib/pm-responder';
import * as url from 'url';
import * as fs from 'fs';

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

//Startup
import './lib/registerhooks';

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
		res.download(__dirname + '/' + query.filename);
	} catch (e) {
		__logger.error(`Error in server /results:\n${e.message}`);
		res.status(404).end();
	}
});

app.get('/test', function (req, res) {
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	fs.readFile(__dirname + '/' + query.filename, 'utf8', function(err, data) {
        if (err) {
			throw err;
		}

        __logger.debug(data);
        return res.send('<p style="font-family:monospace">' + data.replace(new RegExp('\r\n', 'g'), '<br/>').replace(new RegExp(' ', 'g'), '&nbsp;') + '</p>');
      })
});

app.listen(PORT, HOST);

__logger.debug(`Running on http://${HOST}:${PORT}`);
