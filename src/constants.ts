export default {
	//environment constants
	botId: process.env.BOT_ID,
	botName: process.env.BOT_NAME,
	postUrl: process.env.POST_URL,
	pmUrl: process.env.PM_URL,

	todoUrl: 'https://github.com/GlobalX/pockybot/issues',
	googleUrl: 'https://storage.googleapis.com/',

	//format rules
	mentionAny: '<spark-mention data-object-type="person" data-object-id="([^"]*)">(?:[^<]*)<\/spark-mention>',
	mentionMe: `<spark-mention data-object-type="person" data-object-id="${process.env.BOT_ID}">${process.env.BOT_NAME}<\/spark-mention>`,
	optionalMarkdownOpening: '(?:<p>)?',
	optionalMarkdownEnding: '(?:<\/p>)?',
	optionalSpace: '(?: )*',
	sparkTokenPrefix: 'ciscospark://us/PEOPLE/'
};
