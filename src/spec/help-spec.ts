import Help from '../lib/response-triggers/help';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'ciscospark/env';

const config = new Config(null);

function createMessage(htmlMessage : string) : MessageObject {
	return {
		html: htmlMessage
	}
}

function createPrivateMessage(message : string) : MessageObject {
	return {
		text: message
	}
}

beforeAll(() => {
	spyOn(config, 'getConfig').and.callFake((config : string) => {
		if (config == 'requireValues') {
			return 1;
		}

		throw new Error('bad config');
	});
})

describe('ponging the ping', function() {
	const help = new Help(config);

	it('should pong', function (done) {
		help.createMessage()
		.then((response) => {
			expect(response.markdown).toBeDefined();
			done();
		});
	});
});

describe('testing triggers', function() {
	const help = new Help(config);

	it('should accept trigger', function () {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> help`);
		let results = help.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', function () {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdfhelp`);
		let results = help.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', function () {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="wrongId">${constants.botName}</spark-mention> help`);
		let results = help.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', function () {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>help`);
		let results = help.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', function () {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> help `);
		let results = help.isToTriggerOn(message)
		expect(results).toBe(true);
	});
});

describe('testing PM triggers', function() {
	const help = new Help(config);

	it('should accept trigger', function () {
		let message = createPrivateMessage('help');
		let results = help.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', function () {
		let message = createPrivateMessage('helooo');
		let results = help.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept whitespace around', function () {
		let message = createPrivateMessage(' help ');
		let results = help.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should accept capitalised command', function () {
		let message = createPrivateMessage('Help');
		let results = help.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
