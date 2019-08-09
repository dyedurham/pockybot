import { DefaultGetUserLocationService, GetUserLocationService } from '../lib/services/get-user-location-service'
import DbLocation from '../lib/database/db-location';
import { DbUsers } from '../lib/database/db-interfaces';
import MockQueryHandler from './mocks/mock-query-handler';
import { Command } from '../models/command';
import { LocationAction } from '../models/location-action';
import MockDbUsers from './mocks/mock-dbusers';
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

describe('get user location service', () => {
	let dbLocation : DbLocation;
	let dbUsers : DbUsers;
	let getUserLocationService : GetUserLocationService;

	beforeEach(() => {
		dbLocation = new DbLocation(new MockQueryHandler(null));
		dbUsers = new MockDbUsers();
		getUserLocationService = new DefaultGetUserLocationService(dbLocation, dbUsers);
	});

	it('should create the message with no user', async (done : DoneFn) => {
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
				text: LocationAction.Get,
				isMention: false
			}
		];
		const personId = 'mockID';

		let response = await getUserLocationService.getUserLocation(args, personId);
		expect(response).toBe('Please specify who you want to get the location for. This can be \'all\', \'me\', \'unset\', or mention a person');
		done();
	});

	it('should create the message with a mention when the user has no location', async (done : DoneFn) => {
		const userId = '12345';
		const username = 'Test';
		const args = createArguments(username, true, userId);
		const personId = 'mockID';

		const locationSpy = spyOn(dbLocation, 'getUserLocation').and.returnValue(Promise.resolve(null));

		let response = await getUserLocationService.getUserLocation(args, personId);
		expect(response).toBe(`User ${username}'s location is not set`);
		expect(locationSpy).toHaveBeenCalledWith(userId);
		done();
	});

	it('should create the message with a mention when the user has a location set', async (done : DoneFn) => {
		const userId = '12345';
		const username = 'Test';
		const location = 'TestLocation';
		const args = createArguments(username, true, userId);
		const personId = 'mockID';

		const locationSpy = spyOn(dbLocation, 'getUserLocation').and.returnValue(Promise.resolve({ userid: userId, location }));

		let response = await getUserLocationService.getUserLocation(args, personId);
		expect(response).toBe(`User ${username}'s location is: '${location}'`);
		expect(locationSpy).toHaveBeenCalledWith(userId);
		done();
	});

	it('should create the message with unknown user', async (done : DoneFn) => {
		const args = createArguments('wrong', false);
		const personId = 'mockID';

		let response = await getUserLocationService.getUserLocation(args, personId);
		expect(response).toBe('Unknown command. Please specify \'me\', \'all\', \'unset\', or mention a user.');
		done();
	});

	it('should create the message with user \'me\' with no location set', async (done : DoneFn) => {
		const args = createArguments('me', false);
		const personId = '12345';

		const locationSpy = spyOn(dbLocation, 'getUserLocation').and.returnValue(Promise.resolve(null));

		let response = await getUserLocationService.getUserLocation(args, personId);
		expect(response).toBe(`Your location is not set`);
		expect(locationSpy).toHaveBeenCalledWith(personId);
		done();
	});

	it('should create the message with user \'me\' with a location set', async (done : DoneFn) => {
		const location = 'TestLocation';
		const args = createArguments('me', false);
		const personId = '12345'

		const locationSpy = spyOn(dbLocation, 'getUserLocation').and.returnValue(Promise.resolve({ userid: personId, location }));

		let response = await getUserLocationService.getUserLocation(args, personId);
		expect(response).toBe(`Your location is: '${location}'`);
		expect(locationSpy).toHaveBeenCalledWith(personId);
		done();
	});

	it('should create the message with user \'all\' with no locations set', async (done : DoneFn) => {
		const args = createArguments('all', false);
		const personId = 'mockID';

		const locationSpy = spyOn(dbLocation, 'getAllUserLocations').and.returnValue(Promise.resolve([]));
		const usersSpy = spyOn(dbUsers, 'getUser').and.stub();

		let response = await getUserLocationService.getUserLocation(args, personId);
		expect(response).toBe('No user locations set');
		expect(locationSpy).toHaveBeenCalled();
		expect(usersSpy).not.toHaveBeenCalled();
		done();
	});

	it('should create the message with user \'all\' with locations set', async (done : DoneFn) => {
		const args = createArguments('all', false);
		const personId = 'mockID';

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

		let response = await getUserLocationService.getUserLocation(args, personId);
		expect(response).toBe(`Here is the current config:
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

	it('should create the message with user \'unset\' with no locations unset', async (done : DoneFn) => {
		const args = createArguments('unset', false);
		const personId = 'mockID';

		const locationSpy = spyOn(dbLocation, 'getUsersWithoutLocation').and.returnValue(Promise.resolve([]));

		let response = await getUserLocationService.getUserLocation(args, personId);
		expect(response).toBe('There are no users without a location set');
		expect(locationSpy).toHaveBeenCalled();
		done();
	});

	it('should create the message with user \'unset\' with locations unset', async (done : DoneFn) => {
		const args = createArguments('unset', false);
		const personId = 'mockID';

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

		let response = await getUserLocationService.getUserLocation(args, personId);
		expect(response).toBe(`Here are the users without a location set:

'TestUser1', 'TestUser2', 'TestUser3'`);
		expect(locationSpy).toHaveBeenCalled();
		done();
	});
});
