const print = console.log



module.exports = (async function (s_old, s_new, client, LowSync, JSONFileSync) {
	const db = new LowSync(new JSONFileSync(`${__dirname}/storage.json`))
	db.read()
	var guild = await client.guilds.fetch(s_new.guild)
	var gid = guild.id
	var client_member = await guild.members.fetch(client.user.id)
	// print("\n\nCan manage roles?")
	if (client_member.permissions.has("MANAGE_ROLES")) {
		// print("Yes; Guild in low database?")
		if (db.data.vc_roles[gid] == null) {
			// print("No; Creating role....")
			let role = await guild.roles.create({
				name: "Voice Chat",
				color: "BLUE",
				reason: "Role to ping people in voice chat",
				mentionable: true
			})
			db.data.vc_roles[gid] = role.id
			db.write()
			db.read()
		}
		if (s_new.channel == null) {
			// print("Member leving voice channel...")
			let member = await guild.members.fetch(s_new.id)
			// print("Got Member...\nRemoving Voice Chat role...")
			try {
				await member.roles.remove(db.data.vc_roles[gid])
			} catch (err) {
				print(err)
			}
		} else if (s_old.channel == null) {
			// print("Member 'joining' voice channel...")
			let member = await guild.members.fetch(s_new.id)
			// print("Got Member...\nAdding Voice Chat role...")
			try {
				await member.roles.add(db.data.vc_roles[gid])
			} catch (err) {
				print(err)
			}
		}
	}
})