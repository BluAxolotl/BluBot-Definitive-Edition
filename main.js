require('dotenv').config()
const {ConsoleCommand, print, print_debug} = require('console-to-server')
// const {  } = require('console-to-server')

const token = process.env['token']
const Discord = require('discord.js');
const client = new Discord.Client();

require('./music.js')
var {parse_msg} = require('./bot_commands.js')

client.on('message', parse_msg)
client.on('ready', () => {
	print(`BluBot Initialized!`)
})
client.login(token)