import Stringconfig from '../lib/response-triggers/stringconfig';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'ciscospark/env';
import { Role } from '../models/database';

const config = new Config(null);

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

function createPrivateMessage(message : string, person : string) : MessageObject {
	return {
		text: message,
		personId: person
	}
}

beforeAll(() => {
	spyOn(config, 'getAllStringConfig').and.callFake(() => {
		return [{
			name: 'test',
			value: 'test'
		}];
	});

	spyOn(config, 'setStringConfig').and.callFake(() => {
		return;
	});

	spyOn(config, 'updateStringConfig').and.callFake(() => {
		return;
	});

	spyOn(config, 'deleteStringConfig').and.callFake(() => {
		return;
	});

	spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
		if (userid === 'mockAdminID' && value === Role.Admin) {
			return true;
		}
		else {
			return false;
		}
	});
})

describe('configuration message parsing', () => {
	const configuration = new Stringconfig(config);

	beforeEach(() => {
		(config.updateStringConfig as jasmine.Spy).calls.reset();
		(config.getAllStringConfig as jasmine.Spy).calls.reset();
		(config.setStringConfig as jasmine.Spy).calls.reset();
		(config.deleteStringConfig as jasmine.Spy).calls.reset();
		(config.checkRole as jasmine.Spy).calls.reset();
	});

	it('should create the get message', async (done : DoneFn) => {
		const helpMessage = { text: 'config get'};
		let response = await configuration.createMessage(helpMessage);
		expect(response.markdown).toContain(
`Here is the current config:
Name | Value
test | test
`
		);
		done();
	});

	it('should create with a number paramater', async (done : DoneFn) => {
		const helpMessage = { text: 'stringConfig set test 1'};
		let response = await configuration.createMessage(helpMessage);
		expect(config.setStringConfig).toHaveBeenCalledWith('test', '1');
		expect(response.markdown).toBe("Config has been set");
		done();
	});

	it('should create the set string message', async (done : DoneFn) => {
		const helpMessage = { text: 'stringConfig set test value'};
		let response = await configuration.createMessage(helpMessage);
		expect(config.setStringConfig).toHaveBeenCalledWith('test', 'value');
		expect(response.markdown).toBe("Config has been set");
		done();
	});

	it('should create the set string message with mixed input', async (done : DoneFn) => {
		const helpMessage = { text: 'stringConfig set test test123'};
		let response = await configuration.createMessage(helpMessage);
		expect(config.setStringConfig).toHaveBeenCalledWith('test', 'test123');
		expect(response.markdown).toBe("Config has been set");
		done();
	});

	it('should create the refresh message', async (done : DoneFn) => {
		const helpMessage = { text: 'stringConfig refresh'};
		let response = await configuration.createMessage(helpMessage);
		expect(config.updateStringConfig).toHaveBeenCalled();
		expect(response.markdown).toBe("Config has been updated");
		done();
	});

	it('should create the delete message', async (done : DoneFn) => {
		const helpMessage = { text: 'stringConfig delete test value'};
		let response = await configuration.createMessage(helpMessage);
		expect(config.deleteStringConfig).toHaveBeenCalledWith('test', 'value');
		expect(response.markdown).toBe("Config has been deleted");
		done();
	});

	it('should fail to create the delete message with no config specified', async (done : DoneFn) => {
		const helpMessage = { text: 'numberconfig delete'};
		let response = await configuration.createMessage(helpMessage);
		expect(response.markdown).toBe("You must specify a config name and value to be deleted");
		done();
	});
});

describe('testing configuration triggers', () => {
	const configuration = new Stringconfig(config);

	it('should accept trigger', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig`,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdfstringConfig`,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="wrongId">${constants.botName}</spark-mention> stringConfig`,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>stringConfig`,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig `,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should fail for non admin', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig`,
			'mockID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept an additional parameter', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig get`,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should fail with only config', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> config`,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(false);
	});
});

describe('testing configuration PM triggers', () => {
	const configuration = new Stringconfig(config);

	it('should accept trigger', () => {
		let message = createPrivateMessage('stringConfig', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createPrivateMessage('helooo', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept whitespace around', () => {
		let message = createPrivateMessage(' stringConfig ', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should accept capitalised command', () => {
		let message = createPrivateMessage('stringConfig', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should fail for non admin PM', () => {
		let message = createPrivateMessage('stringConfig', "mockID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept an additional parameter', () => {
		let message = createPrivateMessage('stringConfig get', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should fail with only config', () => {
		let message = createPrivateMessage('Config', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});
});
