import Reset from '../lib/response-triggers/reset';
import constants from '../constants';
import Config from '../lib/config';
import { PockyDB } from '../lib/database/db-interfaces';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../models/database';
import MockPockyDb from './mocks/mock-pockydb';

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

function createMessage(htmlMessage : string, person : string, mentionId : string = constants.botId) : MessageObject {
	return {
		html: htmlMessage,
		personId: person,
		mentionedPeople: [ mentionId ]
	}
}

function createDatabase(success : boolean) : PockyDB {
	let db = new MockPockyDb(true, 0, true, 1);

	if (success) {
		spyOn(db, 'reset').and.returnValue(new Promise((resolve, reject) => resolve()));
	} else {
		spyOn(db, 'reset').and.returnValue(new Promise((resolve, reject) => reject('Rejected!')));
	}

	spyOn(db, 'returnResults').and.returnValue(new Promise((resolve, reject) => resolve()));

	return db;
}

describe('testing reset response', () => {
	let database : PockyDB;
	let reset : Reset;

	beforeEach(() => {
		database = createDatabase(true);
		reset = new Reset(database, config);
	});

	it('should reset', async (done : DoneFn) => {
		let response = await reset.createMessage();
		expect(response.markdown).toBe('Pegs cleared');
		done();
	});
});

describe('testing reset failed response', () => {
	let database : PockyDB;
	let reset : Reset;

	beforeEach(() => {
		database = createDatabase(false);
		reset = new Reset(database, config);
	})

	it('should display an error message', async (done : DoneFn) => {
		let response = await reset.createMessage();
		expect(response.markdown).toBe('Error clearing pegs');
		done();
	});
});

describe('testing reset triggers', () => {
	let reset : Reset;

	beforeEach(() => {
		reset = new Reset(null, config);
	})

	it('should accept trigger', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> reset',
		'mockadminID');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfreset',
		'mockadminID');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="Y2lzY29zcGFyazovL3VzL1BFT1BMRS9kMGFiNWE5ZS05MjliLTQ3N2EtOTk0MC00ZGJlN2QY2MzNzU">' + constants.botName + '</spark-mention> reset',
		'mockadminID', 'wrongid');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>reset',
		'mockadminID');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> reset ',
		'mockadminID');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should fail with non admin', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> reset',
		'mockID');
		let results = reset.isToTriggerOn(message)
		expect(results).toBe(false);
	});
});
