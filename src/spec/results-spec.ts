import Results from '../lib/response-triggers/results';
import constants from '../constants';

const config = {
	checkRole(userid, value) {
		if (userid == 'mockAdminID' && value.toUpperCase() == 'ADMIN') {
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

function createSparkMock() {
	return {
		messages: {
			create: function() {
				return new Promise((resolve, reject) => {
					resolve();
				})
			}
		}
	}
}

function createData() {
	return [{
		"receiver": "mock receiver",
		"pegsreceived": "3",
		"sender": "mock sender",
		"comment": " test",
		"receiverid": "mockID"
	}];
}

function createDatabase(success, data) {
	return {
		returnResults: function () {
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
	var today = new Date();
	var todayString = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
	var data = createData();
	var spark = createSparkMock();
	var results = new Results(spark, null, null, config);
	it("should parse a proper message", function (done) {
		results.createResponse(data)
		.then((message) => {
			expect(message.markdown).toBe(`Here are all pegs given this fortnight ([beta html view](http://pocky-bot.storage.googleapis.com/pegs-${todayString}.html))`);
			expect(message.files[0]).toBe(constants.fileURL + "?filename=" +  "pegs-" + todayString + ".txt");
			expect(message.files.length).toBe(1);
			done();
		});
	});
});

describe("creating a message", function() {
	var today = new Date();
	var todayString = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
	var data = createData();
	var database = createDatabase(true, data);
	var spark = createSparkMock();
	var results = new Results(spark, database, null, config);
	it("should create a proper message", function (done) {
		results.createMessage()
		.then((message) => {
			expect(message.markdown).toBe(`Here are all pegs given this fortnight ([beta html view](http://pocky-bot.storage.googleapis.com/pegs-${todayString}.html))`);
			expect(message.files[0]).toBe(constants.fileURL + "?filename=" +  "pegs-" + todayString + ".txt");
			expect(message.files.length).toBe(1);
			done();
		});
	});
});

describe("failing at creating a message", function() {
	var database = createDatabase(false, null);

	var results = new Results(null, database, null, config);
	it("should create a proper message on fail", function (done) {
		results.createMessage().then((data) => {
			fail("should have thrown an error");
		}).catch((error) => {
			expect(error.message).toBe("Error encountered; cannot display results.")
		});
		done();
	});
});

describe("testing triggers", function() {
	var results = new Results(null, null, null, config);
	it("should accept trigger", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results',
			'mockAdminID');
		var triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfresults',
			'mockAdminID');
		var triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it("should reject wrong id", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="badID">' + constants.botName + '</spark-mention> results',
			'mockAdminID');
		var triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});

	it("should accept no space", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>results',
			'mockAdminID');
		var triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it("should accept trailing space", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results ',
			'mockAdminID');
		var triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(true);
	});

	it("should fail with non admin", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> results',
			'mockID');
		var triggered = results.isToTriggerOn(message)
		expect(triggered).toBe(false);
	});
});
