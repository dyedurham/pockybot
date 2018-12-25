import dbConstants from "../../lib/db-constants";

export default class PockyDB {
	loadConfig(config) {
	}

	async givePegWithComment(comment, receiver, sender = "default_user") {
		return dbConstants.pegSuccess;
	}

	async createUser(userid) {
	}

	async updateUser(username, userid) {
		return dbConstants.updateUserSuccess;
	}

	async getUsers() {
		return {};
	}

	async getUser(userid) {
		return {};
	}

	async existsOrCanBeCreated(userid) {
		return true;
	}

	async exists(userid) {
		return true;
	}

	async countPegsGiven(user) {
		return 0;
	}

	async hasSparePegs(user) {
		return true;
	}

	async reset() {
		return null;
	}

	async returnResults() {
		return {};
	}

	async returnWinners() {
		return {};
	}

	async getPegsGiven(user) {
		return {};
	}

	async getRoles() {
		return {};
	}

	async getConfig() {
		return {};
	}

	async getStringConfig() {
		return {};
	}

	async setRoles(userid, role) {
		return {};
	}

	async setConfig(config, value) {
		return {};
	}

	async setStringConfig(config, value) {
		return {};
	}
}
