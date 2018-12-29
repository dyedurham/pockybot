import 'jasmine-ts';
import Config from '../lib/config';
import PockyDB from '../lib/PockyDB';
import { Client } from 'pg';
import { Role } from '../models/database';

let database : PockyDB;

beforeAll(() => {
	let client = new Client();
	spyOn(client, 'connect').and.returnValue(new Promise(resolve => resolve()));
	database = new PockyDB(client, null);

	spyOn(database, 'getRoles').and.returnValue(new Promise((resolve, reject) => resolve([{'userid': 'user', 'role': Role.Admin}])));
	spyOn(database, 'getConfig').and.returnValue(new Promise((resolve, reject) => resolve([{'name': 'config', 'value': 1}])));
	spyOn(database, 'getStringConfig').and.returnValue(new Promise((resolve, reject) => resolve([{'name': 'stringconfig', 'value': 'string'}])));
	spyOn(database, 'setConfig').and.returnValue(new Promise((resolve, reject) => resolve()));
	spyOn(database, 'setRoles').and.returnValue(new Promise((resolve, reject) => resolve()));
})

describe('creating config', () => {
	let config : Config;

	beforeEach(() => {
		config = new Config(database);
	});

	it('should have no users users', (done : DoneFn) => {
		expect(config.getRoles('user').length).toBe(0);
		done();
	});

	it('should have no users users', (done : DoneFn) => {
		expect(config.getRoles('config').length).toBe(0);
		done();
	});

	it('should populate users and config', async (done : DoneFn) => {
		await config.updateAll();
		expect(config.getRoles('user')[0]).toBe(Role.Admin);
		expect(config.getConfig('config')).toBe(1);
		expect(config.checkRole('user', Role.Admin)).toBe(true);
		done();
	});
});

describe('setting config', function() {
	let config : Config;

	beforeEach(() => {
		config = new Config(database);
	});

	it('should update config', async (done : DoneFn) => {
		await config.setConfig('config', 2);
		expect(database.setConfig).toHaveBeenCalledWith('config', 2);
		done();
	});
});

describe('setting role', () => {
	let config : Config;

	beforeEach(() => {
		config = new Config(database);
	});

	it('should update role', async (done : DoneFn) => {
		await config.setRole('user', Role.Unmetered);
		expect(database.setRoles).toHaveBeenCalledWith('user', Role.Unmetered);
		done();
	});
});

describe('get all roles', () => {
	let config : Config;

	beforeEach(() => {
		config = new Config(database);
	});

	it('should update role', async (done : DoneFn) => {
		await config.updateAll();
		expect(config.getAllRoles()).toEqual([ { userid: 'user', role: Role.Admin } ]);
		done();
	});
});

describe('get all config', () => {
	let config : Config;

	beforeEach(() => {
		config = new Config(database);
	});

	it('should update role', async (done : DoneFn) => {
		await config.updateAll();
		expect(config.getAllConfig()).toEqual([ { name: 'config', value: 1 } ]);
		done();
	});
});
