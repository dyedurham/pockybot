import Winners from '../lib/response-triggers/winners';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'ciscospark/env';
import PockyDB from '../lib/PockyDB';
import { Client } from 'pg';
import { Role, ResultRow } from '../models/database';

const config = new Config(null);

beforeAll(() => {
	spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
		if (userid === 'goodID' && value === Role.Admin) {
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
	})
});

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

function createData() : ResultRow[] {
	return [{
		'receiver': 'mock receiver',
		'receiverid': 'mockID',
		'sender': 'mock sender',
		'comment': ' test'
	}];
}

function createDatabase(success : boolean, data : ResultRow[]) : PockyDB {
	let client = new Client();
	spyOn(client, 'connect').and.returnValue(new Promise(resolve => resolve()));
	let db = new PockyDB(client, null);

	if (success) {
		spyOn(db, 'returnWinners').and.returnValue(new Promise(resolve => resolve(data)));
	} else {
		spyOn(db, 'returnWinners').and.returnValue(new Promise((resolve, reject) => reject(new Error('Rejected!'))));
	}

	return db;
}

describe('creating winners responses', () => {
	let data : ResultRow[];
	let winners : Winners;

	beforeEach(() => {
		data = createData();
		winners = new Winners(null, config);
	})

	it('should parse a proper message', async (done : DoneFn) => {
		let message = await winners.createResponse(data);
		expect(message).toBe('```\n' +
'  Receiver    |   Sender    | Comments\n' +
'Total         |             | \n' +
'--------------+-------------+---------\n' +
'mock receiver |             | \n' +
'1             | mock sender |  test\n' +
'```');
		done();
	});
});

describe('creating a winners message', () => {
	let data : ResultRow[];
	let database : PockyDB;
	let winners : Winners;

	beforeEach(() => {
		data = createData();
		database = createDatabase(true, data);
		winners = new Winners(database, config);
	});

	it('should create a proper message', async (done : DoneFn) => {
		let message = await winners.createMessage();
		expect(message.markdown).toBe('```\n' +
'  Receiver    |   Sender    | Comments\n' +
'Total         |             | \n' +
'--------------+-------------+---------\n' +
'mock receiver |             | \n' +
'1             | mock sender |  test\n' +
'```');
		done();
	});
});

describe('failing at creating a winners message', () => {
	let database : PockyDB;
	let winners : Winners;

	beforeEach(() => {
		database = createDatabase(false, null);
		winners = new Winners(database, config);
	});

	it('should create a proper message on fail', async (done : DoneFn) => {
		try {
			await winners.createMessage();
			fail('should have thrown an error');
		} catch (error) {
			expect(error.message).toBe('Error encountered; cannot display winners.');
		}

		done();
	});
});

describe('testing winners triggers', () => {
	let winners : Winners;

	beforeEach(() => {
		winners = new Winners(null, config);
	});

	it('should accept trigger', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfwinners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="notabotid">' + constants.botName + '</spark-mention> winners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>winners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners ',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it('should fail with non admin', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners',
			'badID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});
});
