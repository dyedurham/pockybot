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

describe('help message', () => {
	const help = new Help(config);
	const helpMessage = { personId: 'asdfar', text: 'help'};

	it('should create the message', async (done : DoneFn) => {
		let response = await help.createMessage(helpMessage);
		expect(response.markdown).toBeDefined();
		done();
	});
});

describe('testing help triggers', () => {
	const help = new Help(config);

	it('should accept trigger', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> help`);
		let results = help.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdfhelp`);
		let results = help.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="wrongId">${constants.botName}</spark-mention> help`);
		let results = help.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>help`);
		let results = help.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> help `);
		let results = help.isToTriggerOn(message)
		expect(results).toBe(true);
	});
});

describe('testing help PM triggers', () => {
	const help = new Help(config);

	it('should accept trigger', () => {
		let message = createPrivateMessage('help');
		let results = help.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createPrivateMessage('helooo');
		let results = help.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept whitespace around', () => {
		let message = createPrivateMessage(' help ');
		let results = help.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should accept capitalised command', () => {
		let message = createPrivateMessage('Help');
		let results = help.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
