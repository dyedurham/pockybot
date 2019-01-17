import Config from '../../lib/config-interface';
import { Role, RolesRow, ConfigRow } from '../../models/database';

export default class MockConfig implements Config {
	private limit : number;
	private minimum : number;
	private winners : number;
	private commentsRequired : number;
	private pegWithoutKeyword : number;
	private requireValues : number;
	private keywords : string[];

	constructor(limit : number, minimum : number, winners : number,
		commentsRequired : number, pegWithoutKeyword : number, requireValues : number,
		keywords : string[]) {
		this.limit = limit;
		this.minimum = minimum;
		this.winners = winners;
		this.commentsRequired = commentsRequired;
		this.pegWithoutKeyword = pegWithoutKeyword;
		this.requireValues = requireValues;
		this.keywords = keywords;
	}

	getRoles(userid : string) : Role[] {
		throw new Error('Method not implemented.');
	}

	getConfig(config : string) : number {
		switch(config) {
			case 'limit':
				return this.limit;
			case 'minimum':
				return this.minimum;
			case 'winners':
				return this.winners;
			case 'commentsRequired':
				return this.commentsRequired;
			case 'pegWithoutKeyword':
				return this.pegWithoutKeyword;
			case 'requireValues':
				return this.requireValues;
			default:
				throw new Error('config does not exist');
		}
	}

	getStringConfig(config : string) : string[] {
		if (config === 'keyword') {
			return this.keywords;
		} else {
			throw new Error('config does not exist');
		}
	}

	checkRole(userid : string, role : Role) : boolean {
		throw new Error('Method not implemented.');
	}

	getAllRoles() : RolesRow[] {
		throw new Error('Method not implemented.');
	}

	getAllConfig() : ConfigRow[] {
		throw new Error('Method not implemented.');
	}

	async updateAll() : Promise<void> {
		throw new Error('Method not implemented.');
	}

	async updateRoles() : Promise<void> {
		throw new Error('Method not implemented.');
	}

	async updateConfig() : Promise<void> {
		throw new Error('Method not implemented.');
	}

	async updateStringConfig() : Promise<void> {
		throw new Error('Method not implemented.');
	}

	async setRole(userid : string, role : Role) : Promise<void> {
		throw new Error('Method not implemented.');
	}

	async setConfig(config : string, value : number) : Promise<void> {
		throw new Error('Method not implemented.');
	}

	async setStringConfig(config : string, value : string) : Promise<void> {
		throw new Error('Method not implemented.');
	}
}
