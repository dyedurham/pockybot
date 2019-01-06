import Welcome from '../lib/response-triggers/welcome';
import constants from '../constants';
import { MessageObject } from 'ciscospark/env';
import Config from '../lib/config';

const config = new Config(null);

beforeAll(() => {
	spyOn(config, 'getStringConfig').and.callFake((config : string) => {
		if (config == 'keyword') {
			return ['customer', 'brave', 'awesome', 'collaborative', 'real'];
		}

		throw new Error('bad config');
	});

	spyOn(config, 'getConfig').and.callFake((config : string) => {
		if (config == 'requireValues') {
			return 1;
		}

		throw new Error('bad config');
	});
});

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

describe('ponging the ping', () => {
	const welcome = new Welcome(config);

	it('should pong', async (done : DoneFn) => {
		let response = await welcome.createMessage();
		expect(response.markdown == '').toBeFalsy();
		done();
	});
});

describe('testing triggers', () => {
	const welcome = new Welcome(config);

	it('should accept trigger', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> welcome');
		let results = welcome.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage( '<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> asdfwelcome');
		let results = welcome.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage('<p><spark-mention data-object-type="person" data-object-id="notabotid">' + constants.botName + '</spark-mention> welcome');
		let results = welcome.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage( '<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention>welcome');
		let results = welcome.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage( '<p><spark-mention data-object-type="person" data-object-id="' + constants.botId + '">' + constants.botName + '</spark-mention> welcome ');
		let results = welcome.isToTriggerOn(message)
		expect(results).toBe(true);
	});
});

describe('testing PM triggers', () => {
	const welcome = new Welcome(config);

	it('should accept trigger', () => {
		let message = createPrivateMessage('welcome');
		let results = welcome.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createPrivateMessage('welccccc');
		let results = welcome.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept whitespace around', () => {
		let message = createPrivateMessage(' welcome ');
		let results = welcome.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should accept capitalised command', () => {
		let message = createPrivateMessage('Welcome');
		let results = welcome.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});
});
