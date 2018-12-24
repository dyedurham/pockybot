module.exports = class Utilities {
	sleep(seconds) {
		return new Promise(resolve => setTimeout(resolve, seconds * 1000));
	}

	getRandomInt(num) {
		return Math.floor(Math.random() * num);
	}
};
