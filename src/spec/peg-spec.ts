import Peg from '../lib/response-triggers/peg';
import constants from '../constants';
import Config from '../lib/config';
import PockyDB from '../lib/PockyDB';
import MockCiscoSpark from './mocks/mock-spark';
import { Client } from 'pg';
import { MessageObject } from 'ciscospark/env';

const config = new Config(null);
beforeAll(() => {
	spyOn(config, 'getConfig').and.callFake((config : string) => {
		if (config == 'limit') {
			return 10;
		}
		else if (config == 'minimum') {
			return 5;
		}
		else if (config == 'winners') {
			return 3;
		}
		else if (config == 'commentsRequired') {
			return 1;
		}
		else if (config == 'pegWithoutKeyword') {
			return 0;
		}
		else if (config == 'requireValues') {
			return 1;
		}

		throw new Error("bad config");
	});

	spyOn(config, 'getStringConfig').and.callFake((config : string) => {
		if (config == 'keyword') {
			return ["customer", "brave", "awesome", "collaborative", "real"];
		}

		throw new Error("bad config");
	});
})

const spark = new MockCiscoSpark();

function createMessage(htmlMessage : string, person : string,
		mentionedFirst = constants.botId, mentionedSecond = 'aoeuidhtns') : MessageObject {
	return {
		html: htmlMessage,
		personId: person,
		mentionedPeople: [mentionedFirst, mentionedSecond]
	};
}

function createDatabase(givePegSuccess : boolean, givePegResponse : number, countSuccess : boolean, countResponse : number) : PockyDB {
	let client = new Client();
	spyOn(client, 'connect').and.returnValue(new Promise(resolve => resolve()));
	let db = new PockyDB(client, null);

	if (givePegSuccess) {
		spyOn(db, 'givePegWithComment').and.returnValue(new Promise((resolve, reject) => resolve(givePegResponse)));
	} else {
		spyOn(db, 'givePegWithComment').and.returnValue(new Promise((resolve, reject) => reject()));
	}

	if (countSuccess) {
		spyOn(db, 'countPegsGiven').and.returnValue(new Promise((resolve, reject) => resolve(countResponse)));
	} else {
		spyOn(db, 'countPegsGiven').and.returnValue(new Promise((resolve, reject) => reject()));
	}

	spyOn(db, 'getUser').and.returnValue(new Promise((resolve, reject) => resolve({username: 'mock name', userid: 'mockID'})));

	return db;
}

describe("creating Message", function() {
	it("should create a proper message - 1 peg", function (done) {
		let database = createDatabase(true, 0, true, 1);
		let peg = new Peg(spark, database, config);

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe("Peg given to mock name. You have given 1 peg this fortnight.");
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should create a proper message - 2 pegs", function (done) {
		let database = createDatabase(true, 0, true, 2);
		let peg = new Peg(spark, database, config);

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe("Peg given to mock name. You have given 2 pegs this fortnight.");
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should fail to give peg - out of pegs", function (done) {
		let database = createDatabase(true, 1, true, 2);
		let peg = new Peg(null, database, config);

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe("Sorry, but you have already spent all of your pegs for this fortnight.");
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should fail to give peg - exception", function (done) {
		let database = createDatabase(true, 2, true, 2);
		let peg = new Peg(null, database, config);
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe("Error encountered, peg not given");
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should fail to peg with no comment", function (done) {
		let database = createDatabase(true, 0, true, 2);
		let peg = new Peg(null, database, config);

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention></p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe(
`I'm sorry, I couldn't understand your peg request. Please use the following format:
@` + constants.botName + ` peg @Person this is the reason for giving you a peg`
			);
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should fail to peg with no comment with space", function (done) {
		let database = createDatabase(true, 0, true, 2);
		let peg = new Peg(null, database, config);
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> </p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe(
`I'm sorry, I couldn't understand your peg request. Please use the following format:
@` + constants.botName + ` peg @Person this is the reason for giving you a peg`
			);
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should give peg with 'to' keyword", function(done) {
		let database = createDatabase(true, 0, true, 1);
		let peg = new Peg(spark, database, config);

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> to <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe("Peg given to mock name. You have given 1 peg this fortnight.");
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should work with multiple keywords", function(done) {
		let database = createDatabase(true, 0, true, 1);
		let peg = new Peg(spark, database, config);

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg to <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe("Peg given to mock name. You have given 1 peg this fortnight.");
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should fail with no keyword", function(done) {
		let database = createDatabase(true, 0, true, 2);
		let peg = new Peg(null, database, config);
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe(
`I'm sorry, I couldn't understand your peg request. Please use the following format:
@` + constants.botName + ` peg @Person this is the reason for giving you a peg`
			);
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should fail with embedded keyword", function(done) {
		let database = createDatabase(true, 0, true, 2);
		let peg = new Peg(null, database, config);
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe(
				`I'm sorry, I couldn't understand your peg request. Please use the following format:
@${constants.botName} peg @Person this is the reason for giving you a peg`
			);
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should work with two spaces", function(done) {
		let database = createDatabase(true, 0, true, 1);
		let peg = new Peg(spark, database, config);

		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>  peg  <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe("Peg given to mock name. You have given 1 peg this fortnight.");
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should work with three spaces", function(done) {
		let database = createDatabase(true, 0, true, 1);
		let peg = new Peg(spark, database, config);
		let sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>   peg <spark-mention data-object-type="person" data-object-id="mockID">ShameBot</spark-mention> with an awesome comment</p>',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe("Peg given to mock name. You have given 1 peg this fortnight.");
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should work with iPhone format", function(done) {
		let database = createDatabase(true, 0, true, 1);
		let peg = new Peg(spark, database, config);
		let sentMessage = createMessage('<spark-mention data-object-id="mockappleID" data-object-type="person">' + constants.botName + '</spark-mention> peg <spark-mention data-object-id="aoeuidhtns" data-object-type="person">Bob</spark-mention> for awesome reasons',
			'mockfromID');
		peg.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toBe("Peg given to mock name. You have given 1 peg this fortnight.");
			done();
		}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	});

	it("should work with ampersand", function(done) {
		let database = createDatabase(true, 0, true, 1);
		let peg = new Peg(spark, database, config);
		let sentMessage = createMessage('<spark-mention data-object-id="mockappleID" data-object-type="person">' + constants.botName + '</spark-mention> peg <spark-mention data-object-id="aoeuidhtns" data-object-type="person">Bob</spark-mention> for awesome reasons &amp; stuff',
			'mockfromID');
		peg.createMessage(sentMessage)
			.then((message) => {
				expect(message.markdown).toBe("Peg given to mock name. You have given 1 peg this fortnight.");
				done();
			}).catch((error) => {
			expect(true).toBe(false);
			done();
		});
	})
});

describe("testing triggers", function() {
	let peg = new Peg(null, null, config);
	it("should accept trigger", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for reasons</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});

	it("should reject wrong command", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> yipeg</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(false);
	});

	it("should reject wrong id", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="notabotID">' + constants.botName + '</spark-mention> peg</p>', null, 'mockID');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(false);
	});

	it("should accept no space", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>peg<spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for reasons</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});

	it("should accept trailing space", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for reasons  </p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});

	it("should accept iPhone format", function() {
		let message = createMessage('<spark-mention data-object-id="mockappleID" data-object-type="person">' + constants.botName + '</spark-mention> peg <spark-mention data-object-id="aoeuidhtns" data-object-type="person">Bob</spark-mention> for reasons', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});

	it("should reject unpeg trigger", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for reasons</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(false);
	});

	it('should reject another unpeg trigger', () => {
		let message = createMessage('<spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> unpeg <spark-mention data-object-type="person" data-object-id="mockID">Jim</spark-mention> for how many times he has broken pockey bot', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(false);
	})
});

describe("testing keywords in messages", function() {
	let peg = new Peg(null, null, config);
	it("should reject with no keyword", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for reasons</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});

	it("should accept with multiple keywords", function () {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> peg <spark-mention data-object-type="person" data-object-id="aoeuidhtns">John</spark-mention> for customer, brave, awesome, collaborative, real reasons</p>', 'personId');
		let results = peg.isToTriggerOn(message);
		expect(results).toBe(true);
	});
});
