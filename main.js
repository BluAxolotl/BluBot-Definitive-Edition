const print = console.log
require('dotenv').config({ path: `${__dirname}/.env` })
const token = process.env['token']

var {commands, parse_content, parse_msg} = require('./bot_commands.js')
var slash_commands = require('./slash_commands.js').commands

require('./music.js')

const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')

const SlashCommands = slash_commands.array.map(o => {
	var command = slash_commands.dict[o]
	var title = command.title
	if (command.slashTitle) { title = command.slashTitle }
	return {
		name: title,
		description: command.desc,
		type: 1
	}
})

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

	await rest.put(
		Routes.applicationGuildCommands("705347670054666260", "915596570538422292"),
		{ body: SlashCommands },
	);

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

var JSONFile = null
var Low = null

////////////////////////////////////////////////////////////////////////////////////

// const {  } = require('console-to-server')

const { Client, Intents, Message } = require('discord.js')
const client = new Client({ intents: Object.values(Intents.FLAGS) })

Message.prototype.safe_delete = function () {
	if (this.author.id == client.user.id || this.channel.permissionsFor(client.user).has("MANAGE_MESSAGES")) {
		this.delete()
	} else { return }
}

var {parse_int} = require('./interact.js')

function check_com(content) {
	let result = parse_content(content)
	let command = commands.dict[result.title]
	if (command === undefined) {
		return null
	} else {
		return commands.dict[result.title].type
	}
}

import('lowdb').then((module) => {
    JSONFile = module.JSONFileSync
    Low = module.LowSync
    print("LowDB init'd")
})

client.on('messageCreate', msg => { parse_msg(msg, client) })
client.on('voiceStateUpdate', (s_old, s_new) => { require('./voice_chat_role.js')(s_old, s_new, client, Low, JSONFile) })
// client.on('messageCreate', msg => {if (check_com(msg.content) == 'normal') {parse_msg(msg, client)} })
// legacy_client.on('message', msg => {if (check_com(msg.content) == 'music') {parse_msg(msg, client)} })
client.on('interactionCreate', interaction => { parse_int(interaction, client) })
var loaded = 0
client.on('ready', () => { 
	// [ SERVERS ]
	require('./servers/planetbluto.js')(client)
	print(`BluBot Initialized! (v13)`)
	loaded = 2
	if (loaded == 2) {print("BluBot Initialized! (COMPLETE)")}
})

client.login(token)
// legacy_client.login(token)