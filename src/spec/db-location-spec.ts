import DbLocation from '../lib/database/db-location';
import MockQueryHandler from './mocks/mock-query-handler';
import QueryHandler from '../lib/database/query-handler-interface';
import { UserLocationRow, UserRow } from '../models/database';

describe('db location', () => {
	let queryHandlerMock : QueryHandler;
	let dbLocation : DbLocation;

	beforeEach(() => {
		queryHandlerMock = new MockQueryHandler(null);
		dbLocation = new DbLocation(queryHandlerMock);
	});

	it('should get the user location successfully', async (done: DoneFn) => {
		const userid = '12345';
		const userLocation : UserLocationRow = {
			userid,
			location: 'TestLocation'
		};

		spyOn(queryHandlerMock, 'executeQuery').and.callFake(query => {
			if (query.name !== 'getUserLocationQuery') {
				return Promise.reject(`Expected query name ${query.name} to equal getUserLocationQuery`);
			}

			if (query.values.length === 1 && query.values[0] === userid) {
				return Promise.resolve([userLocation]);
			}

			return Promise.reject(`Expected user id ${userid}`);
		});

		const result = await dbLocation.getUserLocation(userid);
		expect(result).toEqual(userLocation);

		done();
	});

	it('should get all user locations successfully', async (done: DoneFn) => {
		const userLocations : UserLocationRow[] = [
			{
				userid: '1',
				location: 'TestLocation'
			},
			{
				userid: '2',
				location: 'TestLocation'
			},
			{
				userid: '3',
				location: 'TestLocation2'
			}
		];

		spyOn(queryHandlerMock, 'executeQuery').and.callFake(query => {
			if (query.name !== 'getAllUserLocationsQuery') {
				return Promise.reject(`Expected query name ${query.name} to equal getAllUserLocationsQuery`);
			}

			return Promise.resolve(userLocations);
		});

		const result = await dbLocation.getAllUserLocations();
		expect(result).toEqual(userLocations);

		done();
	});

	it('should get all locations successfully', async (done: DoneFn) => {
		const locations : string[] = [ 'TestLocation', 'TestLocation2' ];

		spyOn(queryHandlerMock, 'executeQuery').and.callFake(query => {
			if (query.name !== 'getLocationsQuery') {
				return Promise.reject(`Expected query name ${query.name} to equal getLocationsQuery`);
			}

			return Promise.resolve(locations.map(x => { return { name: x } }));
		});

		const result = await dbLocation.getLocations();
		expect(result).toEqual(locations);

		done();
	});

	it('should get users without a location', async (done: DoneFn) => {
		const usersWithoutLocation : UserRow[] = [
			{
				userid: '1',
				username: 'user1'
			},
			{
				userid: '2',
				username: 'user2'
			},
			{
				userid: '3',
				username: 'user3'
			}
		];

		spyOn(queryHandlerMock, 'executeQuery').and.callFake(query => {
			if (query.name !== 'getUsersWithoutLocationQuery') {
				return Promise.reject(`Expected query name ${query.name} to equal getUsersWithoutLocationQuery`);
			}

			return Promise.resolve(usersWithoutLocation);
		});

		const result = await dbLocation.getUsersWithoutLocation();
		expect(result).toEqual(usersWithoutLocation);

		done();
	});

	it('should set the user location', async (done: DoneFn) => {
		const userid = '12345';
		const location = 'TestLocation';

		spyOn(queryHandlerMock, 'executeNonQuery').and.callFake(query => {
			if (query.name !== 'setUserLocationQuery') {
				return Promise.reject(`Expected query name ${query.name} to equal setUserLocationQuery`);
			}

			if (query.values.length === 2 && query.values[0] === userid && query.values[1] === location) {
				return Promise.resolve(null);
			}

			return Promise.reject(`Expected to be called with userid ${userid} and location ${location}`);
		});

		let error = null;

		try {
			await dbLocation.setUserLocation(userid, location);
		} catch (e) {
			error = e;
		}

		expect(error).toBeNull();
		done();
	});

	it('should set the location', async (done: DoneFn) => {
		const location = 'TestLocation';

		spyOn(queryHandlerMock, 'executeNonQuery').and.callFake(query => {
			if (query.name !== 'setLocationQuery') {
				return Promise.reject(`Expected query name ${query.name} to equal setLocationQuery`);
			}

			if (query.values.length === 1 && query.values[0] === location) {
				return Promise.resolve(null);
			}

			return Promise.reject(`Expected to be called with location ${location}`);
		});

		let error = null;

		try {
			await dbLocation.setLocation(location);
		} catch (e) {
			error = e;
		}

		expect(error).toBeNull();
		done();
	});

	it('should delete the user location', async (done: DoneFn) => {
		const userid = '12345';

		spyOn(queryHandlerMock, 'executeNonQuery').and.callFake(query => {
			if (query.name !== 'deleteUserLocationQuery') {
				return Promise.reject(`Expected query name ${query.name} to equal deleteUserLocationQuery`);
			}

			if (query.values.length === 1 && query.values[0] === userid) {
				return Promise.resolve(null);
			}

			return Promise.reject(`Expected to be called with userid ${userid}`);
		});

		let error = null;

		try {
			await dbLocation.deleteUserLocation(userid);
		} catch (e) {
			error = e;
		}

		expect(error).toBeNull();
		done();
	});

	it('should delete the location', async (done: DoneFn) => {
		const location = 'TestLocation';

		spyOn(queryHandlerMock, 'executeNonQuery').and.callFake(query => {
			if (query.name !== 'deleteLocationQuery') {
				return Promise.reject(`Expected query name ${query.name} to equal deleteLocationQuery`);
			}

			if (query.values.length === 1 && query.values[0] === location) {
				return Promise.resolve(null);
			}

			return Promise.reject(`Expected to be called with location ${location}`);
		});

		let error = null;

		try {
			await dbLocation.deleteLocation(location);
		} catch (e) {
			error = e;
		}

		expect(error).toBeNull();
		done();
	});
});
