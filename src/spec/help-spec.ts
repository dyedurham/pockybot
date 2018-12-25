import Help from '../lib/response-triggers/help';
import constants from '../constants';

const config = {
	getConfig(config) {
		if (config == 'requireValues') {
			return 1;
		}

		throw new Error("bad config");
	}
}

function createMessage(htmlMessage) {
	return {
		html: htmlMessage
	}
}

function createPrivateMessage(message) {
	return {
		text: message
	}
}

describe("ponging the ping", function() {
	const help = new Help(config);

	it("should pong", function (done) {
		help.createMessage()
		.then((response) => {
			expect(response.markdown).toBeDefined();
			done();
		});
	});
});

describe("testing triggers", function() {
	const help = new Help(config);

	it("should accept trigger", function () {
		var message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> help`);
		var results = help.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdfhelp`);
		var results = help.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it("should reject wrong id", function () {
		var message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="wrongId">${constants.botName}</spark-mention> help`);
		var results = help.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it("should accept no space", function () {
		var message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>help`);
		var results = help.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it("should accept trailing space", function () {
		var message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> help `);
		var results = help.isToTriggerOn(message)
		expect(results).toBe(true);
	});
});

describe("testing PM triggers", function() {
	const help = new Help(config);

	it("should accept trigger", function () {
		var message = createPrivateMessage('help');
		var results = help.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createPrivateMessage('helooo');
		var results = help.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it("should accept whitespace around", function () {
		var message = createPrivateMessage(' help ');
		var results = help.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it("should accept capitalised command", function () {
		var message = createPrivateMessage('Help');
		var results = help.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
