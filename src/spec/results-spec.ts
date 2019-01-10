import Results from '../lib/response-triggers/results';
import constants from '../constants';
import Config from '../lib/config';
import PockyDB from '../lib/PockyDB';
import { Client } from 'pg';
import MockCiscoSpark from './mocks/mock-spark';
import { MessageObject } from 'ciscospark/env';
import { Role, ResultRow } from '../models/database';
import * as fs from 'fs';
import storage = require('@google-cloud/storage');

const config = new Config(null);
const spark = new MockCiscoSpark();
import sinon = require('sinon');

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

function createData() : ResultRow[] {
	return [{
		receiver: 'mock receiver',
		sender: 'mock sender',
		comment: ' test',
		receiverid: 'mockID'
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

describe('creating results responses', () => {
	let today = new Date();
	let todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
	let data = createData();
	let results = new Results(spark, null, config);

	beforeEach(() => {
		var fakeExistsSync = sinon.fake.returns(false);
		var fakeWriteFileSync = sinon.fake();

		sinon.replace(fs, 'existsSync', fakeExistsSync);
		sinon.replace(fs, 'writeFileSync', fakeWriteFileSync);

		var fakeStorage = sinon.fake.returns({
			bucket: (name : string) => { return {
				upload: (name : string) => { return null; }
			}}
		});

		sinon.stub(storage, 'Storage').callsFake(fakeStorage);
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should parse a proper message', async (done : DoneFn) => {
		let message = await results.createResponse(data);
		expect(message.markdown).toBe(`Here are all pegs given this fortnight ([beta html view](http://pocky-bot.storage.googleapis.com/pegs-${todayString}.html))`);
		expect(message.files[0]).toBe(`${constants.fileURL}?filename=pegs-${todayString}.html`);
		expect(message.files.length).toBe(1);
		done();
	});
});

describe('creating a results message', () => {
	let today : Date;
	let todayString : string;
	let data : ResultRow[];
	let database : PockyDB;
	let results : Results;

	beforeEach(() => {
		today = new Date();
		todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
		data = createData();
		database = createDatabase(true, data);
		results = new Results(spark, database, config);

		var fakeExistsSync = sinon.fake.returns(false);
		var fakeWriteFileSync = sinon.fake();

		sinon.replace(fs, "existsSync", fakeExistsSync);
		sinon.replace(fs, "writeFileSync", fakeWriteFileSync);

		var fakeStorage = sinon.fake.returns({
			bucket: (name : string) => { return {
				upload: (name : string) => { return null; }
			}}
		});

		sinon.stub(storage, 'Storage').callsFake(fakeStorage);
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should create a proper message', async (done : DoneFn) => {
		let message = await results.createMessage();
		expect(message.markdown).toBe(`Here are all pegs given this fortnight ([beta html view](http://pocky-bot.storage.googleapis.com/pegs-${todayString}.html))`);
		expect(message.files[0]).toBe(`${constants.fileURL}?filename=pegs-${todayString}.html`);
		expect(message.files.length).toBe(1);
		done();
	});
});

describe('failing at creating a results message', () => {
	let database : PockyDB;
	let results : Results;

	beforeEach(() => {
		database = createDatabase(false, null);
		results = new Results(null, database, config);
	});

	it('should create a proper message on fail', async (done : DoneFn) => {
		try {
			await results.createMessage();
			fail('should have thrown an error');
		} catch (error) {
			expect(error.message).toBe('Error encountered; cannot display results.')
		}

		done();
	});
});

describe('testing results triggers', () => {
	let results : Results;

	beforeEach(() => {
		results = new Results(null, null, config);
	});

	it('should accept trigger', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfresults',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="badID">' + constants.botName + '</spark-mention> results',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>results',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results ',
			'mockAdminID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should fail with non admin', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results',
			'mockID');
		let triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});
});
