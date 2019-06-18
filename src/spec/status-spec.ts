import Status from '../lib/response-triggers/status';
import constants from '../constants';
import Config from '../lib/config';
import { PockyDB } from '../lib/database/db-interfaces';
import MockWebex from './mocks/mock-spark';
import { MessageObject } from 'webex/env';
import { Role } from '../models/database';
import MockPockyDb from './mocks/mock-pockydb';
import Utilities from '../lib/utilities';

const config = new Config(null);
const webex = new MockWebex();

beforeAll(() => {
	spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
		if (userid === 'mockunlimitedID' && value === Role.Unmetered) {
			return true;
		} else {
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

	spyOn(webex.people, 'get').and.callFake((name : string) => {
		return new Promise((resolve, reject) => {
			resolve({
				id: name,
				displayName: name + 'display',
				emails: [],
				created: new Date(),
				type: 'person'
			});
		})
	});
});

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

function createPrivateMessage(message : string) : MessageObject {
	return {
		text: message
	}
}

function createDatabase(statusSuccess : boolean, statusResponse) : PockyDB {
	let db = new MockPockyDb(true, 0, true, 1);

	if (statusSuccess) {
		spyOn(db, 'getPegsGiven').and.returnValue(new Promise((resolve, reject) => resolve(statusResponse)));
	} else {
		spyOn(db, 'getPegsGiven').and.returnValue(new Promise((resolve, reject) => reject()));
	}

	return db;
}

describe('creating status message', () => {
	it('should show the remaining pegs', async (done : DoneFn) => {
		const expectedCount = config.getConfig('limit') - 3;
		let database = createDatabase(true,
			[
				{receiver: 'test', comment: 'trsioetnsrio'},
				{receiver: 'test3', comment: 'trsioetnsrio'},
				{receiver: 'test2', comment: 'trsioetnsrio'}
			]);
		const utilities = new Utilities(config);
		spyOn(utilities, 'getNonPenaltyPegs').and.callFake((givenPegs : []) => new Array(givenPegs.length));

		let status = new Status(webex, database, config, utilities);
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> status',
			'person!');
		let message = await status.createMessage(sentMessage);
		expect(message.markdown).toContain(`You have ${expectedCount} pegs left to give.`);
		done();
	});

	it('should show the remaining pegs', async (done : DoneFn) => {
		const expectedCount = config.getConfig('limit') - 3;
		let database = createDatabase(true,
			[
				{receiver: 'test', comment: 'trsioetnsrio'},
				{receiver: 'test3', comment: 'trsioetnsrio'},
				{receiver: 'test2', comment: 'trsioetnsrio'}
			]);
		const utilities = new Utilities(config);
		spyOn(utilities, 'getNonPenaltyPegs').and.callFake((givenPegs : []) => new Array(givenPegs.length));

		let status = new Status(webex, database, config, utilities);
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> status',
			'mockunlimitedID');
		let message = await status.createMessage(sentMessage);
		expect(message.markdown).toContain(`You have unlimited pegs left to give.`);
		done();
	});

	it('should send the message to the the sender', async (done : DoneFn) => {
		const expectedCount = config.getConfig('limit') - 3;
		let database = createDatabase(true,
			[
				{receiver: 'test', comment: 'trsioetnsrio'},
				{receiver: 'test3', comment: 'trsioetnsrio'},
				{receiver: 'test2', comment: 'trsioetnsrio'}
			]);
		const utilities = new Utilities(config);
		spyOn(utilities, 'getNonPenaltyPegs').and.callFake((givenPegs : []) => new Array(givenPegs.length));

		let status = new Status(webex, database, config, utilities);
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> status',
			'person!');
		let message = await status.createMessage(sentMessage);
		expect(message.toPersonId).toBe('person!');
		done();
	});

	it('should have the items in the message', async (done : DoneFn) => {
		const expectedCount = config.getConfig('limit') - 3;
		let database = createDatabase(true,
			[
				{receiver: 'test', comment: 'trsioetnsrio'},
				{receiver: 'test3', comment: 'dtsdsrtdrsdpf'},
				{receiver: 'test2', comment: 'trsioetnsrio'}
			]);
		const utilities = new Utilities(config);
		spyOn(utilities, 'getNonPenaltyPegs').and.callFake(() => {
			return [
				{receiver: 'test', comment: 'trsioetnsrio'},
				{receiver: 'test3', comment: 'dtsdsrtdrsdpf'},
				{receiver: 'test2', comment: 'trsioetnsrio'}
			];
		});

		let status = new Status(webex, database, config, utilities);
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> status',
			'person!');
		let message = await status.createMessage(sentMessage);
		expect(message.markdown).toContain('* **test3** — "_dtsdsrtdrsdpf_"');
		done();
	});
});

describe('testing status triggers', () => {
	const status = new Status(webex, null, config, null);

	const TriggerTestCases = [
		{ text: `${constants.mentionMe} status`, expectedTriggered: true },
		{ text: `${constants.mentionMe}status`, expectedTriggered: true },
		{ text: `${constants.mentionMe} status `, expectedTriggered: true },
		{ text: `<p><spark-mention data-object-type="person" data-object-id="` + constants.botId + `">` + constants.botName + `</spark-mention> status</p>`, expectedTriggered: true },
		{ text: `${constants.mentionMe} status me`, expectedTriggered: false },
		{ text: `<p><spark-mention data-object-type="groupMention" data-group-type="all">All</spark-mention> status`, expectedTriggered: false }];
	TriggerTestCases.forEach(spec => {
		it(`should${spec.expectedTriggered ? '':' not'} trigger when ${spec.text}`, () => {
			const result = status.isToTriggerOn(createMessage(spec.text, 'person'));
			expect(result).toEqual(spec.expectedTriggered);
		});
	});
});

describe('testing status PM triggers', () => {
	const status = new Status(webex, null, config, null);
	it('should accept trigger', () => {
		let message = createPrivateMessage('status');
		let results = status.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createPrivateMessage('sssting');
		let results = status.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept whitespace around', () => {
		let message = createPrivateMessage(' status ');
		let results = status.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should accept capitalised command', () => {
		let message = createPrivateMessage('Status');
		let results = status.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
