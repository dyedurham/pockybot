var winnersService = require(__base + "lib/response-triggers/winners");
const constants = require(__base + `constants`);

const config = {

	checkRole(userid, value) {
		if (userid == 'goodID' && value.toUpperCase() == 'ADMIN') {
			return true;
		}
		else {
			return false;
		}
	},

	getConfig(config) {
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
		throw new Error("bad config");
	}
}

function createMessage(htmlMessage, person) {
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

function createDatabase(success, data) {
	return {
		returnWinners: function () {
			return new Promise((resolve, reject) => {
				if (success) {
					resolve(data);
				} else {
					reject(new Error('Rejected!'));
				}
			});
		}
	}
}

describe("creating responses", function() {
	var data = createData();
	var winners = new winnersService(null, null, config);
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
	var data = createData();
	var database = createDatabase(true, data);
	var winners = new winnersService(database, null, config);
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
	var database = createDatabase(false, null);

	var winners = new winnersService(database, null, config);
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
	var winners = new winnersService(null, null, config);
	it("should accept trigger", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners',
			'goodID');
		var triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfwinners',
			'goodID');
		var triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it("should reject wrong id", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="notabotid">' + constants.botName + '</spark-mention> winners',
			'goodID');
		var triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it("should accept no space", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>winners',
			'goodID');
		var triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it("should accept trailing space", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners ',
			'goodID');
		var triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it("should fail with non admin", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> winners',
			'badID');
		var triggered = winners.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});
});
