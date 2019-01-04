import PockyDB from '../lib/database/pocky-db';
import Config from '../lib/config';
import { QueryConfig, Client } from 'pg';
import { Role } from '../models/database';
import { CiscoSpark } from 'ciscospark/env';
import MockCiscoSpark from './mocks/mock-spark';

const config = new Config(null);
beforeAll(() => {
	spyOn(config, 'checkRole').and.callFake((userid : string, value : Role) => {
		if (userid === 'mockunmeteredID' && value === Role.Unmetered) {
			return true;
		}
		else {
			return false;
		}
	});

	spyOn(config, 'getConfig').and.callFake((config : string) => {
		if (config === 'limit') {
			return 10;
		} else if (config === 'minimum') {
			return 5;
		} else if (config === 'winners') {
			return 3;
		} else if (config === 'commentsRequired') {
			return 1;
		} else if (config === 'pegWithoutKeyword') {
			return 0;
		}

		throw new Error('bad config');
	});
});

function createPgClient(connectSuccess : boolean, pegCount : number) : Client {
	let client = new Client();

	if (connectSuccess) {
		spyOn(client, 'connect').and.returnValue(new Promise((resolve, reject) => resolve()));
	} else {
		spyOn(client, 'connect').and.returnValue(new Promise((resolve, reject) => reject()));
	}

	spyOn(client, 'query').and.callFake((statement : QueryConfig) => {
		switch(statement.name) {
			case 'returnResultsQuery':
				return new Promise((resolve, reject) => {
					resolve({rows: 'mock name'});
				});
			case 'returnWinnersQuery':
				expect(statement.values[0]).toBe(5);
				expect(statement.values[1]).toBe(3);
				return new Promise((resolve, reject) => {
					resolve({rows: 'mock name'});
				});
			case 'resetQuery':
				return new Promise((resolve, reject) => {
					resolve('reset return');
				});
			case 'createUserQuery':
				expect(statement.values[0]).toBe('some_sender');
				return new Promise((resolve, reject) => {
					resolve('create return');
				});
			case 'givePegWithCommentQuery':
				expect(statement.values[0]).toBe('some_sender');
				expect(statement.values[1]).toBe('some_receiver');
				expect(statement.values[2]).toBe('some comment here');
				return new Promise((resolve, reject) => {
					resolve();
				});
			case 'existsQuery':
				expect(statement.values[0] === 'some_sender' || statement.values[0] === 'some_receiver').toBe(true);
				return new Promise((resolve, reject) => {
					resolve({
						rows: [{exists:true}]
					});
				});
			case 'pegsGiven':
				expect(statement.values[0]).toBe('some_sender');
				return new Promise((resolve, reject) => {
					resolve({
						rows: [{count:pegCount}]
					});
				});
		}
	});

	return client;
}

function createSparkMock() : CiscoSpark {
	let spark = new MockCiscoSpark();

	spyOn(spark.people, 'get').and.callFake((userid : string) => {
		return new Promise((resolve, reject) => {
			resolve({
				displayName: userid + 'display'
			});
		});
	});

	return spark;
}

describe('return results', () => {
	let pgClientMock : Client;

	beforeEach(() => {
		pgClientMock = createPgClient(true, null);
	})

	it('should return the results from database as is', async (done : DoneFn) => {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		let results = await database.returnResults();
		expect(results as any).toBe('mock name');
		done();
	});
});

describe('return winners', () => {
	let pgClientMock : Client;

	beforeEach(() => {
		pgClientMock = createPgClient(true, null);
	})

	it('should return the results from database as is', async (done : DoneFn) => {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		let results = await database.returnWinners();
		expect(results as any).toBe('mock name');
		done();
	});
});

describe('reset', () => {
	let pgClientMock : Client;

	beforeEach(() => {
		pgClientMock = createPgClient(true, null);
	})

	it('should call query and return the raw output', async (done : DoneFn) => {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		let results = await database.reset();
		expect(results as any).toBe('reset return');
		done();
	});
});

describe('create user', () => {
	let pgClientMock : Client;
	let sparkMock : CiscoSpark;

	beforeEach(() => {
		pgClientMock = createPgClient(true, null);
		sparkMock = createSparkMock();
	})

	it('should call query and return the raw output', async (done : DoneFn) => {
		const database = new PockyDB(pgClientMock, sparkMock);
		database.loadConfig(config);
		let results = await database.createUser('some_sender');
		expect(results as any).toBe('create return');
		done();
	});
});

describe('has spare pegs', () => {
	let pgClientMock : Client;

	beforeEach(() => {
		pgClientMock = createPgClient(true, 99);
	})

	it('should return true for default_user', async (done : DoneFn) => {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		let result = await database.hasSparePegs('default_user');
		expect(result).toBe(true);
		done();
	});

	it('should return true for mockunmeteredID', async (done : DoneFn) => {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		let result = await database.hasSparePegs('mockunmeteredID');
		expect(result).toBe(true);
		done();
	});

	it('should return false for other users', async (done : DoneFn) => {

		(pgClientMock.query as jasmine.Spy).and.returnValue(new Promise((resolve, reject) =>
			resolve({
				rows: [{count:100}]
			}
		)));

		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		let result = await database.hasSparePegs('some_sender');
		expect(result).toBe(false);
		done();
	});

	it('should return true for no pegs spent', async (done : DoneFn) => {
		(pgClientMock.query as jasmine.Spy).and.returnValue(new Promise((resolve, reject) => {
			resolve({
				rows: [{count:0}]
			})
		}));

		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		let result = await database.hasSparePegs('some_sender');
		expect(result).toBe(true);
		done();
	});
});

describe('count pegs', () => {
	let pgClientMock : Client;

	beforeEach(() => {
		pgClientMock = createPgClient(true, 125689);
	});

	it('should return count of pegs', async (done : DoneFn) => {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		let result = await database.countPegsGiven('some_sender');
		expect(result).toBe(125689);
		done();
	});
});

describe('exists', () => {
	it('should make return true if the user already exists', async (done : DoneFn) => {
		let pgClientMock = createPgClient(true, null);

		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		let result = await database.existsOrCanBeCreated('some_sender');
		expect(result).toBe(true);
		done();
	});

	 it('should make create a user and return true', async (done : DoneFn) => {
		let pgClientMock = createPgClient(true, null);

		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		let result = await database.existsOrCanBeCreated('some_sender');
		expect(result).toBe(true);
		done();
	});
});

describe('give peg with comment', () => {
	let pgClientMock : Client;

	beforeEach(() => {
		pgClientMock = createPgClient(true, null);
	})

	it('should return 0', async (done : DoneFn) => {
		const database = new PockyDB(pgClientMock, null);
		database.loadConfig(config);
		let result = await database.givePegWithComment('some comment here', 'some_receiver', 'some_sender');
		expect(result).toBe(0);
		done();
	});
});
