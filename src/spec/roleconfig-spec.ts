import Roleconfig from '../lib/response-triggers/roleconfig';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'webex/env';
import { Role } from '../models/database';
import DbUsers from '../lib/database/db-users';
import { Client } from 'pg';
import QueryHandler from '../lib/database/query-handler';
import RoleConfig from '../lib/response-triggers/roleconfig';

const config = new Config(null);

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

function createDbUsers() : DbUsers {
	const client = new Client();
	spyOn(client, 'connect').and.callFake(() => {
		return Promise.resolve(undefined);
	});

	const queryHandler = new QueryHandler(client);
	spyOn(queryHandler, 'readFile').and.returnValue('');

	const dbUsers = new DbUsers(null, queryHandler);
	spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(new Promise((resolve, reject) => resolve(true)));
	spyOn(dbUsers, 'getUser').and.returnValue(new Promise((resolve, reject) => resolve({ userid: '1', username: 'Username'})));

	return dbUsers;
}

beforeAll(() => {
	spyOn(config, 'getAllRoles').and.callFake(() => {
		return [{
			role: Role.Unmetered,
			userid: '1'
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
			return [ Role.Unmetered ];
		}

		return [];
	});
})

describe('configuration message parsing', () => {
	let configuration : RoleConfig;

	beforeEach(() => {
		let dbUsers = createDbUsers();
		configuration = new Roleconfig(dbUsers, config);
	})

	beforeEach(() => {
		(config.getAllRoles as jasmine.Spy).calls.reset();
		(config.setRole as jasmine.Spy).calls.reset();
		(config.updateRoles as jasmine.Spy).calls.reset();
		(config.deleteRole as jasmine.Spy).calls.reset();
		(config.checkRole as jasmine.Spy).calls.reset();
	});

	it('should create the get message', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig get</p>` };
		let response = await configuration.createMessage(configMessage);
		expect(response.markdown).toContain(
`Here is the current config:
\`\`\`
  Name    | Value
UNMETERED | Username
\`\`\``
		);
		done();
	});

	it('should create the set message', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig set <spark-mention data-object-type="person" data-object-id="fakeUser">test</spark-mention> admin</p>` };
		let response = await configuration.createMessage(configMessage);
		expect(config.setRole).toHaveBeenCalledWith('fakeUser', Role.Admin);
		expect(response.markdown).toBe('Role has been set');
		done();
	});

	it('should reject an invalid role name on create', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig set <spark-mention data-object-type="person" data-object-id="1">test</spark-mention> test123</p>` };
		let response = await configuration.createMessage(configMessage);
		expect(config.setRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe(`Invalid role TEST123. Valid values are: ${Object.values(Role).join(', ')}`);
		done();
	});

	it('should fail on no roles specified on create', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig set</p>` };
		let response = await configuration.createMessage(configMessage);
		expect(config.setRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('You must specify a user and a role to set/delete.');
		done();
	});

	it('should fail on create if the user is already set to the role', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig set <spark-mention data-object-type="person" data-object-id="1">test</spark-mention> unmetered</p>` };
		let response = await configuration.createMessage(configMessage);
		expect(config.setRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('Role "UNMETERED" is already set for user "test".')
		done();
	});

	it('should fail on create with no proper spark mention', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig set test admin</p>` };
		let response = await configuration.createMessage(configMessage);
		expect(config.setRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('Unknown config command');
		done();
	});

	it('should create the refresh message', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig refresh</p>`};
		let response = await configuration.createMessage(configMessage);
		expect(config.updateRoles).toHaveBeenCalled();
		expect(response.markdown).toBe('Roles has been updated');
		done();
	});

	it('should create the delete message', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig delete <spark-mention data-object-type="person" data-object-id="1">1</spark-mention> unmetered</p>` };
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteRole).toHaveBeenCalledWith('1', Role.Unmetered)
		expect(response.markdown).toBe('Role has been deleted');
		done();
	});

	it('should not delete roles which don\'t exist', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig delete <spark-mention data-object-type="person" data-object-id="1">1</spark-mention> admin</p>`};
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('Role "ADMIN" is not set for user "1"');
		done();
	});

	it('should reject deleting an invalid role', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig delete <spark-mention data-object-type="person" data-object-id="1">1</spark-mention> test</p>`};
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe(`Invalid role TEST. Valid values are: ${Object.values(Role).join(', ')}`);
		done();
	});

	it('should fail to create the delete message with no user specified', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig delete</p>`};
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('You must specify a user and a role to set/delete.');
		done();
	});

	it('should fail to create the delete message with no role specified', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig delete <spark-mention data-object-type="person" data-object-id="1">1</spark-mention></p>`};
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('You must specify a user and a role to set/delete.');
		done();
	});

	it('should fail on delete with no proper spark mention', async (done : DoneFn) => {
		const configMessage = { html: `<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> roleconfig delete test unmetered</p>`};
		let response = await configuration.createMessage(configMessage);
		expect(config.deleteRole).not.toHaveBeenCalled();
		expect(response.markdown).toBe('Unknown config command');
		done();
	});
});

describe('testing configuration triggers', () => {
	let configuration : RoleConfig;

	beforeEach(() => {
		let dbUsers = createDbUsers();
		configuration = new Roleconfig(dbUsers, config);
	})

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

	it('should reject group mention', () => {
		let message = createMessage(`<p><spark-mention data-object-type="groupMention" data-group-type="all">All</spark-mention> roleconfig`, 'mockAdminID');
		let results = configuration.isToTriggerOn(message)
		expect(results).toBe(false);
	});
});
