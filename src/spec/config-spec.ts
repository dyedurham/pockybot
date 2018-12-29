import 'jasmine-ts';
import configService from '../lib/config';
import PockyDB from '../lib/PockyDB';
import Config from '../lib/config';

function createDatabase(success : boolean) {
	return {
		configValue: 1,
		configString: 'string',
		userValue: 'VALUE',

		getRoles: function () {
			return new Promise((resolve, reject) => {
				if (success) {
					resolve([{"userid":"user","role":this.userValue}]);
				} else {
					reject();
				}
			});
		},

		getConfig: function () {
			return new Promise((resolve, reject) => {
				if (success) {
					resolve([{"name":"config","value":this.configValue}]);
				} else {
					reject();
				}
			});
		},

		getStringConfig: function () {
			return new Promise((resolve, reject) => {
				if (success) {
					resolve([{"name":"stringconfig","value":this.configString}]);
				} else {
					reject();
				}
			});
		},

		setConfig: function (config : string, value : number) {
			return new Promise((resolve, reject) => {
				if (success) {
					this.configValue = value
					resolve();
				} else {
					reject();
				}
			});
		},

		setRoles: function (user : string, value : string) {
			return new Promise((resolve, reject) => {
				if (success) {
					this.userValue = value
					resolve();
				} else {
					reject();
				}
			});
		}
	}
}

describe("creating config", function() {
	var database : PockyDB;
	var config : Config;

	beforeEach(() => {
		database = createDatabase(true) as any;
		config = new configService(database);
	});

	it("should have no users users", function (done) {
		expect(config.getRoles('user').length).toBe(0);
		done();
	});

	it("should have no users users", function (done) {
		expect(config.getRoles('config').length).toBe(0);
		done();
	});

	it("should populate users and config", function (done) {
		config.updateAll()
		.then(() => {
			expect(config.getRoles('user')[0]).toBe('VALUE');
			expect(config.getConfig('config')).toBe(1);
			expect(config.checkRole('user', 'VALUE')).toBe(true);
			done();
		});
	});

});

describe("setting config", function() {
	var database : PockyDB;
	var config : Config;

	beforeEach(() => {
		database = createDatabase(true) as any;
		config = new configService(database);
	});

	it("should update config", function (done) {
		config.updateAll()
		.then(() => {
			expect(config.getConfig('config')).toBe(1);
			config.setConfig('config', 2)
			.then((data) => {
				expect(config.getConfig('config')).toBe(2);
			});
			done();
		});
	});
});

describe("setting role", function() {
	var database : PockyDB;
	var config : Config;

	beforeEach(() => {
		database = createDatabase(true) as any;
		config = new configService(database);
	});

	it("should update role", function (done) {
		config.updateAll()
		.then(() => {
			expect(config.getRoles('user')[0]).toBe('VALUE');
			expect(config.checkRole('user', 'VALUE')).toBe(true);
			config.setRole('user', 'VALUE2')
			.then((data) => {
				expect(config.getRoles('user')[0]).toBe('VALUE2');
				expect(config.checkRole('user', 'VALUE2')).toBe(true);
			});
			done();
		});
	});

	it("should uppercase any lowercase", function (done) {
		config.updateAll()
		.then(() => {
			expect(config.getRoles('user')[0]).toBe('VALUE');
			expect(config.checkRole('user', 'VALUE')).toBe(true);
			config.setRole('user', 'vaLuE3')
			.then((data) => {
				expect(config.getRoles('user')[0]).toBe('VALUE3');
				expect(config.checkRole('user', 'VALUE3')).toBe(true);
			});
			done();
		});
	});
});

describe("get all roles", function() {
	var database : PockyDB;
	var config : Config;

	beforeEach(() => {
		database = createDatabase(true) as any;
		config = new configService(database);
	});

	it("should update role", function (done) {
		config.updateAll()
		.then(() => {
			expect(config.getAllRoles()).toEqual([ { userid : 'user', role : 'VALUE' } ]);
			done();
		});
	});
});

describe("get all config", function() {
	var database : PockyDB;
	var config : Config;

	beforeEach(() => {
		database = createDatabase(true) as any;
		config = new configService(database);
	});

	it("should update role", function (done) {
		config.updateAll()
		.then(() => {
			expect(config.getAllConfig()).toEqual([ { name : 'config', value : 1 } ]);
			done();
		});
	});
});
