global.__base = __dirname + '/../';
global.__logger = {
	debug: function () {},
	error: function () {},
	information: function () {},
	warn: function () {}
}

process.env.BOT_ID = 'testid';
process.env.BOT_NAME = 'TestBot';
process.env.FILE_URL = 'https://test.com.au/bots/testbot/results';
process.env.POST_URL = 'https://test.com.au/bots/testbot/respond';
