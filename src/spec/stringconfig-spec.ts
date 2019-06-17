import Stringconfig from '../lib/response-triggers/stringconfig';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'webex/env';
import { Role } from '../models/database';

const config = new Config(null);

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
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

	spyOn(config, 'setStringConfig').and.stub();
	spyOn(config, 'updateStringConfig').and.stub();
	spyOn(config, 'deleteStringConfig').and.stub();

	spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
		if (userid === 'mockAdminID' && value === Role.Admin) {
			return true;
		}
		else {
			return false;
		}
	});

	spyOn(config, 'getStringConfig').and.callFake((config : string) => {
		if (config === 'test') {
			return ['value'];
		}

		return [];
	})
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
		const configMessage = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringconfig get` };
		let response = await configuration.createMessage(configMessage);
		expect(response.markdown).toContain(
`Here is the current config:
\`\`\`
Name | Value
test | test
\`\`\``
		);
		done();
	});

	it('should create with a number paramater', async (done : DoneFn) => {
		const configMessage = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig set test 1` };
		let response = await configuration.createMessage(configMessage);
		expect(config.setStringConfig).toHaveBeenCalledWith('test', '1');
		expect(response.markdown).toBe('Config has been set');
		done();
	});

	it('should create the set string message', async (done : DoneFn) => {
		const configMessage = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig set test value2` };
		let response = await configuration.createMessage(configMessage);
		expect(config.setStringConfig).toHaveBeenCalledWith('test', 'value2');
		expect(response.markdown).toBe('Config has been set');
		done();
	});

	it('should create the set string message with mixed input', async (done : DoneFn) => {
		const configMessage = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig set test test123` };
		let response = await configuration.createMessage(configMessage);
		expect(config.setStringConfig).toHaveBeenCalledWith('test', 'test123');
		expect(response.markdown).toBe('Config has been set');
		done();
	});

	it('should fail to set the config if the config already exists', async (done: DoneFn) => {
		const configMessage = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig set test value` };
		let response = await configuration.createMessage(configMessage);
		expect(config.setStringConfig).not.toHaveBeenCalled();
		expect(response.markdown).toBe('Config value "value" already exists in string config under name "test".');
		done();
	});

	it('should fail to set the config with no config specified', async (done: DoneFn) => {
		const configMessage = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig set` };
		let response = await configuration.createMessage(configMessage);
		expect(config.setStringConfig).not.toHaveBeenCalled();
		expect(response.markdown).toBe('You must specify a config name and value to set');
		done();
	});

	it('should create the refresh message', async (done : DoneFn) => {
		const configMessage = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig refresh` };
		let response = await configuration.createMessage(configMessage);
		expect(config.updateStringConfig).toHaveBeenCalled();
		expect(response.markdown).toBe('Config has been updated');
		done();
	});

	it('should create the delete message', async (done : DoneFn) => {
		const configMessage = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig delete test value` };
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteStringConfig).toHaveBeenCalledWith('test', 'value');
		expect(response.markdown).toBe('Config has been deleted');
		done();
	});

	it('should not delete config values which do not exist', async (done : DoneFn) => {
		const configMessage = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringConfig delete test dummy` };
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteStringConfig).not.toHaveBeenCalled();
		expect(response.markdown).toBe('Value "dummy" does not exist in string config under name "test"');
		done();
	});

	it('should fail to create the delete message with no config specified', async (done : DoneFn) => {
		const configMessage = { html: `<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> stringconfig delete`};
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteStringConfig).not.toHaveBeenCalled();
		expect(response.markdown).toBe('You must specify a config name and value to be deleted');
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
