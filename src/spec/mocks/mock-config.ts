import Config from '../../lib/config-interface';
import { Role } from '../../models/database';

export default class MockConfig implements Config {
	getRoles(userid : string) : Role[] {
		throw new Error("Method not implemented.");
	}

	getConfig(config : string) : number {
		throw new Error("Method not implemented.");
	}

	getStringConfig(config : string) : string[] {
		throw new Error("Method not implemented.");
	}

	checkRole(userid : string, role : Role) : boolean {
		throw new Error("Method not implemented.");
	}

	getAllRoles() : RolesRow[] {
		throw new Error("Method not implemented.");
	}

	getAllConfig() : ConfigRow[] {
		throw new Error("Method not implemented.");
	}

	async updateAll() : Promise<void> {
		throw new Error("Method not implemented.");
	}

	async updateRoles() : Promise<void> {
		throw new Error("Method not implemented.");
	}

	async updateConfig() : Promise<void> {
		throw new Error("Method not implemented.");
	}

	async updateStringConfig() : Promise<void> {
		throw new Error("Method not implemented.");
	}

	async setRole(userid : string, role : Role) : Promise<void> {
		throw new Error("Method not implemented.");
	}

	async setConfig(config : string, value : number) : Promise<void> {
		throw new Error("Method not implemented.");
	}

	async setStringConfig(config : string, value : string) : Promise<void> {
		throw new Error("Method not implemented.");
	}
}
