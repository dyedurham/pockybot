import { DefaultSetUserLocationService, SetUserLocationService } from '../lib/services/set-user-location-service'
import DbLocation from '../lib/database/db-location';
import { DbUsers } from '../lib/database/db-interfaces';
import MockQueryHandler from './mocks/mock-query-handler';
import { Command } from '../models/command';
import { LocationAction } from '../models/location-action';
import MockDbUsers from './mocks/mock-dbusers';
import { Argument } from '../models/argument';
import constants from '../constants';

function createArguments(location : string, text : string, isMention : boolean, userId? : string) : Argument[] {
	return [
		{
			text: constants.botName,
			isMention: true,
			userId: constants.botId
		},
		{
			text: Command.UserLocation,
			isMention: false
		},
		{
			text: LocationAction.Set,
			isMention: false
		},
		{
			text: location,
			isMention: false
		},
		{
			text,
			isMention,
			userId
		}
	];
}

describe('set user location service', () => {
	let dbLocation : DbLocation;
	let dbUsers : DbUsers;
	let setUserLocationService : SetUserLocationService;

	beforeEach(() => {
		dbLocation = new DbLocation(new MockQueryHandler(null));
		dbUsers = new MockDbUsers();
		setUserLocationService = new DefaultSetUserLocationService(dbLocation, dbUsers);
	});

	describe('non-admin', () => {
		it('should create the message with no details', async (done : DoneFn) => {
			const args : Argument[] = [
				{
					text: constants.botName,
					isMention: true,
					userId: constants.botId
				},
				{
					text: Command.UserLocation,
					isMention: false
				},
				{
					text: LocationAction.Set,
					isMention: false
				}
			];
			const personId = 'mockID';

			let response = await setUserLocationService.setUserLocationNonAdmin(args, personId);
			expect(response).toBe(`Usage: \`@${constants.botName} ${Command.UserLocation} ${LocationAction.Set} <location> me\``);
			done();
		});

		it('should create the message with invalid location', async (done : DoneFn) => {
			const location = 'TestLocation';
			const args = createArguments(location, 'me', false);
			const personId = 'mockID';

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await setUserLocationService.setUserLocationNonAdmin(args, personId);
			expect(response).toBe(`Location ${location} does not exist. Valid values are: TestLocation2, TestLocation3`);
			expect(usersSpy).not.toHaveBeenCalled();
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with valid location with mention', async (done : DoneFn) => {
			const location = 'TestLocation';
			const args = createArguments(location, 'TestUser', true, '12345');
			const personId = 'mockID';

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await setUserLocationService.setUserLocationNonAdmin(args, personId);
			expect(response).toBe('Permission denied. You are only allowed to set the location for yourself (use \'me\')');
			expect(usersSpy).not.toHaveBeenCalled();
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with valid location with \'me\'', async (done : DoneFn) => {
			const location = 'TestLocation';
			const args = createArguments(location, 'me', false);
			const personId = '12345';

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await setUserLocationService.setUserLocationNonAdmin(args, personId);
			expect(response).toBe('Location has been set');
			expect(usersSpy).toHaveBeenCalledWith(personId);
			expect(locationSpy).toHaveBeenCalledWith(personId, location);
			done();
		});
	});

	describe('admin', () => {
		it('should create the message with no details', async (done : DoneFn) => {
			const args : Argument[] = [
				{
					text: constants.botName,
					isMention: true,
					userId: constants.botId
				},
				{
					text: Command.UserLocation,
					isMention: false
				},
				{
					text: LocationAction.Set,
					isMention: false
				}
			];
			const personId = 'mockAdminID';

			let response = await setUserLocationService.setUserLocationAdmin(args, personId);
			expect(response).toBe('Please specify the name of a location and a list of mentions/me');
			done();
		});

		it('should create the message with invalid location', async (done : DoneFn) => {
			const location = 'TestLocation';
			const args = createArguments(location, 'me', false);
			const personId = 'mockAdminID';

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await setUserLocationService.setUserLocationAdmin(args, personId);
			expect(response).toBe(`Location ${location} does not exist. Valid values are: TestLocation2, TestLocation3`);
			expect(usersSpy).not.toHaveBeenCalled();
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with valid location with mention', async (done : DoneFn) => {
			const location = 'TestLocation';
			const userId = '12345';
			const args = createArguments(location, 'TestUser', true, userId)
			const personId = 'mockAdminID';

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await setUserLocationService.setUserLocationAdmin(args, personId);
			expect(response).toBe('Location has been set');
			expect(usersSpy).toHaveBeenCalledWith(userId);
			expect(locationSpy).toHaveBeenCalledWith(userId, location);
			done();
		});

		it('should create the message with valid location with mixed mentions and non mentions', async (done : DoneFn) => {
			const location = 'TestLocation';
			const userIds = ['11111', '22222', '33333'];
			const args : Argument[] = [
				{
					text: constants.botName,
					isMention: true,
					userId: constants.botId
				},
				{
					text: Command.UserLocation,
					isMention: false
				},
				{
					text: LocationAction.Set,
					isMention: false
				},
				{
					text: location,
					isMention: false
				},
				{
					text: 'TestUser',
					isMention: true,
					userId: userIds[0]
				},
				{
					text: 'me',
					isMention: false
				},
				{
					text: 'TestUser2',
					isMention: true,
					userId: userIds[1]
				},
				{
					text: 'TestUser3',
					isMention: true,
					userId: userIds[2]
				}
			];
			const personId = 'mockAdminID';

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await setUserLocationService.setUserLocationAdmin(args, personId);
			expect(response).toBe('Mixed mentions and non mentions not allowed');
			expect(usersSpy).not.toHaveBeenCalled();
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with valid location with multiple mentions', async (done : DoneFn) => {
			const location = 'TestLocation';
			const userIds = ['11111', '22222', '33333'];
			const args : Argument[] = [
				{
					text: constants.botName,
					isMention: true,
					userId: constants.botId
				},
				{
					text: Command.UserLocation,
					isMention: false
				},
				{
					text: LocationAction.Set,
					isMention: false
				},
				{
					text: location,
					isMention: false
				},
				{
					text: 'TestUser',
					isMention: true,
					userId: userIds[0]
				},
				{
					text: 'TestUser2',
					isMention: true,
					userId: userIds[1]
				},
				{
					text: 'TestUser3',
					isMention: true,
					userId: userIds[2]
				}
			];
			const personId = 'mockAdminID';

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await setUserLocationService.setUserLocationAdmin(args, personId);
			expect(response).toBe('Location has been set');
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

		it('should create the message with valid location with multiple mentions where some fail', async (done : DoneFn) => {
			const location = 'TestLocation';
			const usernames = ['TestUser1', 'TestUser2', 'TestUser3'];
			const userIds = ['11111', '22222', '33333'];
			const args : Argument[] = [
				{
					text: constants.botName,
					isMention: true,
					userId: constants.botId
				},
				{
					text: Command.UserLocation,
					isMention: false
				},
				{
					text: LocationAction.Set,
					isMention: false
				},
				{
					text: location,
					isMention: false
				},
				{
					text: usernames[0],
					isMention: true,
					userId: userIds[0]
				},
				{
					text: usernames[1],
					isMention: true,
					userId: userIds[1]
				},
				{
					text: usernames[2],
					isMention: true,
					userId: userIds[2]
				}
			];
			const personId = 'mockAdminID';

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.callFake((userid, location) => {
				if (userid === userIds[1]) {
					return Promise.reject('Rejected');
				}

				return Promise.resolve();
			});

			let response = await setUserLocationService.setUserLocationAdmin(args, personId);
			expect(response).toBe(`Location setting was unsuccessful for user(s): '${usernames[1]}'`);
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

		it('should create the message with valid location with \'wrong\'', async (done : DoneFn) => {
			const location = 'TestLocation';
			const args = createArguments(location, 'wrong', false);
			const personId = 'mockAdminID';

			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await setUserLocationService.setUserLocationAdmin(args, personId);
			expect(response).toBe('Invalid person wrong. Either specify \'me\' or mention a person');
			expect(usersSpy).not.toHaveBeenCalled();
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with valid location with \'me\'', async (done : DoneFn) => {
			const location = 'TestLocation';
			const args = createArguments(location, 'me', false);
			const personId = 'mockAdminID';

			const usersSpy = spyOn(dbUsers, 'existsOrCanBeCreated').and.returnValue(Promise.resolve(true));
			spyOn(dbLocation, 'getLocations').and.returnValue(Promise.resolve(['TestLocation', 'TestLocation2', 'TestLocation3']));
			const locationSpy = spyOn(dbLocation, 'setUserLocation').and.stub();

			let response = await setUserLocationService.setUserLocationAdmin(args, personId);
			expect(response).toBe('Location has been set');
			expect(usersSpy).toHaveBeenCalledWith(personId);
			expect(locationSpy).toHaveBeenCalledWith(personId, location);
			done();
		});
	});
});
