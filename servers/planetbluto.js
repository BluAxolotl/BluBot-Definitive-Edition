const {ConsoleServer, ConsoleCommand, print, print_debug} = require('console-to-server')
const Discord = require('discord.js')
const GUILD_ID = "974958084415954984"
const REACT_MSG = "977637818090287177"

module.exports = client => {
	client.on('guildMemberAdd', member => { // Auto Roles
		if (member.guild.id == GUILD_ID) {
			if (!member.user.bot) {
				member.roles.add("977632633582407693")
			} else {
				member.roles.add("977634874242523176")
			}
		}
	})

	client.channels.fetch("975097699152044033").then(channel => { // CACHE REACTION ROLE MESSAGE
		channel.messages.fetch("977637818090287177", {cache: true})
	})

	const REACTION_ROLES = {
		"🔔": "977632884921860106",
		"🔵": "977642445644902400",
		"🎉": "977654647261114432",
		"🎬": "977915670203359332",
	}

	client.on('messageReactionAdd', async (reaction, user) => { // Adding Reaction Roles
		if (reaction.message.id == REACT_MSG) {
			let member = await reaction.message.guild.members.fetch(user.id)
			if (Object.keys(REACTION_ROLES).includes(reaction.emoji.name)) {
				member.roles.add(REACTION_ROLES[reaction.emoji.name])
			}
		}
	})

	client.on('messageReactionRemove', async (reaction, user) => { // Removing Reaction Roles
		if (reaction.message.id == REACT_MSG) {
			let member = await reaction.message.guild.members.fetch(user.id)
			if (Object.keys(REACTION_ROLES).includes(reaction.emoji.name)) {
				member.roles.remove(REACTION_ROLES[reaction.emoji.name])
			}
		}
	})
}