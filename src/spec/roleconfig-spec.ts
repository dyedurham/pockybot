import Roleconfig from '../lib/response-triggers/roleconfig';
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
	spyOn(config, 'getAllRoles').and.callFake(() => {
		return [{
			role: 'test',
			userid: 1
		}];
	});

	spyOn(config, 'setRole').and.stub();
	spyOn(config, 'updateRoles').and.stub();
	spyOn(config, 'deleteRole').and.stub();

	spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
		if (userid === 'mockAdminID' && value === Role.Admin) {
			return true;
		}
		else {
			return false;
		}
	});

	spyOn(config, 'getRoles').and.callFake((userid : string) => {
		if (userid === '1') {
			return ['UNMETERED'];
		}

		return [];
	})
})

describe('configuration message parsing', () => {
	const configuration = new Roleconfig(config);

	beforeEach(() => {
		(config.getAllRoles as jasmine.Spy).calls.reset();
		(config.setRole as jasmine.Spy).calls.reset();
		(config.updateRoles as jasmine.Spy).calls.reset();
		(config.deleteRole as jasmine.Spy).calls.reset();
		(config.checkRole as jasmine.Spy).calls.reset();
	});

	it('should create the get message', async (done : DoneFn) => {
		const configMessage = { text: 'roleconfig get'};
		let response = await configuration.createMessage(configMessage);
		expect(response.markdown).toContain(
`Here is the current config:
Name | Value
test | 1
`
		);
		done();
	});

	it('should create the set message', async (done : DoneFn) => {
		const configMessage = { text: 'roleconfig set test admin' };
		let response = await configuration.createMessage(configMessage);
		expect(config.setRole).toHaveBeenCalledWith('test', Role.Admin);
		expect(response.markdown).toBe('Role has been set');
		done();
	});

	it('should reject an invalid role name on create', async (done : DoneFn) => {
		const configMessage = { text: 'roleconfig set test test123' };
		let response = await configuration.createMessage(configMessage);
		expect(config.setRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe(`Invalid role. Valid values are: ${Object.values(Role).join(', ')}`);
		done();
	});

	it('should fail on no roles specified on create', async (done : DoneFn) => {
		const configMessage = { text: 'roleconfig set' };
		let response = await configuration.createMessage(configMessage);
		expect(config.setRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('You must specify a user and a role to set.');
		done();
	});

	it('should fail on create if the user is already set to the role', async (done : DoneFn) => {
		const configMessage = { text: 'roleconfig set 1 unmetered' };
		let response = await configuration.createMessage(configMessage);
		expect(config.setRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('Role "UNMETERED" is already set for user "1".')
		done();
	});

	it('should create the refresh message', async (done : DoneFn) => {
		const configMessage = { text: 'roleconfig refresh'};
		let response = await configuration.createMessage(configMessage);
		expect(config.updateRoles).toHaveBeenCalled();
		expect(response.markdown).toBe('Roles has been updated');
		done();
	});

	it('should create the delete message', async (done : DoneFn) => {
		const configMessage = { text: 'roleconfig delete 1 unmetered'};
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteRole).toHaveBeenCalledWith('1', Role.Unmetered)
		expect(response.markdown).toBe('Role has been deleted');
		done();
	});

	it('should not delete roles which don\'t exist', async (done : DoneFn) => {
		const configMessage = { text: 'roleconfig delete 1 admin'};
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('Role "ADMIN" is not set for user "1"');
		done();
	});

	it('should reject deleting an invalid role', async (done : DoneFn) => {
		const configMessage = { text: 'roleconfig delete 1 test'};
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe(`Invalid role. Valid values are: ${Object.values(Role).join(', ')}`);
		done();
	});

	it('should fail to create the delete message with no user specified', async (done : DoneFn) => {
		const configMessage = { text: 'roleconfig delete'};
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('You must specify a user and a role to be deleted');
		done();
	});

	it('should fail to create the delete message with no role specified', async (done : DoneFn) => {
		const configMessage = { text: 'roleconfig delete 1'};
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('You must specify a user and a role to be deleted');
		done();
	});
});

describe('testing configuration triggers', () => {
	const configuration = new Roleconfig(config);

	it('should accept trigger', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig`,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdfroleconfig`,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should reject wrong id', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="wrongId">${constants.botName}</spark-mention> roleconfig`,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept no space', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>roleconfig`,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should accept trailing space', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig `,
			'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(true);
	});

	it('should fail for non admin', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig`,
			'mockID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(false);
	});

	it('should accept an additional parameter', () => {
		let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig get`,
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
	const configuration = new Roleconfig(config);

	it('should accept trigger', () => {
		let message = createPrivateMessage('roleconfig', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should reject wrong command', () => {
		let message = createPrivateMessage('helooo', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept whitespace around', () => {
		let message = createPrivateMessage(' roleconfig ', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should accept capitalised command', () => {
		let message = createPrivateMessage('roleconfig', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should fail for non admin PM', () => {
		let message = createPrivateMessage('roleconfig', "mockID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});

	it('should accept an additional parameter', () => {
		let message = createPrivateMessage('roleconfig get', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(true);
	});

	it('should fail with only config', () => {
		let message = createPrivateMessage('Config', "mockAdminID");
		let results = configuration.isToTriggerOnPM(message)
		expect(results).toBe(false);
	});
});
