import { QueryResult } from 'pg';
import { ResultRow, PegGiven, UserRow, RolesRow, ConfigRow, StringConfigRow, Role, UserLocationRow } from '../../models/database';
import Config from '../config-interface';

export interface PockyDB {
	loadConfig : (config : Config) => void;
	givePegWithComment : (comment : string, receiver : string, sender : string) => Promise<number>;
	countPegsGiven : (user : string, keywords : string[], penaltyKeywords : string[]) => Promise<number>;
	senderCanPeg : (user : string, comment : string) => Promise<boolean>;
	reset : () => Promise<QueryResult>;
	returnResults : () => Promise<ResultRow[]>;
	getPegsGiven : (user : string) => Promise<PegGiven[]>;
}

export interface DbUsers {
	createUser : (userid : string) => Promise<QueryResult>;
	updateUser : (username : string, userid : string) => Promise<number>;
	getUsers : () => Promise<UserRow[]>;
	getUser : (userid : string) => Promise<UserRow>;
	existsOrCanBeCreated : (userid : string) => Promise<boolean>;
	exists : (userid : string) => Promise<boolean>;
	deleteUser : (userid : string) => Promise<void>;
}

export interface DbConfig {
	getRoles : () => Promise<RolesRow[]>;
	getConfig : () => Promise<ConfigRow[]>;
	getStringConfig : () => Promise<StringConfigRow[]>;
	setRoles : (userid : string, role : Role) => Promise<void>;
	setConfig : (config : string, value : number) => Promise<void>;
	setStringConfig : (config : string, value : string) => Promise<void>;
	deleteRole : (userid : string, role : Role) => Promise<void>;
	deleteConfig : (config : string) => Promise<void>;
	deleteStringConfig : (config : string, value : string) => Promise<void>;
}

export interface DbLocation {
	getUserLocation : (userid : string) => Promise<UserLocationRow>;
	getAllUserLocations : () => Promise<UserLocationRow[]>;
	getLocations : () => Promise<string[]>;
	getUsersWithoutLocation : () => Promise<UserRow[]>;
	setUserLocation : (userid: string, location : string) => Promise<void>;
	setLocation : (name : string) => Promise<void>;
	deleteUserLocation : (userid : string) => Promise<void>;
	deleteLocation : (name : string) => Promise<void>;
}
