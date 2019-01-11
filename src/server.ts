'use strict';
import __logger from './lib/logger';
import * as express from 'express';
import * as bodyParser from 'body-parser';
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

app.post('/respond', async (req, res) => {
	try {
		await responder.respond(req.body);
		res.status(200).end();
	} catch (e) {
		__logger.error(`Error in server /respond:\n${e.message}`);
		res.status(400).end();
	}
});

app.post('/pm', async (req, res) => {
	try {
		await pmResponder.respond(req.body);
		res.status(200).end();
	} catch (e) {
		__logger.error(`Error in server /pm:\n${e.message}`);
		res.status(400).end();
	}
});

app.get('/test', (req, res) => {
	let url_parts = url.parse(req.url, true);
	let query = url_parts.query;
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
