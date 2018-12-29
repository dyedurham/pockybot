import Reset from '../lib/response-triggers/reset';
import constants from '../constants';
import Config from '../lib/config';
import PockyDB from '../lib/PockyDB';
import { Client } from 'pg';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../models/database';

const config = new Config(null);

beforeAll(() => {
	spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
		if (userid === 'mockadminID' && value === Role.Admin) {
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
})

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

function createDatabase(success : boolean) : PockyDB {
	let client = new Client();
	spyOn(client, 'connect').and.returnValue(new Promise(resolve => resolve()));
	let db = new PockyDB(client, null);

	if (success) {
		spyOn(db, 'reset').and.returnValue(new Promise((resolve, reject) => resolve()));
	} else {
		spyOn(db, 'reset').and.returnValue(new Promise((resolve, reject) => reject('Rejected!')));
	}

	spyOn(db, 'returnResults').and.returnValue(new Promise((resolve, reject) => resolve()));

	return db;
}

describe('testing response', function() {
	let database : PockyDB;
	let reset : Reset;

	beforeEach(() => {
		database = createDatabase(true);
		reset = new Reset(database, config);
	});

	it('should reset', function (done) {
		reset.createMessage()
		.then((response) => {
			expect(response.markdown).toBe('Pegs cleared');
			done();
		});
	});
});

describe('testing failed response', function() {
	let database : PockyDB;
	let reset : Reset;

	beforeEach(() => {
		database = createDatabase(false);
		reset = new Reset(database, config);
	})

	it('should display an error message', function (done) {
		reset.createMessage()
		.then((response) => {
			expect(response.markdown).toBe('Error clearing pegs');
			done();
		});
	});
});

describe('testing triggers', function() {
	let reset : Reset;

	beforeEach(() => {
		reset = new Reset(null, config);
	})

	it('should accept trigger', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> reset',
		'mockadminID');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfreset',
		'mockadminID');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="Y2lzY29zcGFyazovL3VzL1BFT1BMRS9kMGFiNWE5ZS05MjliLTQ3N2EtOTk0MC00ZGJlN2QY2MzNzU">' + constants.botName + '</spark-mention> reset',
		'mockadminID');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>reset',
		'mockadminID');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> reset ',
		'mockadminID');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should fail with non admin', function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> reset',
		'mockID');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(false);
	});
});
