import QueryHandler from './query-handler';
import { QueryConfig } from 'pg';
import { ConfigRow, RolesRow, StringConfigRow, Role } from '../../models/database';
import { DbConfig as DbConfigInterface } from './db-interfaces';

export default class DbConfig  implements DbConfigInterface {
	private readonly sqlGetConfig : string;
	private readonly sqlGetStringConfig : string;
	private readonly sqlGetRoles : string;
	private readonly sqlSetConfig : string;
	private readonly sqlSetStringConfig : string;
	private readonly sqlSetRoles : string;
	private readonly sqlDeleteConfig : string;
	private readonly sqlDeleteRoles : string;
	private readonly sqlDeleteStringConfig : string;

	private queryHandler : QueryHandler;

	constructor(queryHandler : QueryHandler) {
		this.queryHandler = queryHandler;

		this.sqlGetConfig = this.queryHandler.readFile('../../database/queries/get_config.sql');
		this.sqlGetStringConfig = this.queryHandler.readFile('../../database/queries/get_string_config.sql');
		this.sqlGetRoles = this.queryHandler.readFile('../../database/queries/get_roles.sql');
		this.sqlSetConfig = this.queryHandler.readFile('../../database/queries/set_config.sql');
		this.sqlSetStringConfig = this.queryHandler.readFile('../../database/queries/set_string_config.sql');
		this.sqlSetRoles = this.queryHandler.readFile('../../database/queries/set_roles.sql');
		this.sqlDeleteConfig = this.queryHandler.readFile('../../database/queries/delete_config.sql');
		this.sqlDeleteRoles = this.queryHandler.readFile('../../database/queries/delete_roles.sql');
		this.sqlDeleteStringConfig = this.queryHandler.readFile('../../database/queries/delete_string_config.sql');
	}

	async getRoles() : Promise<RolesRow[]> {
		let query : QueryConfig = {
			name: 'returnRolesQuery',
			text: this.sqlGetRoles,
			values: []
		};

		return await this.queryHandler.executeQuery(query);
	}

	async getConfig() : Promise<ConfigRow[]> {
		let query : QueryConfig = {
			name: 'returnConfigQuery',
			text: this.sqlGetConfig,
			values: []
		};

		return await this.queryHandler.executeQuery(query);
	}

	async getStringConfig() : Promise<StringConfigRow[]> {
		let query : QueryConfig = {
			name: 'returnStringConfigQuery',
			text: this.sqlGetStringConfig,
			values: []
		};

		return await this.queryHandler.executeQuery(query);
	}

	async setRoles(userid : string, role : Role) : Promise<void> {
		let query : QueryConfig = {
			name: 'setRolesQuery',
			text: this.sqlSetRoles,
			values: [userid, role]
		};

		await this.queryHandler.executeNonQuery(query);
	}

	async setConfig(config : string, value : number) : Promise<void> {
		let query : QueryConfig = {
			name: 'setConfigQuery',
			text: this.sqlSetConfig,
			values: [config, value]
		};

		await this.queryHandler.executeNonQuery(query);
	}

	async setStringConfig(config : string, value : string) : Promise<void> {
		let query : QueryConfig = {
			name: 'setStringConfigQuery',
			text: this.sqlSetStringConfig,
			values: [config, value]
		};

		await this.queryHandler.executeNonQuery(query);
	}

	async deleteRole(userid : string, role : Role) : Promise<void> {
		let query : QueryConfig = {
			name: 'deleteRoleQuery',
			text: this.sqlDeleteRoles,
			values: [userid, role]
		};

		await this.queryHandler.executeNonQuery(query);
	}

	async deleteConfig(config : string) : Promise<void> {
		let query : QueryConfig = {
			name: 'deleteConfigQuery',
			text: this.sqlDeleteConfig,
			values: [config]
		};

		await this.queryHandler.executeNonQuery(query);
	}

	async deleteStringConfig(config : string, value: string) : Promise<void> {
		let query : QueryConfig = {
			name: 'deleteStringConfigQuery',
			text: this.sqlDeleteStringConfig,
			values: [config, value]
		};

		await this.queryHandler.executeNonQuery(query);
	}
}
