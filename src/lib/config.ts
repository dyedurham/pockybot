import PockyDB from './PockyDB';
import __logger from './logger';

export default class Config {
	database : PockyDB;
	users : any[];
	config : any[];
	stringConfig : any[];

	constructor(database) {
		this.database = database;
		this.users = [];
		this.config = [];
		this.stringConfig = [];
	}

	getRoles(userid) {
		if (this.users.length === 0) {
			return [];
		}

		var userRoles = this.users.filter(x => x.userid === userid);
		return userRoles.map(x => x.role);
	}

	getConfig(config) {
		if (this.config.length === 0) {
			return null;
		}

		return this.config.find(x => x.name.toUpperCase() === config.toUpperCase()).value;
	}

	getStringConfig(config) {
		return this.stringConfig.filter(x => x.name.toUpperCase() === config.toUpperCase())
			.map(function (x) {
				return x.value;
			}
		);
	}

	checkRole(userid, role) {
		if(!this.users) return false;
		return this.users.some(x =>
			x.userid === userid &&
			x.role.toUpperCase() === role.toUpperCase());
	}

	getAllRoles() {
		return this.users;
	}

	getAllConfig() {
		return this.config;
	}

	async updateAll(){
		await Promise.all([this.updateRoles(), this.updateConfig(), this.updateStringConfig()]);
	}

	async updateRoles() {
		let data = await this.database.getRoles();

		this.users = data;
		__logger.debug(this.users);
	}

	async updateConfig() {
		let data = await this.database.getConfig();

		this.config = data;
		__logger.debug(this.config);
	}

	async updateStringConfig() {
		let data = await this.database.getStringConfig();

		this.stringConfig = data;
		__logger.debug(this.stringConfig);
	}

	async setRole(userid, role) {
		await this.database.setRoles(userid, role.toUpperCase());
		await this.updateRoles();
	}

	async setConfig(config, value) {
		if (isNaN(value)) {
			throw new Error('error: config must be an integer');
		}

		await this.database.setConfig(config, value);
		await this.updateConfig();
	}

	async setStringConfig(config, value) {
		await this.database.setStringConfig(config, value);
		await this.updateStringConfig();
	}
}
