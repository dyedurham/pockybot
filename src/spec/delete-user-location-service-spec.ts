import { DefaultDeleteUserLocationService, DeleteUserLocationService } from '../lib/services/delete-user-location-service'
import DbLocation from '../lib/database/db-location';
import MockQueryHandler from './mocks/mock-query-handler';
import { Command } from '../models/command';
import { LocationAction } from '../models/location-action';
import { Argument } from '../models/argument';
import constants from '../constants';

function createArguments(text : string, isMention : boolean, userId? : string) : Argument[] {
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
			text: LocationAction.Get,
			isMention: false
		},
		{
			text,
			isMention,
			userId
		}
	];
}

describe('delete user location service', () => {
	let dbLocation : DbLocation;
	let deleteUserLocationService : DeleteUserLocationService;

	beforeEach(() => {
		dbLocation = new DbLocation(new MockQueryHandler(null));
		deleteUserLocationService = new DefaultDeleteUserLocationService(dbLocation);
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
					text: LocationAction.Delete,
					isMention: false
				}
			];
			const personId = 'mockID';

			let response = await deleteUserLocationService.deleteUserLocationNonAdmin(args, personId);
			expect(response).toBe(`Usage: \`@${constants.botName} ${Command.UserLocation} ${LocationAction.Delete} me\``);
			done();
		});

		it('should create the message with mention', async (done : DoneFn) => {
			const args = createArguments('TestUser', true, '12345');
			const personId = 'mockID';

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await deleteUserLocationService.deleteUserLocationNonAdmin(args, personId);
			expect(response).toBe('Permission denied. You are only allowed to delete the location for yourself (use \'me\')');
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with \'me\'', async (done : DoneFn) => {
			const args = createArguments('me', false);
			const personId = '12345';

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await deleteUserLocationService.deleteUserLocationNonAdmin(args, personId);
			expect(response).toBe('Location has been deleted');
			expect(locationSpy).toHaveBeenCalledWith(personId);
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
					text: LocationAction.Delete,
					isMention: false
				}
			];
			const personId = 'mockAdminID';

			let response = await deleteUserLocationService.deleteUserLocationAdmin(args, personId);
			expect(response).toBe('Please specify a list of mentions/me');
			done();
		});

		it('should create the message with mention', async (done : DoneFn) => {
			const userId = '12345';
			const args = createArguments('TestUser', true, userId);
			const personId = 'mockAdminID';

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await deleteUserLocationService.deleteUserLocationAdmin(args, personId);
			expect(response).toBe('Location has been deleted');
			expect(locationSpy).toHaveBeenCalledWith(userId);
			done();
		});

		it('should create the message with mixed mentions and non mentions', async (done : DoneFn) => {
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

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await deleteUserLocationService.deleteUserLocationAdmin(args, personId);
			expect(response).toBe('Mixed mentions and non mentions not allowed');
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with multiple mentions', async (done : DoneFn) => {
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

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await deleteUserLocationService.deleteUserLocationAdmin(args, personId);
			expect(response).toBe('Location has been deleted');
			expect(locationSpy).toHaveBeenCalledTimes(3);
			expect(locationSpy).toHaveBeenCalledWith(userIds[0]);
			expect(locationSpy).toHaveBeenCalledWith(userIds[1]);
			expect(locationSpy).toHaveBeenCalledWith(userIds[2]);
			done();
		});

		it('should create the message with multiple mentions where some fail', async (done : DoneFn) => {
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

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.callFake((userid) => {
				if (userid === userIds[1]) {
					return Promise.reject('Rejected');
				}

				return Promise.resolve();
			});

			let response = await deleteUserLocationService.deleteUserLocationAdmin(args, personId);
			expect(response).toBe(`Location deleting was unsuccessful for user(s): '${usernames[1]}'`);
			expect(locationSpy).toHaveBeenCalledTimes(3);
			expect(locationSpy).toHaveBeenCalledWith(userIds[0]);
			expect(locationSpy).toHaveBeenCalledWith(userIds[1]);
			expect(locationSpy).toHaveBeenCalledWith(userIds[2]);
			done();
		});

		it('should create the message with \'wrong\'', async (done : DoneFn) => {
			const args = createArguments('wrong', false);
			const personId = 'mockAdminID';

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await deleteUserLocationService.deleteUserLocationAdmin(args, personId);
			expect(response).toBe('Invalid person wrong. Either specify \'me\' or mention a person');
			expect(locationSpy).not.toHaveBeenCalled();
			done();
		});

		it('should create the message with \'me\'', async (done : DoneFn) => {
			const args = createArguments('me', false);
			const personId = 'mockAdminID';

			const locationSpy = spyOn(dbLocation, 'deleteUserLocation').and.stub();

			let response = await deleteUserLocationService.deleteUserLocationAdmin(args, personId);
			expect(response).toBe('Location has been deleted');
			expect(locationSpy).toHaveBeenCalledWith(personId);
			done();
		});
	});
});
