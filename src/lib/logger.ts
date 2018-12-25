import constants from '../constants';

function debug(message : any) {
	console.log(`${new Date().toISOString()} DEBUG ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
};

function error(message : any) {
	console.log(`${new Date().toISOString()} ERROR ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
};

function information(message : any) {
	console.log(`${new Date().toISOString()} INFORMATION ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
};

function warn(message : any) {
	console.log(`${new Date().toISOString()} WARNING ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
};

export default {
	debug,
	error,
	information,
	warn
}
