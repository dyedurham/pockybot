const constants = require(__base + `constants`);

const commandText = 'ping';
const pingCommand = `(?: )*${commandText}(?: )*`;

module.exports = {
	name: "ping",

	isToTriggerOn: function(message) {
		var pattern = new RegExp('^' + constants.optionalMarkdownOpening + constants.mentionMe + pingCommand, 'ui');
		return pattern.test(message.html);
	},

	isToTriggerOnPM: function(message) {
		return message.text.toLowerCase().trim() === commandText;
	},

	async createMessage() {
		return {
			markdown: `pong. I'm alive!`
		};
	}
}
