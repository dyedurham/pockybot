import Reset from '../lib/response-triggers/reset';
import constants from '../constants';

const config = {

	checkRole(userid, value) {
		if (userid == 'mockadminID' && value.toUpperCase() == 'ADMIN') {
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

function createDatabase(success) {
	return {
		reset: function () {
			return new Promise((resolve, reject) => {
				if (success) {
					resolve();
				} else {
					reject(new Error('Rejected!'));
				}
			});
		},
		returnResults: function () {
			return new Promise((resolve, reject) => {
				resolve();
			});
		}
	}
}

describe("testing response", function() {
	var database = createDatabase(true);
	var reset = new Reset(database, config);

	it("should reset", function (done) {
		reset.createMessage()
		.then((response) => {
			expect(response.markdown).toBe("Pegs cleared");
			done();
		});
	});
});

describe("testing failed response", function() {
	var database = createDatabase(false);
	var reset = new Reset(database, config);

	it("should display an error message", function (done) {
		reset.createMessage()
		.then((response) => {
			expect(response.markdown).toBe("Error clearing pegs");
			done();
		});
	});
});

describe("testing triggers", function() {
	var reset = new Reset(null, config);
	it("should accept trigger", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> reset',
		'mockadminID');
		var results = reset.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfreset',
		'mockadminID');
		var results = reset.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it("should reject wrong id", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="Y2lzY29zcGFyazovL3VzL1BFT1BMRS9kMGFiNWE5ZS05MjliLTQ3N2EtOTk0MC00ZGJlN2QY2MzNzU">' + constants.botName + '</spark-mention> reset',
		'mockadminID');
		var results = reset.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it("should accept no space", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>reset',
		'mockadminID');
		var results = reset.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it("should accept trailing space", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> reset ',
		'mockadminID');
		var results = reset.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it("should fail with non admin", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> reset',
		'mockID');
		var results = reset.isToTriggerOn(message)
		expect(results).toBe(false);
	});
});
