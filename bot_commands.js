const print = console.log

const { SoundcloudSong } = require('omni-parser')

var commands = {
	array: [],
	dict: {}
}

function print_err(msg, err) {
	print(err)
	msg.channel.send("", {
		embed: {
			title: `There's an error 🥴:`,
			description: `\`\`\`js\n${String(err)}\`\`\``,
			footer: {
				text: "Submit this to Blu in the ``#bot-errors`` channel on the Blu Heck Hole server"
			}
		}
	})
}

class BotCommand {
	constructor(title, desc, args, image, func) {
		this.desc = desc
		this.args = args
		this.func = func
		this.image = image
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

	exec(msg, args) {
		try {
			print('haha')
			this.func(msg, args)
		} catch(err) {
			print_err(msg, err)
		}
	}
}

new BotCommand("help", "Displays a list of commands, and their functions", ["[<command>]"], null, function (msg, args) {
	if (args != null && args.length != 0) {
		if (commands.array.includes(args[0])) {
			let command = commands.dict[args[0]]
			msg.channel.send(`**${command.title}** \`\`${command.args.join(" ")}\`\`\n\`\`\`${command.desc}\`\`\``)
		}
	} else {
		let strings = []
		commands.array.forEach(o => {
			let i = commands.dict[o]
			strings.push(`**${i.title}**`)
		})
		msg.channel.send(`List of commands: (Type \`\`help <command>\`\` for more info)\n${strings.join(", ")}`)
	}
})

new BotCommand("ping", "Returns pong!", ["none"], null, function (msg, args) {
	msg.channel.send("pong!")
})

new BotCommand("lists", "List related functions", ["{+|-|=|revert}", "{<number>|none}"], null, function (msg, args) {
	msg.channel.send("️️⚙ in the works...")
})

function parse_msg(message) {
	let text = message.content
	let args = text.split(" ")
	let prefix = ""
	if (text.toLowerCase().startsWith("hey blubot, ")) {
		prefix = ".bb"
		let null_val = args.shift()
		text = text.toLowerCase().replace("hey blubot,", ".bb")
		args = text.split(" ")
		args.shift()
	} else {
		prefix = args.shift()
	}
	let cmd_title = args.shift()
	let guild = message.guild.id
	let local_storage
	try {
		 local_storage = require(`./storage/guilds/${guild}.json`)
	} catch(err) {
		local_storage = null
	}
	let selector = (local_storage != null && local_storage.selector != null ? local_storage.selector : '.')
	if (prefix == ".bb") {
		if (Object.keys(commands.dict).includes(cmd_title)) {
			commands.dict[cmd_title].exec(message, args)
		} else {
			print_err(message, `Command '${cmd_title}' doesn't exist`)
		}
	}
}

module.exports = {
	parse_msg: parse_msg,
	BotCommand: BotCommand
}