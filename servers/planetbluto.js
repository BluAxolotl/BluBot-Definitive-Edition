const print = console.log
const Discord = require('discord.js')
const GUILD_ID = "974958084415954984"

const CITIZEN_ROLE = `977632633582407693`

module.exports = client => {
	client.on('guildMemberAdd', member => { // Auto Roles
		if (member.guild.id == GUILD_ID) {
			if (!member.user.bot) {
				member.roles.add(CITIZEN_ROLE)
			} else {
				member.roles.add(CITIZEN_ROLE)
			}
		}
	})

	async function citizen() {
		var guild = await client.guilds.fetch(GUILD_ID)
		var guild_members = await guild.members.fetch()
		await guild_members.toJSON().awaitForEach(async member => {
			var member_roles = member.roles.cache
			var roles_to_add = []

			if (!member_roles.has(CITIZEN_ROLE)) {
				roles_to_add.push(CITIZEN_ROLE)
			}

			if (roles_to_add.length > 0) { await member.roles.add(roles_to_add) }

			print(`--- ${member.user.username} validated ✔`)
		})

		print("- Memebers successfully validated!")
	}

	citizen()
}
