var statusService = require(__base + "lib/response-triggers/status");
const constants = require(__base + `constants`);

const config = {

	checkRole(userid, value) {
		if (userid == 'mockunlimitedID' && value == 'unmetered') {
			return true;
		} else {
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

function createPrivateMessage(message) {
	return {
		text: message
	}
}

function createDatabase(statusSuccess, statusResponse) {
	return {
		getPegsGiven: function (_person) {
			return new Promise((resolve, reject) => {
				if (statusSuccess) {
					resolve(statusResponse);
				} else {
					reject();
				}
			});
		}
	}
}

function createSparkMock() {
	return {
		people: {
			get: function(name) {
				return new Promise((resolve, reject) => {
					resolve({
						displayName: name+'display'
					})
				})
			}
		}
	}
}

describe("creating Message", function() {

    it("should show the remaining pegs", function (done) {
        const expectedCount = config.getConfig('limit') - 3;
		var database = createDatabase(true,
			[
				{receiver: 'test', comment: 'trsioetnsrio'},
				{receiver: 'test3', comment: 'trsioetnsrio'},
				{receiver: 'test2', comment: 'trsioetnsrio'}
			]);
        var status = new statusService(createSparkMock(), database, config);
        var sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> status',
            'person!');
        status.createMessage(sentMessage)
        .then((message) => {
            expect(message.markdown).toContain(`You have ${expectedCount} pegs left to give.`);
            done();
        });
    });

    it("should show the remaining pegs", function (done) {
        const expectedCount = config.getConfig('limit') - 3;
		var database = createDatabase(true,
			[
				{receiver: 'test', comment: 'trsioetnsrio'},
				{receiver: 'test3', comment: 'trsioetnsrio'},
				{receiver: 'test2', comment: 'trsioetnsrio'}
			]);
        var status = new statusService(createSparkMock(), database, config);
        var sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> status',
            'mockunlimitedID');
        status.createMessage(sentMessage)
        .then((message) => {
            expect(message.markdown).toContain(`You have unlimited pegs left to give.`);
            done();
        });
    });

	it("should send the message to the the sender", function (done) {
        const expectedCount = config.getConfig('limit') - 3;
		var database = createDatabase(true,
			[
				{receiver: 'test', comment: 'trsioetnsrio'},
				{receiver: 'test3', comment: 'trsioetnsrio'},
				{receiver: 'test2', comment: 'trsioetnsrio'}
			]);
        var status = new statusService(createSparkMock(), database, config);
        var sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> status',
            'person!');
        status.createMessage(sentMessage)
        .then((message) => {
            expect(message.toPersonId).toBe('person!');
            done();
        });
    });

	it("should have the items in the message", function (done) {
		const expectedCount = config.getConfig('limit') - 3;
		var database = createDatabase(true,
			[
				{receiver: 'test', comment: 'trsioetnsrio'},
				{receiver: 'test3', comment: 'dtsdsrtdrsdpf'},
				{receiver: 'test2', comment: 'trsioetnsrio'}
			]);
		var status = new statusService(createSparkMock(), database, config);
		var sentMessage = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> status',
			'person!');
		status.createMessage(sentMessage)
		.then((message) => {
			expect(message.markdown).toContain('* **test3display** — "_dtsdsrtdrsdpf_"');
			done();
		});
	});
});

describe("testing triggers", function() {
	const status = new statusService(createSparkMock(), null, config);

	const TriggerTestCases = [
		{ text: `${constants.mentionMe} status`, expectedTriggered: true },
		{ text: `${constants.mentionMe}status`, expectedTriggered: true },
		{ text: `${constants.mentionMe} status `, expectedTriggered: true },
		{ text: `<p><spark-mention data-object-type="person" data-object-id="` + constants.botId + `">` + constants.botName + `</spark-mention> status</p>`, expectedTriggered: true },
		{ text: `${constants.mentionMe} status me`, expectedTriggered: false }];
	TriggerTestCases.forEach(spec => {
		it(`should${spec.expectedTriggered ? '':' not'} trigger when ${spec.text}`, () => {
			const result = status.isToTriggerOn(createMessage(spec.text));
			expect(result).toEqual(spec.expectedTriggered);
		});
	});
});

describe("testing PM triggers", function() {
	const status = new statusService(createSparkMock(), null, config);
	it("should accept trigger", function () {
		var message = createPrivateMessage('status');
		var results = status.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createPrivateMessage('sssting');
		var results = status.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it("should accept whitespace around", function () {
		var message = createPrivateMessage(' status ');
		var results = status.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it("should accept capitalised command", function () {
		var message = createPrivateMessage('Status');
		var results = status.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
