import Configuration from '../lib/response-triggers/configuration';
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

describe('configuration message parsing', () => {
	const configuration = new Configuration(config);

	it('should create the get message', async (done : DoneFn) => {
		const helpMessage = { text: 'config get'};
		let response = await configuration.createMessage(helpMessage);
		expect(response.markdown).toBe("");
		done();
	});

	it('should create the set message', async (done : DoneFn) => {
		const helpMessage = { text: 'config set test 1'};
		let response = await configuration.createMessage(helpMessage);
		expect(response.markdown).toBe("Config has been set");
		done();
	});

	it('should create the update message', async (done : DoneFn) => {
		const helpMessage = { text: 'config update'};
		let response = await configuration.createMessage(helpMessage);
		expect(response.markdown).toBe("Config has been updated");
		done();
	});
});

// describe('testing configuration triggers', () => {
// 	const configuration = new Configuration(config);

// 	it('should accept trigger', () => {
// 		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> help`);
// 		let results = configuration.isToTriggerOn(message)
// 		expect(results).toBe(true);
// 	});

// 	it('should reject wrong command', () => {
// 		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdfhelp`);
// 		let results = configuration.isToTriggerOn(message)
// 		expect(results).toBe(false);
// 	});

// 	it('should reject wrong id', () => {
// 		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="wrongId">${constants.botName}</spark-mention> help`);
// 		let results = configuration.isToTriggerOn(message)
// 		expect(results).toBe(false);
// 	});

// 	it('should accept no space', () => {
// 		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>help`);
// 		let results = configuration.isToTriggerOn(message)
// 		expect(results).toBe(true);
// 	});

// 	it('should accept trailing space', () => {
// 		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> help `);
// 		let results = configuration.isToTriggerOn(message)
// 		expect(results).toBe(true);
// 	});
// });

// describe('testing configuration PM triggers', () => {
// 	const configuration = new Configuration(config);

// 	it('should accept trigger', () => {
// 		let message = createPrivateMessage('help');
// 		let results = configuration.isToTriggerOnPM(message)
// 		expect(results).toBe(true);
// 	});

// 	it('should reject wrong command', () => {
// 		let message = createPrivateMessage('helooo');
// 		let results = configuration.isToTriggerOnPM(message)
// 		expect(results).toBe(false);
// 	});

// 	it('should accept whitespace around', () => {
// 		let message = createPrivateMessage(' help ');
// 		let results = configuration.isToTriggerOnPM(message)
// 		expect(results).toBe(true);
// 	});

// 	it('should accept capitalised command', () => {
// 		let message = createPrivateMessage('Help');
// 		let results = configuration.isToTriggerOnPM(message)
// 		expect(results).toBe(true);
// 	});
// });
