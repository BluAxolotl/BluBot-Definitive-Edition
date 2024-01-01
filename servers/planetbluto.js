const print = console.log
const Discord = require('discord.js')
const GUILD_ID = "974958084415954984"
const REACT_CHL = "975097699152044033"
const REACT_MSG = "977637818090287177"

const CITIZEN_ROLE = `977632633582407693`

module.exports = client => {
	const REACTION_ROLES = {
		"🔔": "977632884921860106",
		"🔵": "977642445644902400",
		"🎉": "977654647261114432",
		"🎬": "977915670203359332",
		"🏁": "1175081394901360741",
		"🤓": "987693694230593566",
		"🎨": "988878760646422548",
		"🎵": "988878487320424468",
		"🎼": "1191176645411868712",
		"🔴": "1191510902961348719",
	}

	client.on('guildMemberAdd', member => { // Auto Roles
		if (member.guild.id == GUILD_ID) {
			if (!member.user.bot) {
				member.roles.add(CITIZEN_ROLE)
			} else {
				member.roles.add(CITIZEN_ROLE)
			}
		}
	})

	client.channels.fetch(REACT_CHL).then(async channel => { // CACHE REACTION ROLE MESSAGE
		var message = await channel.messages.fetch(REACT_MSG, {cache: true})
		var json_reactions = message.reactions.cache.toJSON()
		var reactions = {}

		print("Updating Reaction Roles...")

		await json_reactions.awaitForEach(async reaction => {
			await reaction.users.fetch()
			reactions[reaction.emoji] = reaction.users.cache.map(member => member.id)
		})

		print(`- ${Object.keys(reactions)}`)
		print("- Message Reactions Parsed, Scanning Memberbase...")

		var guild = await client.guilds.fetch(GUILD_ID)
		var guild_members = await guild.members.fetch()
		await guild_members.toJSON().awaitForEach(async member => {
			var roles_to_add = []
			var roles_to_remove = []

			Object.keys(reactions).forEach(async key => {
				var role_id = REACTION_ROLES[key]
				var valid_members = reactions[key]
				var member_roles = member.roles.cache

				// if (!Array.isArray(valid_members)) { print("Bitch, wtf"); print(valid_members) }

				if (!Array.isArray(valid_members)) { return }

				if (!member_roles.has(role_id)) {
					roles_to_add.push(CITIZEN_ROLE)
				}

				if (valid_members.includes(member.id) && !member_roles.has(role_id)) {
					roles_to_add.push(role_id)
				}
				if (!valid_members.includes(member.id) && member_roles.has(role_id)) {
					roles_to_remove.push(role_id)
				}
			})

			if (roles_to_add.length > 0) { await member.roles.add(roles_to_add) }
			if (roles_to_remove.length > 0) { await member.roles.remove(roles_to_remove) }

			print(`--- ${member.user.username} validated ✔`)
		})

		print("- Memebers successfully validated!")
	})

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
