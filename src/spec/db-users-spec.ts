import { CiscoSpark } from 'ciscospark/env';
import MockCiscoSpark from './mocks/mock-spark';
import { QueryConfig, Client, QueryResult } from 'pg';
import DbUsers from '../lib/database/db-users';
import MockQueryHandler from './mocks/mock-query-handler';
import QueryHandler from '../lib/database/query-handler-interface';

let pegCount = 0;

function createSparkMock() : CiscoSpark {
	let spark = new MockCiscoSpark();

	spyOn(spark.people, 'get').and.callFake((userid : string) => {
		return new Promise((resolve, reject) => {
			resolve({
				id: userid,
				displayName: userid + 'display',
				emails: [],
				created: new Date()
			});
		});
	});

	return spark;
}

function createDbResult(rows: any[]) : QueryResult {
	return {
		rows: rows,
		command: '',
		rowCount: rows.length,
		oid: 1,
		fields: []
	}
}

function createPgClient(connectSuccess : boolean, pegs : number) : Client {
	let client = new Client();
	pegCount = pegs;

	if (connectSuccess) {
		console.log('connect success');
		spyOn(client, 'connect').and.callFake(() => {
			return Promise.resolve(undefined);
		});
	} else {
		console.log('connect fail');
		spyOn(client, 'connect').and.callFake(() => {
			return Promise.reject();
		});
	}

	spyOn(client, 'query').and.callFake(handleClientQuery as any);

	return client;
}

function handleClientQuery(statement: QueryConfig) : Promise<QueryResult> {
	switch(statement.name) {
		case 'returnResultsQuery':
			return new Promise((resolve, reject) => {
				resolve(createDbResult(['mock name']));
			});
		case 'returnWinnersQuery':
			expect(statement.values[0]).toBe(5);
			expect(statement.values[1]).toBe(3);
			return new Promise((resolve, reject) => {
				resolve(createDbResult(['mock name']));
			});
		case 'resetQuery':
			return new Promise((resolve, reject) => {
				resolve(createDbResult(['reset return']));
			});
		case 'createUserQuery':
			expect(statement.values[0]).toBe('some_sender');
			return new Promise((resolve, reject) => {
				resolve(createDbResult(['create return']));
			});
		case 'givePegWithCommentQuery':
			expect(statement.values[0]).toBe('some_sender');
			expect(statement.values[1]).toBe('some_receiver');
			expect(statement.values[2]).toBe('some comment here');
			return new Promise((resolve, reject) => {
				resolve(createDbResult(['']));
			});
		case 'existsQuery':
			expect(statement.values[0] === 'some_sender' || statement.values[0] === 'some_receiver').toBe(true);
			return new Promise((resolve, reject) => {
				resolve(createDbResult([{exists:true}]));
			});
		case 'pegsGiven':
			expect(statement.values[0]).toBe('some_sender');
			return new Promise((resolve, reject) => {
				resolve(createDbResult([{count: pegCount}]));
			});
		default:
			throw new Error('DB command not recognised');
	}
}

describe('create user', () => {
	let sparkMock : CiscoSpark;
	let queryHandler : QueryHandler;

	beforeEach(() => {
		queryHandler = new MockQueryHandler('create return');
		sparkMock = createSparkMock();
	});

	it('should call query and return the raw output', async (done : DoneFn) => {
		const database = new DbUsers(sparkMock, queryHandler);
		let results = await database.createUser('some_sender');
		expect(results as any).toBe('create return');
		done();
	});
});

describe('exists', () => {
	let queryHandler : QueryHandler;
	let pgClientMock : Client;

	beforeEach(() => {
		queryHandler = new MockQueryHandler([{exists:true}]);
		pgClientMock = createPgClient(true, null);
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
