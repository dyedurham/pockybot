import constants from '../constants';

export module Logger {
	export function debug(message : any) {
		console.log(`${new Date().toISOString()} DEBUG ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
	};

	export function error(message : any) {
		console.log(`${new Date().toISOString()} ERROR ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
	};

	export function information(message : any) {
		console.log(`${new Date().toISOString()} INFORMATION ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
	};

	export function warn(message : any) {
		console.log(`${new Date().toISOString()} WARNING ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
	};
}
