import UserLocation from '../lib/response-triggers/userlocation';
import constants from '../constants';
import Config from '../lib/config';
import { MessageObject } from 'webex/env';
import { Role } from '../models/database';
import DbLocation from '../lib/database/db-location';
import { DbUsers } from '../lib/database/db-interfaces';
import MockQueryHandler from './mocks/mock-query-handler';
import { Command } from '../models/command';
import { LocationAction } from '../models/location-action';
import MockDbUsers from './mocks/mock-dbusers';

function createMessage(htmlMessage : string, person : string) : MessageObject {
	return {
		html: htmlMessage,
		personId: person
	}
}

describe('userlocation trigger', () => {
	const config = new Config(null);
	let dbLocation : DbLocation;
	let dbUsers : DbUsers;
	let userLocation : UserLocation;

	beforeAll(() => {
		spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
			return userid === 'mockAdminID' && value === Role.Admin;
		});
	});

	beforeEach(() => {
		dbLocation = new DbLocation(new MockQueryHandler(null));
		dbUsers = new MockDbUsers();
		userLocation = new UserLocation(dbUsers, dbLocation, config);
	});

	describe('message parsing get', () => {
		it('should create the message with get command but no user', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Get}`,
				'mockID');

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Please specify who you want to get the location for. This can be \'all\', \'me\', \'unset\', or mention a person');
			done();
		});

		it('should create the message with get command with a mention when the user has no location', async (done : DoneFn) => {
			const userId = '12345';
			const username = 'Test';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Get} <spark-mention data-object-type="person" data-object-id="${userId}">${username}</spark-mention>`,
				'mockID');

			const locationSpy = spyOn(dbLocation, 'getUserLocation').and.returnValue(Promise.resolve(null));

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`User ${username}'s location is not set`);
			expect(locationSpy).toHaveBeenCalledWith(userId);
			done();
		});

		it('should create the message with get command with a mention when the user has a location set', async (done : DoneFn) => {
			const userId = '12345';
			const username = 'Test';
			const location = 'TestLocation';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Get} <spark-mention data-object-type="person" data-object-id="${userId}">${username}</spark-mention>`,
				'mockID');

			const locationSpy = spyOn(dbLocation, 'getUserLocation').and.returnValue(Promise.resolve({ userid: userId, location }));

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`User ${username}'s location is: '${location}'`);
			expect(locationSpy).toHaveBeenCalledWith(userId);
			done();
		});

		it('should create the message with get command with unknown user', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Get} wrong`,
				'mockID');

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Unknown command. Please specify \'me\', \'all\', \'unset\', or mention a user.');
			done();
		});

		it('should create the message with get command with user \'me\' with no location set', async (done : DoneFn) => {
			const userId = '12345';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Get} me`,
				userId);

			const locationSpy = spyOn(dbLocation, 'getUserLocation').and.returnValue(Promise.resolve(null));

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`Your location is not set`);
			expect(locationSpy).toHaveBeenCalledWith(userId);
			done();
		});

		it('should create the message with get command with user \'me\' with a location set', async (done : DoneFn) => {
			const userId = '12345';
			const location = 'TestLocation';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Get} me`,
				userId);

			const locationSpy = spyOn(dbLocation, 'getUserLocation').and.returnValue(Promise.resolve({ userid: userId, location }));

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`Your location is: '${location}'`);
			expect(locationSpy).toHaveBeenCalledWith(userId);
			done();
		});

		it('should create the message with get command with user \'all\' with no locations set', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Get} all`,
				'mockID');

			const locationSpy = spyOn(dbLocation, 'getAllUserLocations').and.returnValue(Promise.resolve([]));
			const usersSpy = spyOn(dbUsers, 'getUser').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('No user locations set');
			expect(locationSpy).toHaveBeenCalled();
			expect(usersSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with get command with user \'all\' with locations set', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Get} all`,
				'mockID');

			const locationSpy = spyOn(dbLocation, 'getAllUserLocations').and.returnValue(Promise.resolve([
				{
					userid: '11111',
					location: 'TestLocation'
				},
				{
					userid: '22222',
					location: 'TestLocation'
				},
				{
					userid: '33333',
					location: 'TestLocation2'
				}
			]));

			spyOn(dbUsers, 'getUser').and.callFake(userid => {
				return Promise.resolve({
					userid,
					username: `User ${userid}`
				});
			});

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`Here is the current config:
\`\`\`
 Username  | Location
-----------+--------------
User 11111 | TestLocation
User 22222 | TestLocation
User 33333 | TestLocation2
\`\`\``);
			expect(locationSpy).toHaveBeenCalled();
			done();
		});

		it('should create the message with get command with user \'unset\' with no locations unset', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Get} unset`,
				'mockID');

			const locationSpy = spyOn(dbLocation, 'getUsersWithoutLocation').and.returnValue(Promise.resolve([]));

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('There are no users without a location set');
			expect(locationSpy).toHaveBeenCalled();
			done();
		});

		it('should create the message with get command with user \'unset\' with locations unset', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Get} unset`,
				'mockID');

			const locationSpy = spyOn(dbLocation, 'getUsersWithoutLocation').and.returnValue(Promise.resolve([
				{
					userid: '11111',
					username: 'TestUser1'
				},
				{
					userid: '22222',
					username: 'TestUser2'
				},
				{
					userid: '33333',
					username: 'TestUser3'
				}
			]));

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`Here are the users without a location set:

'TestUser1', 'TestUser2', 'TestUser3'`);
			expect(locationSpy).toHaveBeenCalled();
			done();
		});
	});

	describe('message parsing non-admin', () => {
		it('should create the message with no command', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} `,
				'mockID');

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Please specify a command. Possible values are get, set, delete');
			done();
		});

		it('should create the message with unknown command', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} blah`,
				'mockID');

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Unknown command. Possible values are get, set, delete');
			done();
		});

		it('should create the message with set command with no details', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set}`,
				'mockID');

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`Usage: \`@${constants.botName} ${Command.UserLocation} ${LocationAction.Set} <location> me\``);
			done();
		});

		it('should create the message with set command with invalid location', async (done : DoneFn) => {
			const location = 'TestLocation';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set} ${location} me`,
				'mockID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`Location ${location} does not exist. Valid values are: TestLocation2, TestLocation3`);
			expect(usersSpy).not.toHaveBeenCalled();
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with set command with valid location with mention', async (done : DoneFn) => {
			const location = 'TestLocation';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set} ${location} <spark-mention data-object-type="person" data-object-id="12345">TestUser</spark-mention>`,
				'mockID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Permission denied. You are only allowed to set the location for yourself (use \'me\')');
			expect(usersSpy).not.toHaveBeenCalled();
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with set command with valid location with \'me\'', async (done : DoneFn) => {
			const location = 'TestLocation';
			const userId = '12345';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set} ${location} me`,
				userId);

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Location has been set');
			expect(usersSpy).toHaveBeenCalledWith(userId);
			expect(locationSpy).toHaveBeenCalledWith(userId, location);
			done();
		});

		it('should create the message with delete command with no details', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete}`,
				'mockID');

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`Usage: \`@${constants.botName} ${Command.UserLocation} ${LocationAction.Delete} me\``);
			done();
		});

		it('should create the message with delete command with mention', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete} <spark-mention data-object-type="person" data-object-id="12345">TestUser</spark-mention>`,
				'mockID');

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Permission denied. You are only allowed to delete the location for yourself (use \'me\')');
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with delete command with \'me\'', async (done : DoneFn) => {
			const userId = '12345';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete} me`,
				userId);

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Location has been deleted');
			expect(locationSpy).toHaveBeenCalledWith(userId);
			done();
		});
	});

	describe('message parsing admin', () => {
		it('should create the message with no command', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} `,
				'mockAdminID');

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Please specify a command. Possible values are get, set, delete');
			done();
		});

		it('should create the message with unknown command', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} blah`,
				'mockAdminID');

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Unknown command. Possible values are get, set, delete');
			done();
		});

		it('should create the message with unknown command', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} blah`,
				'mockAdminID');

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Unknown command. Possible values are get, set, delete');
			done();
		});

		it('should create the message with set command with no details', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set}`,
				'mockAdminID');

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Please specify the name of a location and a list of mentions/me');
			done();
		});

		it('should create the message with set command with invalid location', async (done : DoneFn) => {
			const location = 'TestLocation';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set} ${location} me`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`Location ${location} does not exist. Valid values are: TestLocation2, TestLocation3`);
			expect(usersSpy).not.toHaveBeenCalled();
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with set command with valid location with mention', async (done : DoneFn) => {
			const location = 'TestLocation';
			const userId = '12345';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set} ${location} <spark-mention data-object-type="person" data-object-id="${userId}">TestUser</spark-mention>`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Location has been set');
			expect(usersSpy).toHaveBeenCalledWith(userId);
			expect(locationSpy).toHaveBeenCalledWith(userId, location);
			done();
		});

		it('should create the message with set command with valid location with mixed mentions and non mentions', async (done : DoneFn) => {
			const location = 'TestLocation';
			const userIds = ['11111', '22222', '33333'];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set} ${location} <spark-mention data-object-type="person" data-object-id="${userIds[0]}">TestUser</spark-mention> me <spark-mention data-object-type="person" data-object-id="${userIds[1]}">TestUser2</spark-mention> <spark-mention data-object-type="person" data-object-id="${userIds[2]}">TestUser3</spark-mention>`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Mixed mentions and non mentions not allowed');
			expect(usersSpy).not.toHaveBeenCalled();
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with set command with valid location with multiple mentions', async (done : DoneFn) => {
			const location = 'TestLocation';
			const userIds = ['11111', '22222', '33333'];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set} ${location} <spark-mention data-object-type="person" data-object-id="${userIds[0]}">TestUser</spark-mention> <spark-mention data-object-type="person" data-object-id="${userIds[1]}">TestUser2</spark-mention> <spark-mention data-object-type="person" data-object-id="${userIds[2]}">TestUser3</spark-mention>`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Location has been set');
			expect(usersSpy).toHaveBeenCalledTimes(3);
			expect(usersSpy).toHaveBeenCalledWith(userIds[0]);
			expect(usersSpy).toHaveBeenCalledWith(userIds[1]);
			expect(usersSpy).toHaveBeenCalledWith(userIds[2]);
			expect(locationSpy).toHaveBeenCalledTimes(3);
			expect(locationSpy).toHaveBeenCalledWith(userIds[0], location);
			expect(locationSpy).toHaveBeenCalledWith(userIds[1], location);
			expect(locationSpy).toHaveBeenCalledWith(userIds[2], location);
			done();
		});

		it('should create the message with set command with valid location with multiple mentions where some fail', async (done : DoneFn) => {
			const location = 'TestLocation';
			const usernames = ['TestUser1', 'TestUser2', 'TestUser3'];
			const userIds = ['11111', '22222', '33333'];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set} ${location} <spark-mention data-object-type="person" data-object-id="${userIds[0]}">${usernames[0]}</spark-mention> <spark-mention data-object-type="person" data-object-id="${userIds[1]}">${usernames[1]}</spark-mention> <spark-mention data-object-type="person" data-object-id="${userIds[2]}">${usernames[2]}</spark-mention>`,
				'mockAdminID');

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.callFake((userid, location) => {
				if (userid === userIds[1]) {
					return Promise.reject('Rejected');
				}

				return Promise.resolve();
			});

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`Location setting was unsuccessful for user(s): '${usernames[1]}'`);
			expect(usersSpy).toHaveBeenCalledTimes(3);
			expect(usersSpy).toHaveBeenCalledWith(userIds[0]);
			expect(usersSpy).toHaveBeenCalledWith(userIds[1]);
			expect(usersSpy).toHaveBeenCalledWith(userIds[2]);
			expect(locationSpy).toHaveBeenCalledTimes(3);
			expect(locationSpy).toHaveBeenCalledWith(userIds[0], location);
			expect(locationSpy).toHaveBeenCalledWith(userIds[1], location);
			expect(locationSpy).toHaveBeenCalledWith(userIds[2], location);
			done();
		});

		it('should create the message with set command with valid location with \'wrong\'', async (done : DoneFn) => {
			const location = 'TestLocation';
			const userId = 'mockAdminID';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set} ${location} wrong`,
				userId);

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Invalid person wrong. Either specify \'me\' or mention a person');
			expect(usersSpy).not.toHaveBeenCalled();
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with set command with valid location with \'me\'', async (done : DoneFn) => {
			const location = 'TestLocation';
			const userId = 'mockAdminID';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Set} ${location} me`,
				userId);

			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Location has been set');
			expect(usersSpy).toHaveBeenCalledWith(userId);
			expect(locationSpy).toHaveBeenCalledWith(userId, location);
			done();
		});

		it('should create the message with delete command with no details', async (done : DoneFn) => {
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete}`,
				'mockAdminID');

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Please specify a list of mentions/me');
			done();
		});

		it('should create the message with delete command with mention', async (done : DoneFn) => {
			const userId = '12345';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete} <spark-mention data-object-type="person" data-object-id="${userId}">TestUser</spark-mention>`,
				'mockAdminID');

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Location has been deleted');
			expect(locationSpy).toHaveBeenCalledWith(userId);
			done();
		});

		it('should create the message with delete command with mixed mentions and non mentions', async (done : DoneFn) => {
			const userIds = ['11111', '22222', '33333'];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete} <spark-mention data-object-type="person" data-object-id="${userIds[0]}">TestUser</spark-mention> me <spark-mention data-object-type="person" data-object-id="${userIds[1]}">TestUser2</spark-mention> <spark-mention data-object-type="person" data-object-id="${userIds[2]}">TestUser3</spark-mention>`,
				'mockAdminID');

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Mixed mentions and non mentions not allowed');
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with delete command with multiple mentions', async (done : DoneFn) => {
			const userIds = ['11111', '22222', '33333'];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete} <spark-mention data-object-type="person" data-object-id="${userIds[0]}">TestUser</spark-mention> <spark-mention data-object-type="person" data-object-id="${userIds[1]}">TestUser2</spark-mention> <spark-mention data-object-type="person" data-object-id="${userIds[2]}">TestUser3</spark-mention>`,
				'mockAdminID');

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Location has been deleted');
			expect(locationSpy).toHaveBeenCalledTimes(3);
			expect(locationSpy).toHaveBeenCalledWith(userIds[0]);
			expect(locationSpy).toHaveBeenCalledWith(userIds[1]);
			expect(locationSpy).toHaveBeenCalledWith(userIds[2]);
			done();
		});

		it('should create the message with delete command with multiple mentions where some fail', async (done : DoneFn) => {
			const usernames = ['TestUser1', 'TestUser2', 'TestUser3'];
			const userIds = ['11111', '22222', '33333'];
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete} <spark-mention data-object-type="person" data-object-id="${userIds[0]}">${usernames[0]}</spark-mention> <spark-mention data-object-type="person" data-object-id="${userIds[1]}">${usernames[1]}</spark-mention> <spark-mention data-object-type="person" data-object-id="${userIds[2]}">${usernames[2]}</spark-mention>`,
				'mockAdminID');

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.callFake((userid) => {
				if (userid === userIds[1]) {
					return Promise.reject('Rejected');
				}

				return Promise.resolve();
			});

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe(`Location deleting was unsuccessful for user(s): '${usernames[1]}'`);
			expect(locationSpy).toHaveBeenCalledTimes(3);
			expect(locationSpy).toHaveBeenCalledWith(userIds[0]);
			expect(locationSpy).toHaveBeenCalledWith(userIds[1]);
			expect(locationSpy).toHaveBeenCalledWith(userIds[2]);
			done();
		});

		it('should create the message with delete command with \'wrong\'', async (done : DoneFn) => {
			const userId = 'mockAdminID';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete} wrong`,
				userId);

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Invalid person wrong. Either specify \'me\' or mention a person');
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with delete command with \'me\'', async (done : DoneFn) => {
			const userId = 'mockAdminID';
			const message = createMessage(`<spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} ${LocationAction.Delete} me`,
				userId);

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await userLocation.createMessage(message);
			expect(response.markdown).toBe('Location has been deleted');
			expect(locationSpy).toHaveBeenCalledWith(userId);
			done();
		});
	});

	describe('triggers', () => {
		it('should accept trigger', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation}`,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should reject wrong command', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> asdf${Command.UserLocation}`,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should reject wrong id', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="wrongId">${constants.botName}</spark-mention> ${Command.UserLocation}`,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(false);
		});

		it('should accept no space', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention>${Command.UserLocation}`,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should accept trailing space', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} `,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(true);
		});

		it('should accept an additional parameter', () => {
			let message = createMessage(`<p><spark-mention data-object-type="person" data-object-id="${constants.botId}">${constants.botName}</spark-mention> ${Command.UserLocation} get`,
				'mockID');
			let results = userLocation.isToTriggerOn(message);
			expect(results).toBe(true);
		});


		it('should reject group mention', () => {
			let message = createMessage(`<p><spark-mention data-object-type="groupMention" data-group-type="all">All</spark-mention> stringconfig`, 'mockID');
			let results = userLocation.isToTriggerOn(message)
			expect(results).toBe(false);
		});
	});
})
