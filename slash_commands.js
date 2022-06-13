const print = console.log

var BotCommandsJS = require('./bot_commands.js')
var bot_commands = BotCommandsJS.commands

const SAME = "060205"

var commands = {
	array: [],
	dict: {}
}

function print_err(int, err) {
	print(err)
	int.reply({
		embeds: [{
					title: `There's an error 🥴:`,
					description: `\`\`\`js\n${String(err)}\`\`\``,
					footer: {
						text: "Submit this to Blu in the ``#bot-errors`` channel on the Blu Heck Hole server"
					}
				}]
	})
}

class SlashCommand {
	constructor(title, desc, args, func) {
		this.desc = (desc == SAME ? bot_commands.dict[title].desc : desc)
		this.args = args
		if (func == SAME) {
			this.compat = true
			var function_string = bot_commands.dict[title].func.toString()
			var replacer = new RegExp("msg.channel.send", 'g')
			var new_function_string = function_string.replace(replacer, "int.reply")
			new_function_string = new_function_string.replace("function (msg, args, client) {", "")
			new_function_string = new_function_string.slice(0, -1)
			this.func = new Function('int', 'args', 'client', new_function_string)
		} else { this.compat = false; this.func = func }
		this.type = 'slash'
		if (Array.isArray(title)) {
			this.title = title[0]
			commands.array.push(this.title)
			title.forEach(i => {
				commands.dict[i] = this
			})
		} else {
			this.title = title
			commands.array.push(this.title)
			commands.dict[this.title] = this
		}
	}

	exec(int, args, client) {
		try {
			if (this.compat) {
				var new_func = this.func
				new_func(int, args, client)
			} else {
				this.func(int, args, client)
			}
		} catch(err) {
			print_err(int, err)
		}
	}
}

new SlashCommand("help", SAME, [], SAME)

module.exports = {
	commands: commands
}