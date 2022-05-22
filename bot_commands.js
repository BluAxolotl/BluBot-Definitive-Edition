const print = console.log

const { SoundcloudSong } = require('omni-parser')
const Discord = require('discord.js')
const EMBED_COLOR = "024aca"

var gis = require('g-i-s')

var DevOnlyMode = false
var Devs = ["229319768874680320"]

var commands = {
	array: [],
	dict: {}
}

Array.prototype.remove = function (index) {
    if (index > -1 && index < this.length-1) {
    	var return_value = this.splice(index, 1)
    	return return_value
    }
}

function print_err(msg, err) {
	print(err)
	msg.channel.send({
		embeds:[{
			title: `There's an error 🥴:`,
			description: `\`\`\`js\n${String(err)}\`\`\``,
			footer: {
				text: "Submit this to Blu in the ``#bot-errors`` channel on the Blu Heck Hole server"
			}
		}]
	})
}

class BotCommand {
	constructor(title, desc, args, image, func) {
		this.desc = desc
		this.args = args
		this.func = func
		this.image = image
		this.type = 'normal'
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

	exec(msg, args, client) {
		try {
			this.func(msg, args, client)
		} catch(err) {
			print_err(msg, err)
		}
	}
}

new BotCommand("help", "Displays a list of commands, and their functions", ["[<command>]"], null, function (msg, args, client) {
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

new BotCommand("ping", "Returns pong!", ["none"], null, function (msg, args, client) {
	msg.channel.send("pong!")
})

new BotCommand("pong", "Returns pong!", ["none"], null, function (msg, args, client) {
	msg.channel.send("ping!")
})

new BotCommand("dev", "Makes it so that only the user with the id \"229319768874680320\" can use commands", ["things"], null, async function (msg, args, client) {
	switch (args[0]) {
		case 'toggle':
			DevOnlyMode = !DevOnlyMode
			if (DevOnlyMode) {
				msg.channel.send("```diff\n+ Dev Mode enabled!\n```")
			} else {
				msg.channel.send("```diff\n- Dev Mode disabled!\n```")
			}
		break;
		case 'add':
			let new_dev = await client.users.fetch(args[1])
			if (Devs.indexOf(args[1]) == -1) {
				Devs.push(args[1])
				msg.channel.send(`\`\`\`diff\n+ Added ${new_dev.username} as a temporary developer!\n\`\`\``)
			} else {
				msg.channel.send(`\`\`\`diff\n• ${new_dev.username} is already a developer!\n\`\`\``)
			}
		break;
		case 'remove':
			let ind = Devs.indexOf(args[1])
			let old_dev = await client.users.fetch(args[1])
			if (ind != -1) {
				print(ind)
				Devs.splice(ind, 1)
				msg.channel.send(`\`\`\`diff\n- Removed ${old_dev.username} as a temporary developer!\n\`\`\``)
			} else {
				msg.channel.send(`\`\`\`diff\n• ${old_dev.username} is not a developer!\n\`\`\``)
			}
		break;
		case 'list':
			let local_devs = []
			Devs.forEach(async id => {
				let user = await client.users.fetch(id)
				local_devs.push(user.username)
				if (local_devs.length == Devs.length) { rest() }
			})
			let rest = () => {
				msg.channel.send(`\`\`\`diff\nDevelopers\n================\n${local_devs.join("\n")}\`\`\``)
			}
		break;
	}
})

new BotCommand("keypad", "Test keypad....", ["none"], null, function (msg, args, client) {
	var buttons1 = [
		new Discord.MessageButton({
			label: "1️⃣",
			customId: "keypad 1",
			style: 1
		}),
		new Discord.MessageButton({
			label: "2️⃣",
			customId: "keypad 2",
			style: 1
		}),
		new Discord.MessageButton({
			label: "3️⃣",
			customId: "keypad 3",
			style: 1
		})
	]
	var buttons2 = [
		new Discord.MessageButton({
			label: "4️⃣",
			customId: "keypad 4",
			style: 1
		}),
		new Discord.MessageButton({
			label: "5️⃣",
			customId: "keypad 5",
			style: 1
		}),
		new Discord.MessageButton({
			label: "6️⃣",
			customId: "keypad 6",
			style: 1
		})
	]
	var buttons3 = [
		new Discord.MessageButton({
			label: "7️⃣",
			customId: "keypad 7",
			style: 1
		}),
		new Discord.MessageButton({
			label: "8️⃣",
			customId: "keypad 8",
			style: 1
		}),
		new Discord.MessageButton({
			label: "9️⃣",
			customId: "keypad 9",
			style: 1
		})
	]
	var buttons4 = [
		new Discord.MessageButton({
			label: "🗑",
			customId: "keypad CLEAR",
			style: 1
		}),	
		new Discord.MessageButton({
			label: "0️⃣",
			customId: "keypad 0",
			style: 1
		}),
		new Discord.MessageButton({
			label: "🔙",
			customId: "keypad BACK",
			style: 1
		})
	]
	var bottom = new Discord.MessageActionRow({components: buttons4}, client)
	var row1 = new Discord.MessageActionRow({components: buttons1}, client)
	var row2 = new Discord.MessageActionRow({components: buttons2}, client)
	var row3 = new Discord.MessageActionRow({components: buttons3}, client)
	msg.reply({content: "Key in deez bawls 👁", components: [row3, row2, row1, bottom] })
})

var testButtonsCommand = new BotCommand("test_buttons", "Tests buttons....", ["none"], null, function (msg, args, client) {
	var buttons = [
		new Discord.MessageButton({
			label: "Yes!",
			customId: "test y",
			emoji: "735687939253862450",
			style: 1
		}),
		new Discord.MessageButton({
			label: "Maybe!",
			customId: "test m",
			emoji: "735688738902114325",
			style: 1
		}),
		new Discord.MessageButton({
			label: "No!",
			customId: "test n",
			emoji: "739275144836415549",
			style: 1
		})
	]
	var row = new Discord.MessageActionRow({components: buttons}, client)
	msg.reply({content: "Should I be moderator? 👁", components: [row] })
})

new BotCommand("lists", "List related functions", ["{+|-|=|revert}", "{<number>|none}"], null, function (msg, args, client) {
	msg.channel.send("️️⚙ in the works...")
})

new BotCommand("image", "Searches for images under a query", ["query..."], null, async function (msg, args, client) {
	if (msg.author.id == "229319768874680320") {
		let query = args.join(' ')
		gis(query, (err, res) => {
			msg.channel.send({embeds: [new Discord.MessageEmbed({
				title: `Image for "${query}"`,
				image: {url: res[0].url},
				color: EMBED_COLOR
			})]})
		})
	}
})

function parse_content(string) {
	let text = string
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
	return {title: cmd_title, prefix: prefix, args: args}
}

function parse_msg(message, client) {
	let result = parse_content(message.content)
	let cmd_title = result.title
	let command = commands.dict[cmd_title]
	let prefix = result.prefix
	let args = result.args
	let guild = message.guild.id
	let local_storage
	try {
		 local_storage = require(`./storage/guilds/${guild}.json`)
	} catch(err) {
		local_storage = null
	}
	let selector = (local_storage != null && local_storage.selector != null ? local_storage.selector : '.')
	if (prefix == ".bb") {
		if (Object.keys(commands.dict).includes(cmd_title) && !DevOnlyMode) {
			command.exec(message, args, client)
		} else if (DevOnlyMode) {
			if (Devs.includes(message.author.id)) {
				command.exec(message, args, client)
			} else {
				message.channel.send("*Dev mode is enabled, and you're not a dev...*").then(to_delete => {
					setTimeout(function () { to_delete.safe_delete(); message.safe_delete() }, 3000)
				})
			}
		} else {
			message.channel.send("*That command doesn't exist...*").then(to_delete => {
				setTimeout(function () { to_delete.safe_delete(); message.safe_delete() }, 3000)
			})
		}
	}
}

module.exports = {
	parse_msg: parse_msg,
	parse_content: parse_content,
	commands: commands,
	BotCommand: BotCommand
}