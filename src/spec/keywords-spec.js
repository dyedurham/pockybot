var keywordsService = require(__base + "src/lib/response-triggers/keywords");
const constants = require(__base + `constants`);

const config = {
	getStringConfig(config) {
		if (config == 'keyword') {
			return ["customer", "brave", "awesome", "collaborative", "real"];
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
	const keywords = new keywordsService(config);

	it("should pong", function (done) {
		keywords.createMessage()
		.then((response) => {
			expect(response.markdown).toBeDefined();
			done();
		});
	});
});

describe("testing triggers", function() {
	const keywords = new keywordsService(config);

	it("should accept trigger", function () {
		var message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> keywords`);
		var results = keywords.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdfkeywords`);
		var results = keywords.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it("should reject wrong id", function () {
		var message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="notabotID">${constants.botName}</spark-mention> keywords`);
		var results = keywords.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it("should accept no space", function () {
		var message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>keywords`);
		var results = keywords.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it("should accept trailing space", function () {
		var message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> keywords `);
		var results = keywords.isToTriggerOn(message)
		expect(results).toBe(true);
	});
});

describe("testing PM triggers", function() {
	const keywords = new keywordsService(config);

	it("should accept trigger", function () {
		var message = createPrivateMessage('keywords');
		var results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it("should reject wrong command", function () {
		var message = createPrivateMessage('keyyywrods');
		var results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it("should accept whitespace around", function () {
		var message = createPrivateMessage(' keywords ');
		var results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it("should accept capitalised command", function () {
		var message = createPrivateMessage('Keywords');
		var results = keywords.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
