import { Webex } from 'webex/env';
import MockWebex from './mocks/mock-spark';
import DbUsers from '../lib/database/db-users';
import MockQueryHandler from './mocks/mock-query-handler';
import QueryHandler from '../lib/database/query-handler-interface';

function createWebexMock() : Webex {
	let webex = new MockWebex();

	spyOn(webex.people, 'get').and.callFake((userid : string) => {
		return new Promise((resolve, reject) => {
			resolve({
				id: userid,
				displayName: userid + 'display',
				emails: [],
				created: new Date(),
				type: 'person'
			});
		});
	});

	return webex;
}

describe('create user', () => {
	let webexMock : Webex;
	let queryHandler : QueryHandler;

	beforeEach(() => {
		queryHandler = new MockQueryHandler('create return');
		webexMock = createWebexMock();
	});

	it('should call query and return the raw output', async (done : DoneFn) => {
		const database = new DbUsers(webexMock, queryHandler);
		let results = await database.createUser('some_sender');
		expect(results as any).toBe('create return');
		done();
	});
});

describe('exists', () => {
	let queryHandler : QueryHandler;

	beforeEach(() => {
		queryHandler = new MockQueryHandler([{exists:true}]);
	});

	it('should make return true if the user already exists', async (done : DoneFn) => {
		const database = new DbUsers(null, queryHandler);
		let result = await database.existsOrCanBeCreated('some_sender');
		expect(result).toBe(true);
		done();
	});

	 it('should make create a user and return true', async (done : DoneFn) => {
		const database = new DbUsers(null, queryHandler);
		let result = await database.existsOrCanBeCreated('some_sender');
		expect(result).toBe(true);
		done();
	});
});

describe('delete user', () => {
	let queryHandler : QueryHandler;
	let dbUsers : DbUsers;

	beforeEach(() => {
		queryHandler = new MockQueryHandler(null);
		dbUsers = new DbUsers(null, queryHandler);
	});

	it('should delete a user successfully', async (done : DoneFn) => {
		const userid = '12345';

		spyOn(queryHandler, 'executeNonQuery').and.callFake(query => {
			if (query.name !== 'deleteUserQuery') {
				return Promise.reject(`Expected query name ${query.name} to equal deleteUserQuery`);
			}

			if (query.values.length === 1 && query.values[0] === userid) {
				return Promise.resolve(null);
			}

			return Promise.reject(`Expected to be called with userid ${userid}`);
		});

		let error = null;

		try {
			await dbUsers.deleteUser(userid);
		} catch (e) {
			error = e;
		}

		expect(error).toBeNull();
		done();
	});
});
