const print = console.log

var {commands} = require('./slash_commands.js')
var {view_queue} = require('./music.js')

var votes = new Map([
	["y",0],
	["m",0],
	["n",0]
])

const keywords = ["CLEAR", "BACK"]

var keypad = new Map()

function parse_int(interaction, client) {
	if (interaction.isButton()) {
		let args = interaction.customId.split(" ")
		let main = args.shift()
		let msg = interaction.message
		
		switch (main) {
			case 'test':
				print(`${interaction.user.username} ==> ${args[0]}`)
				votes.set(args[0], votes.get(args[0])+1)
				var string = ""
				votes.forEach((v, k) => {
					string += `| ${k}: ${v} `
				})
				interaction.update({content: `Should I be moderator? 👁 \`\`\`${string}|\`\`\``})
			break;
			case 'keypad':
				print(`${interaction.user.username} ==> ${args[0]}`)
				if (keypad.has(msg.id)) {
					if (!keywords.includes(args[0])) {
						var current = keypad.get(msg.id)
						if (current == "EMPTY") {current = ""}
						current += args[0]
						keypad.set(msg.id, current)
					} else {
						switch (args[0]) {
							case 'CLEAR':
								keypad.set(msg.id, "EMPTY")
							break;
							case 'BACK':
								var current = keypad.get(msg.id)
								current = current.slice(0, -1)
								keypad.set(msg.id, current)
							break;
						}
					}
				} else {
					if (!keywords.includes(args[0])) {
						keypad.set(msg.id, args[0])
					}
				}
				var current = keypad.get(msg.id)
				interaction.update({content: `\`\`\`${current}\`\`\``})
			break;
			case 'queue':
				view_queue(args[0], msg, interaction, client)
			break;
		}
	} else if (interaction.isCommand()) {
		commands.dict[interaction.commandName].exec(interaction, [], client)
	}
}

module.exports = {
	parse_int: parse_int,
}