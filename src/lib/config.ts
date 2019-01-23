import DbConfig from './database/db-config';
import __logger from './logger';
import { ConfigRow, StringConfigRow, RolesRow, Role } from '../models/database';
import ConfigInterface from './config-interface';

export default class Config implements ConfigInterface {
	database : DbConfig;
	roles : RolesRow[];
	config : ConfigRow[];
	stringConfig : StringConfigRow[];

	constructor(database : DbConfig) {
		this.database = database;
		this.roles = [];
		this.config = [];
		this.stringConfig = [];
	}

	getRoles(userid : string) : Role[] {
		if (this.roles.length === 0) {
			return [];
		}

		let userRoles = this.roles.filter(x => x.userid === userid);
		return userRoles.map(x => x.role);
	}

	getConfig(config : string) : number {
		if (this.config.length === 0) {
			return null;
		}

		return this.config.find(x => x.name.toUpperCase() === config.toUpperCase()).value;
	}

	getStringConfig(config : string) : string[] {
		return this.stringConfig.filter(x => x.name.toUpperCase() === config.toUpperCase())
			.map(function (x) {
				return x.value;
			}
		);
	}

	checkRole(userid : string, role : Role) : boolean {
		if(!this.roles) return false;
		return this.roles.some(x =>
			x.userid === userid &&
			x.role === role);
	}

	getAllRoles() : RolesRow[] {
		return this.roles;
	}

	getAllConfig() : ConfigRow[] {
		return this.config;
	}

	getAllStringConfig() : StringConfigRow[] {
		return this.stringConfig;
	}

	async updateAll() : Promise<void> {
		await Promise.all([this.updateRoles(), this.updateConfig(), this.updateStringConfig()]);
	}

	async updateRoles() : Promise<void> {
		let data = await this.database.getRoles();

		this.roles = data;
		__logger.debug(this.roles);
	}

	async updateConfig() : Promise<void> {
		let data = await this.database.getConfig();

		this.config = data;
		__logger.debug(this.config);
	}

	async updateStringConfig() : Promise<void> {
		let data = await this.database.getStringConfig();

		this.stringConfig = data;
		__logger.debug(this.stringConfig);
	}

	async setRole(userid : string, role : Role) : Promise<void> {
		await this.database.setRoles(userid, role);
		await this.updateRoles();
	}

	async setConfig(config : string, value : number) : Promise<void> {
		if (isNaN(value)) {
			throw new Error('error: config must be an integer');
		}

		await this.database.setConfig(config, value);
		await this.updateConfig();
	}

	async setStringConfig(config : string, value : string) : Promise<void> {
		await this.database.setStringConfig(config, value);
		await this.updateStringConfig();
	}

	async deleteRole(userid : string, role : Role) : Promise<void> {
		await this.database.deleteRole(userid, role);
		await this.updateRoles();
	}

	async deleteConfig(config : string) : Promise<void> {
		await this.database.deleteConfig(config);
		await this.updateConfig();
	}

	async deleteStringConfig(config : string, value : string) : Promise<void> {
		await this.database.deleteStringConfig(config, value);
		await this.updateStringConfig();
	}
}
