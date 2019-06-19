import { Role, RolesRow, ConfigRow, StringConfigRow } from '../models/database';

export default interface Config {
	getRoles : (userid : string) => Role[];
	getConfig : (config : string) => number;
	getStringConfig : (config : string) => string[];
	checkRole : (userid : string, role : Role) => boolean;
	getAllRoles : () => RolesRow[];
	getAllConfig : () => ConfigRow[];
	getAllStringConfig : () => StringConfigRow[];
	updateAll : () => Promise<void>;
	updateRoles : () => Promise<void>;
	updateConfig : () => Promise<void>;
	updateStringConfig : () => Promise<void>;
	setRole : (userid : string, role : Role) => Promise<void>;
	setConfig : (config : string, value : number) => Promise<void>;
	setStringConfig : (config : string, value : string) => Promise<void>;
	deleteRole : (userid : string, role : Role) => Promise<void>;
	deleteConfig : (config : string) => Promise<void>;
	deleteStringConfig : (config : string, value : string) => Promise<void>;
}
