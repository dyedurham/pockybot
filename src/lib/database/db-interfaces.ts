import { QueryResult } from 'pg';
import { ResultRow, PegGiven, UserRow, RolesRow, ConfigRow, StringConfigRow, Role } from '../../models/database';
import Config from '../config';

export interface PockyDB {
	loadConfig : (config : Config) => void;
	givePegWithComment : (comment : string, receiver : string, sender : string) => Promise<number>;
	countPegsGiven : (user : string, keywords : string[], penaltyKeywords : string[]) => Promise<number>;
	hasSparePegs : (user : string, comment : string) => Promise<boolean>;
	reset : () => Promise<QueryResult>;
	returnResults : () => Promise<ResultRow[]>;
	returnWinners : () => Promise<ResultRow[]>;
	getPegsGiven : (user : string) => Promise<PegGiven[]>;
}

export interface DbUsers {
	createUser : (userid : string) => Promise<QueryResult>;
	updateUser : (username : string, userid : string) => Promise<number>;
	getUsers : () => Promise<UserRow[]>;
	getUser : (userid : string) => Promise<UserRow>;
	existsOrCanBeCreated : (userid : string) => Promise<boolean>;
	exists : (userid : string) => Promise<boolean>;
}

export interface DbConfig {
	getRoles : () => Promise<RolesRow[]>;
	getConfig : () => Promise<ConfigRow[]>;
	getStringConfig : () => Promise<StringConfigRow[]>;
	setRoles : (userid : string, role : Role) => Promise<void>;
	setConfig : (config : string, value : number) => Promise<void>;
	setStringConfig : (config : string, value : string) => Promise<void>;
}
