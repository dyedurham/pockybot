var welcomeService = require(__base + "lib/response-triggers/welcome");
const constants = require(__base + `constants`);

const config = {
	getStringConfig(config) {
		if (config == 'keyword') {
			return ["customer", "brave", "awesome", "collaborative", "real"];
		}

		throw new Error("bad config");
	},

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
	const welcome = new welcomeService(config);

	it("should pong", function (done) {
		welcome.createMessage()
		.then((response) => {
			expect(response.markdown == '').toBeFalsy();
			done();
		});
	});
});

describe("testing triggers", function() {
	const welcome = new welcomeService(config);

	it("should accept trigger", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> welcome');
		var results = welcome.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createMessage( '<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfwelcome');
		var results = welcome.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it("should reject wrong id", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="notabotid">' + constants.botName + '</spark-mention> welcome');
		var results = welcome.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it("should accept no space", function () {
		var message = createMessage( '<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>welcome');
		var results = welcome.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it("should accept trailing space", function () {
		var message = createMessage( '<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> welcome ');
		var results = welcome.isToTriggerOn(message)
		expect(results).toBe(true);
	});
});

describe("testing PM triggers", function() {
	const welcome = new welcomeService(config);

	it("should accept trigger", function () {
		var message = createPrivateMessage('welcome');
		var results = welcome.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createPrivateMessage('welccccc');
		var results = welcome.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it("should accept whitespace around", function () {
		var message = createPrivateMessage(' welcome ');
		var results = welcome.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it("should accept capitalised command", function () {
		var message = createPrivateMessage('Welcome');
		var results = welcome.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
