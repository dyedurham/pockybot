import constants from '../constants';
import Ping from '../lib/response-triggers/ping';

function createMessage(htmlMessage : string) {
	return {
		html: htmlMessage
	}
}

function createPrivateMessage(message : string) {
	return {
		text: message
	}
}

describe("testing response", function() {
	const ping = new Ping();

	it("should pong", function (done) {
		ping.createMessage()
		.then((response) => {
			expect(response.markdown).toBe("pong. I'm alive!");
			done();
		});
	});
});

describe("testing triggers", function() {
	const ping = new Ping();

	it("should accept trigger", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> ping');
		var results = ping.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> yiping');
		var results = ping.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it("should reject wrong id", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="notabotID">' + constants.botName + '</spark-mention> ping');
		var results = ping.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it("should accept no space", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>ping');
		var results = ping.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it("should accept trailing space", function () {
		var message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> ping ');
		var results = ping.isToTriggerOn(message)
		expect(results).toBe(true);
	});
});

describe("testing PM triggers", function() {
	const ping = new Ping();

	it("should accept trigger", function () {
		var message = createPrivateMessage('ping');
		var results = ping.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createPrivateMessage('ponggg');
		var results = ping.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it("should accept whitespace around", function () {
		var message = createPrivateMessage(' ping ');
		var results = ping.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it("should accept capitalised command", function () {
		var message = createPrivateMessage('Ping');
		var results = ping.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
