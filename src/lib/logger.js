const constants = require(__base + `constants`);

exports.debug = function(message) {
	console.log(`${new Date().toISOString()} DEBUG ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
};

exports.error = function(message) {
	console.log(`${new Date().toISOString()} ERROR ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
};

exports.information = function(message) {
	console.log(`${new Date().toISOString()} INFORMATION ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
};

exports.warn = function(message) {
	console.log(`${new Date().toISOString()} WARNING ${constants.botName} ${process.env.VERSION_BRANCH} 1 ${JSON.stringify(message)}`)
};
