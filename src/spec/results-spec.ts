import Results from '../lib/response-triggers/results';
import constants from '../constants';
import Config from '../lib/config';
import PockyDB from '../lib/PockyDB';
import { Client } from 'pg';
import MockCiscoSpark from './mocks/mock-spark';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../models/database';

const config = new Config(null);
const spark = new MockCiscoSpark();

beforeAll(() => {
	spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
		if (userid === 'mockAdminID' && value === Role.Admin) {
			return true;
		}
		else {
			return false;
		}
	});

	spyOn(config, 'getConfig').and.callFake((config : string) => {
		if (config === 'limit') {
			return 10;
		} else if (config === 'minimum') {
			return 5;
		} else if (config === 'winners') {
			return 3;
		} else if (config === 'commentsRequired') {
			return 1;
		} else if (config === 'pegWithoutKeyword') {
			return 0;
		}

		throw new Error('bad config');
	});
});

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

function createData() {
	return [{
		'receiver': 'mock receiver',
		'pegsreceived': '3',
		'sender': 'mock sender',
		'comment': ' test',
		'receiverid': 'mockID'
	}];
}

function createDatabase(success : boolean, data) : PockyDB {
	let client = new Client();
	spyOn(client, 'connect').and.returnValue(new Promise(resolve => resolve()));
	let db = new PockyDB(client, null);

	if (success) {
		spyOn(db, 'returnResults').and.returnValue(new Promise((resolve, reject) => resolve(data)));
	} else {
		spyOn(db, 'returnResults').and.returnValue(new Promise((resolve, reject) => reject('Rejected!')));
	}

	return db;
}

describe('creating responses', function() {
	let today = new Date();
	let todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
	let data = createData();
	let results = new Results(spark, null, null, config);
	it('should parse a proper message', function (done) {
		results.createResponse(data)
		.then((message) => {
			expect(message.markdown).toBe(`Here are all pegs given this fortnight ([beta html view](http://pocky-bot.storage.googleapis.com/pegs-${todayString}.html))`);
			expect(message.files[0]).toBe(`${constants.fileURL}?filename=pegs-${todayString}.txt`);
			expect(message.files.length).toBe(1);
			done();
		});
	});
});

describe('creating a message', function() {
	let today : Date;
	let todayString : string;
	let data;
	let database : PockyDB;
	let results : Results;

	beforeEach(() => {
		today = new Date();
		todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
		data = createData();
		database = createDatabase(true, data);
		results = new Results(spark, database, null, config);
	});

	it('should create a proper message', function (done) {
		results.createMessage()
		.then((message) => {
			expect(message.markdown).toBe(`Here are all pegs given this fortnight ([beta html view](http://pocky-bot.storage.googleapis.com/pegs-${todayString}.html))`);
			expect(message.files[0]).toBe(`${constants.fileURL}?filename=pegs-${todayString}.txt`);
			expect(message.files.length).toBe(1);
			done();
		});
	});
});

describe('failing at creating a message', function() {
	let database : PockyDB;
	let results : Results;

	beforeEach(() => {
		database = createDatabase(false, null);
		results = new Results(null, database, null, config);
	});

	it('should create a proper message on fail', function (done) {
		results.createMessage().then((data) => {
			fail('should have thrown an error');
		}).catch((error) => {
			expect(error.message).toBe('Error encountered; cannot display results.')
		});
		done();
	});
});

describe('testing triggers', function() {
	let results : Results;

	beforeEach(() => {
		results = new Results(null, null, null, config);
	});

	it('should accept trigger', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should reject wrong command', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfresults',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should reject wrong id', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="badID">' + constants.botName + '</spark-mention> results',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should accept no space', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>results',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should accept trailing space', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results ',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should fail with non admin', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results',
			'mockID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});
});
