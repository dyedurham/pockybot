import Winners from '../lib/response-triggers/winners';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'ciscospark/env';
import PockyDB from '../lib/PockyDB';
import { Client } from 'pg';

const config = new Config(null);

beforeAll(() => {
	spyOn(config, 'checkRole').and.callFake((userid : string, value : string) => {
		if (userid == 'goodID' && value.toUpperCase() == 'ADMIN') {
			return true;
		}
		else {
			return false;
		}
	});

	spyOn(config, 'getConfig').and.callFake((config : string) => {
		if (config == 'limit') {
			return 10;
		} else if (config == 'minimum') {
			return 5;
		} else if (config == 'winners') {
			return 3;
		} else if (config == 'commentsRequired') {
			return 1;
		} else if (config == 'pegWithoutKeyword') {
			return 0;
		}

		throw new Error("bad config");
	})
});

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

function createData() {
	return [{
		"receiver": "mock receiver",
		"receiverid": "mockID",
		"pegsreceived": "3",
		"sender": "mock sender",
		"comment": " test"
	}];
}

function createDatabase(success : boolean, data) : PockyDB {
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

describe("creating responses", function() {
	let data;
	let winners : Winners;

	beforeEach(() => {
		data = createData();
		winners = new Winners(null, null, config);
	})

	it("should parse a proper message", function (done) {
		winners.createResponse(data)
		.then((message) => {
			expect(message).toBe("```\n" +
"  Receiver    |   Sender    | Comments\n" +
"Total         |             | \n" +
"--------------+-------------+---------\n" +
"mock receiver |             | \n" +
"1             | mock sender |  test\n" +
"```");
			done();
		});
	});
});

describe("creating a message", function() {
	let data;
	let database : PockyDB;
	let winners : Winners;

	beforeEach(() => {
		data = createData();
		database = createDatabase(true, data);
		winners = new Winners(database, null, config);
	});

	it("should create a proper message", function (done) {
		winners.createMessage()
		.then((message) => {
			expect(message.markdown).toBe("```\n" +
"  Receiver    |   Sender    | Comments\n" +
"Total         |             | \n" +
"--------------+-------------+---------\n" +
"mock receiver |             | \n" +
"1             | mock sender |  test\n" +
"```");
			done();
		});
	});
});

describe("failing at creating a message", function() {
	let database : PockyDB;
	let winners : Winners;

	beforeEach(() => {
		database = createDatabase(false, null);
		winners = new Winners(database, null, config);
	});

	it("should create a proper message on fail", function (done) {
		winners.createMessage().then((data) => {
			fail("should have thrown an error");
		}).catch((error) => {
			expect(error.message).toBe("Error encountered; cannot display winners.")
		});
		done();
	});
});

describe("testing triggers", function() {
	let winners : Winners;

	beforeEach(() => {
		winners = new Winners(null, null, config);
	});

	it("should accept trigger", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it("should reject wrong command", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfwinners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it("should reject wrong id", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="notabotid">' + constants.botName + '</spark-mention> winners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it("should accept no space", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>winners',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it("should accept trailing space", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners ',
			'goodID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it("should fail with non admin", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners',
			'badID');
		let triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});
});
