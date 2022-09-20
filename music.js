var { BotCommand } = require('./bot_commands.js')
var music_commands = {}
class MusicCommand extends BotCommand {
	constructor(title, desc, args, image, func) {
		super(title, desc, args, image, func)
		if (Array.isArray(title)) {
			title.forEach(i => {
				music_commands[i] = this
			})
		} else {
			music_commands[this.title] = this
		}
		this.type = 'music'
	}
}
var moment = require('moment')
const googleTTS = require("google-tts-api");
const Discord = require('discord.js')
const print = console.log
const { SoundcloudSong, BotbSong, TwitterSong, YouTubeSong, OmniUtils } = require('omni-parser')
//  
const emotes = {
	soundcloud: "<:bbsoundcloud:977630605690941490>",
	battleofthebits: "<:bbbattleofthebits:977630606282350612>",
	youtube: "<:bbyoutube:977630605896458350>",
	twitter: "<:bbtwitter:977630605862920192>",
	bandcamp: "<:bbbandcamp:977630605649010770>",
	audio_file: "🔊"
}
const { VoiceConnection, joinVoiceChannel, createAudioPlayer, createAudioResource, demuxProbe, StreamType } = require('@discordjs/voice')

async function probeAndCreateResource(readableStream) {
	const { stream, type } = await demuxProbe(readableStream)
	let rec =  createAudioResource(readableStream, { inputType: type, inlineVolume: true });
	rec.volume.setVolume(0.5)
	return rec
}

Discord.VoiceChannel.prototype.join = function () {
	var c = joinVoiceChannel({
		channelId: this.id,
		guildId: this.guild.id,
		adapterCreator: this.guild.voiceAdapterCreator,
	})
	var player = createAudioPlayer()
	c.subscribe(player)
	c.bb_player = player
	return c
}

VoiceConnection.prototype.play = async function (res) {
	if (this.bb_player == null) { print("player not found!!"); return }
	this.bb_player.play(await probeAndCreateResource(res))
}

const EMBED_COLOR = "024aca"
const ERR_EMBED_COLOR = "E03C28"
const NO_QUEUE_MSG = {embeds:[{description: 'There is no queue :/ *(Add something with ``.bb play <link>``)*',color:EMBED_COLOR}]}
const INVALID_LINK = {embeds:[{title:"**Cannot play song:**",description:"This is possibly due to **an error** or **an invalid link**",footer:{text:"Possibly submit this with the command you inputed to #bot-errors on the Blu Heck Hole server"},color:ERR_EMBED_COLOR}]}

var Queues = new Map()
var Connections = new Map()
var Timeouts = new Map()
var Times = new Map()
var Statuses = new Map()
var Options = new Map()

new MusicCommand(["play", "p"], "Plays Soundcloud, Twitter, BattleOfTheBits, & Youtube music in voice chat", ["song_link"], null, async function (msg, args, client) {
	var attachment_count = 0
	var song
	msg.attachments.each(i => attachment_count++)
	if (attachment_count  > 0) {
		var link = msg.attachments.first().url
		song = new OmniUtils.link_parse(link)
	} else {
		song = new OmniUtils.link_parse(args[0])
	}
	if (song.constructor.name == "ParseError") {
		msg.channel.send(INVALID_LINK)
	} else {
		if (song.util) {
			play(song, msg)
		} else {
			if (Queues.has(msg.guild.id)) {
				queue_func(song, msg, true)
			} else {
				play(song, msg)
			}
		}
	}
})

new MusicCommand(["queue", "list", "q", "ls"], "Shows the current queue of music", ["none"], null, async function (msg, args, client) {
	if (Queues.has(msg.guild.id)) {
		var queue = Queues.get(msg.guild.id)
		let page_number = 1
		let page_total = Math.floor(queue.length/10)+1
		if (args.length != 0) {
			page_number = Math.round(Number(args[0]))
		}
		if (page_number > page_total) {
			page_number = page_total
		}
		if (page_number < 1) {
			page_number = 1
		}
		var titles = stringify_queue(queue, page_number)

		var buttons = [
			new Discord.MessageButton({
				label: "Prev",
				customId: "queue prev",
				style: 1
			}),
			new Discord.MessageButton({
				label: "Next",
				customId: "queue next",
				style: 1
			})
		]
		buttons[0].setEmoji("⏮")
		buttons[1].setEmoji("⏭")
		var row = new Discord.MessageActionRow({components: buttons}, client)

		new_channel = await client.channels.fetch(msg.channel.id)

		new_channel.send({
			embeds: [{
				title: `Queue Page #${page_number} of ${page_total} (${(page_number*10 < queue.length ? page_number*10 : queue.length)}/${queue.length})`,
				description: `${titles.join("\n")}`,
				color: EMBED_COLOR
			}],
			components: [row]
		})
	} else {
		msg.channel.send(NO_QUEUE_MSG)
	}
})

new MusicCommand(["player"], "An interactable view of the song queue", ["none"], null, async function (msg, args, client) {
	if (Queues.has(msg.guild.id)) {
		var queue = Queues.get(msg.guild.id)
		let page_number = 1
		let page_total = Math.floor(queue.length/10)+1
		if (args.length != 0) {
			page_number = Math.round(Number(args[0]))
		}
		if (page_number > page_total) {
			page_number = page_total
		}
		if (page_number < 1) {
			page_number = 1
		}
		var titles = queue.map((i, n, a) => {
			return {
				label: i.fancy_title,
				value: String(n),
				description: "A song",
				emoji: emotes[i.type],
				default: (n == 1)
			}
		})

		var buttons = [
			new Discord.MessageButton({
				label: "Back",
				customId: "player back",
				style: 1
			}),
			new Discord.MessageButton({
				label: "Pause",
				customId: "player pause",
				style: 1
			}),
			new Discord.MessageButton({
				label: "Skip",
				customId: "player skip",
				style: 1
			})
		]
		buttons[0].setEmoji("⏮")
		buttons[1].setEmoji("⏸")
		buttons[2].setEmoji("⏭")
		var row1 = new Discord.MessageActionRow({components: buttons}, client)

		print(titles)

		var QueueList = new Discord.MessageSelectMenu({
			customId: "player list",
			options: titles,
			maxValues: 1, 
			minValues: 1,
			placeholder: "Select a song to play"
		})
		var row2 = new Discord.MessageActionRow({components: [QueueList]}, client)

		new_channel = await client.channels.fetch(msg.channel.id)

		new_channel.send({
			components: [row1, row2]
		})
	} else {
		msg.channel.send(NO_QUEUE_MSG)
	}
})

new MusicCommand(["nowplaying", "playing", "np"], "Shows the currently playing song", ["none"], null, async function (msg, args, client) {
	if (Queues.has(msg.guild.id)) {
		var queue = Queues.get(msg.guild.id)
		var song = queue[0]
		send_np(msg, song, -1)
	} else {
		msg.channel.send(NO_QUEUE_MSG)
	}
})

new MusicCommand(["skip", "s", "fs"], "Skips the current playing song to play the next in queue", ["none"], null, async function (msg, args, client) {
	var guildid = msg.guild.id
	if (Queues.has(msg.guild.id)) {
		var queue = Queues.get(msg.guild.id)
		if (queue.length == 1) {
			msg.channel.send({embeds:[{description:`Can't skip this song since it's the only song in queue`,color:ERR_EMBED_COLOR}]})
		} else {
			var old_song = queue.shift()
			if (Options.has(guildid)) {
				var options = Options.get(guildid)
				if (options["queueloop"] != null && options["queueloop"] == true) {
					queue.push(old_song)
				}
			}
			clearTimeout(Timeouts.get(guildid))
			play(queue[0], msg)
			msg.channel.send({embeds:[{description:`Skipped \`\`${old_song.fancy_title}\`\``,color:EMBED_COLOR}]})
		}
	} else {
		msg.channel.send(NO_QUEUE_MSG)
	}
})

new MusicCommand(["leave", "stop", "fuckoff"], "Leaves the voice channel and clears queue", ["none"], null, async function (msg, args, client) {
	var guildid = msg.guild.id
	if (Connections.has(guildid)) {
		var c = Connections.get(guildid)
		c.destroy()
		reset_nick(msg.guild, client)
		clearTimeout(Timeouts.get(guildid))
		Timeouts.delete(guildid)
		Statuses.delete(guildid)
		Queues.delete(guildid)
	} else if (msg.member.voice) {
		print("tryings")
		try { msg.member.voice.channel.disconnect() } catch (err) { return }
	}
})

new MusicCommand(["playnow", "pn"], "Plays a Song immediately, stopping the current playing song", ["song_link"], null, async function (msg, args, client) {
	var guildid = msg.guild.id
	if (Statuses[guildid] != -1) {
		clearTimeout(Timeouts.get(guildid))
	}
	var attachment_count = 0
	var song
	msg.attachments.each(i => attachment_count++)
	if (attachment_count  > 0) {
		var link = msg.attachments.first().url
		song = new OmniUtils.link_parse(link)
	} else {
		song = new OmniUtils.link_parse(args[0])
	}
	play(song, msg)
})

new MusicCommand(["playtop", "pt"], "Queues a song to the top of queue to play after the currently playing song", ["song_link"], null, async function (msg, args, client) {
	var attachment_count = 0
	var song
	msg.attachments.each(i => attachment_count++)
	if (attachment_count  > 0) {
		var link = msg.attachments.first().url
		song = new OmniUtils.link_parse(link)
	} else {
		song = new OmniUtils.link_parse(args[0])
	}
	if (song.constructor.name == "ParseError") {
		msg.channel.send(INVALID_LINK)
	} else {
		if (song.util) {
			play(song, msg, "playtop")
		} else {
			if (Queues.has(msg.guild.id)) {
				queue_func(song, msg, true, 1)
			} else {
				play(song, msg)
			}
		}
	}
})

new MusicCommand(["move", "m"], "Moves a song to a new spot in the queue", ["song_pos, new_pos"], null, async function (msg, args, client) {
	var guildid = msg.guild.id
	if (Queues.has(guildid)) {
		var queue = Queues.get(guildid)
		var old_pos = Math.floor(Number(args[0]))
		var new_pos = Math.floor(Number(args[1]))
		if (old_pos > 0 && new_pos > 0) {
			var old_song = queue[old_pos]
			queue.move(old_pos, new_pos)
			var titles = stringify_queue(queue, Math.floor(new_pos/10)+1)
			msg.channel.send({embeds:
				[{
					description:titles.join("\n"),
					title:`**Moved \`\`${queue[new_pos].fancy_title}\`\` ➡ ${new_pos}**`,
					color:EMBED_COLOR
				}]
			})
			Queues.set(guildid, queue)
		} else {
			msg.channel.send(`0 is not a valid queue position! *(queue starts at 1)*`)
		}
	} else {
		msg.channel.send(NO_QUEUE_MSG)
	}
})

new MusicCommand(["shuffle", "shuf"], "Shuffles the queue", ["none"], null, async function (msg, args, client) {
	var guildid = msg.guild.id
	if (Queues.has(guildid)) {
		var queue = Queues.get(guildid)
		var not_queue = queue.sort((a, b) => queue.indexOf(a) - queue.indexOf(b))
		var n_p = not_queue.shift()
		not_queue.shuffle()
		not_queue.unshift(n_p)
		msg.channel.send({embeds:
			[{
				description:"🔀 Queue has been shuffled! 🔀",
				color:EMBED_COLOR
			}]
		})
		Queues.set(guildid, not_queue)
	} else {
		msg.channel.send(NO_QUEUE_MSG)
	}
})

new MusicCommand(["queueloop", "ql"], "Loops the entire queue", ["none"], null, async function (msg, args, client) {
	var guildid = msg.guild.id
	if (Queues.has(guildid)) {
		var queue = Queues.get(guildid)
		if (queue.length == 1) {
			msg.channel.send({embeds:
				[{
					description:"❌ Queue size is too small, use ``.bb loop`` instead! ❌",
					color:ERR_EMBED_COLOR
				}]
			})
		} else {
			var options
			if (Options.has(guildid)) {
				options = Options.get(guildid)
				if (options["queueloop"] = true != null) {
					options["queueloop"] = !options["queueloop"]
				} else {
					options["queueloop"] = true
				}
			} else {
				options = {}
				options["queueloop"] = true
			}
			if (options["queueloop"]) {
				msg.channel.send({embeds:
					[{
						description:"🔁 Queue Loop: ``enabled`` 🔁",
						color:EMBED_COLOR
					}]
				})
			} else {
				msg.channel.send({embeds:
					[{
						description:"🔁 Queue Loop: ``disabled`` 🔁",
						color:EMBED_COLOR
					}]
				})
			}
			Options.set(guildid, options)
		}
	} else {
		msg.channel.send(NO_QUEUE_MSG)
	}
})

new MusicCommand(["remove", "r"], "Removes a song from the queue", ["song_index"], null, async function (msg, args, client) {
	var guildid = msg.guild.id
	if (Queues.has(guildid)) {
		var queue = Queues.get(guildid)
		if (args.length != 0) {
			song_number = Math.round(Number(args[0]))
			if (song_number > queue.length) {
				song_number = queue.length
			}
			if (song_number < 1) {
				song_number = 1
			}
			var removed_song = queue.remove(song_number)
			if (Array.isArray(removed_song)) { removed_song = removed_song[0] }
			msg.channel.send({embeds:
				[{
					description:`❌ \`\`${removed_song.fancy_title}\`\` has been removed! ❌`,
					color:EMBED_COLOR
				}]
			})
			Queues.set(guildid, queue)
		} else {
			msg.channel.send({embeds:
				[{
					description:"Specify the index of the song you wish to remove!",
					color:ERR_EMBED_COLOR
				}]
			})
		}
	} else {
		msg.channel.send(NO_QUEUE_MSG)
	}
})

new MusicCommand(["clear", "clr"], "Clears queue, but keep current playing song", ["none"], null, async function (msg, args, client) {
	var guildid = msg.guild.id
	if (Queues.has(guildid)) {
		var queue = Queues.get(guildid)
		queue = [ queue[0] ]
		Queues.set(guildid, queue)
		msg.channel.send({embeds:
			[{
				description:`❌ Cleared Queue! ❌`,
				color:EMBED_COLOR
			}]
		})
	} else {
		msg.channel.send(NO_QUEUE_MSG)
	}
})

new MusicCommand("say", "Says text in voice chat", ["text..."], null, async function (msg, args, client) {
	if (Queues.has(msg.guild.id)) {
		msg.channel.send({embeds:
			[{
				description:`Can't do that while there's a queue!`,
				color:EMBED_COLOR
			}]
		})
	} else {
		const url = googleTTS.getAudioUrl(args.join(" "), {
			lang: "en",
			slow: false,
			host: "https://translate.google.com",
		})
		var i
		if (msg.member.voice) { i = msg.member.voice.channel } else {
			msg.channel.send({embeds:[{color:ERR_EMBED_COLOR, description:"❌ You have to be in a voice channel"}]})
			return
		}
		var c = i.join()
		c.play(url)
	}
})

/// ⬇⬇⬇ FUNCTIONS ⬇⬇⬇ ///

function print_err(msg, err) {
	msg.channel.send({
		embeds: [{
			title: `There's an error 🥴:`,
			description: `\`\`\`js\n${String(err)}\`\`\``,
			footer: {
				text: "Submit this to Blu in the ``#bot-errors`` channel on the Blu Heck Hole server"
			},
			color: ERR_EMBED_COLOR
		}]
	})
}

function stringify_queue(_q, _p) {
	var o_q = _q
	const queue_size = 10
	if (_q.length > queue_size) {
		var n_p = _q[0]
		_q = _q.slice((queue_size*(_p-1))+1, (queue_size*(_p-1))+(queue_size+1))
		_q.unshift(n_p)
	}
	return _q.map((i, o) => {
		if (o != 0) {
			return `**${o_q.indexOf(i)}.** [\`\`${i.fancy_title}\`\`](${i.url})`
		} else {
			return `**NOW PLAYING:** [\`\`${i.fancy_title}\`\`](${i.url})\n` 
		}
	})
}

Array.prototype.shuffle = function () {
  let currentIndex = this.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [this[currentIndex], this[randomIndex]] = [
      this[randomIndex], this[currentIndex]];
  }
}

Array.prototype.insert = function (index, value) {
	this.splice(index, 0, value)
}

Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length + 1;
        while (k--) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
}

Array.prototype.remove = function (index) {
    if (index > -1 && index < this.length-1) {
    	var return_value = this.splice(index, 1)
    	return return_value
    }
}

function send_np(msg, song, mode = 0) {
	msg.channel.guild.members.fetch(msg.client.user.id).then(ClientMember => {
		let temp_title = song.fancy_title
		if (song.fancy_title.length > 20) {temp_title = (song.fancy_title.slice(0, 20)+"...")}
		ClientMember.setNickname(`BluBot ▶ ${temp_title}`)
	})
	let modifier = ""
	if (mode == -1) {
		let startTime = Times.get(msg.guild.id)
		let a = moment(( (new Date()).getTime() - startTime ))
		let b = moment(song.length)
		modifier = `\n${a.format('m:ss')} / ${b.format('m:ss')}`
	}
	msg.channel.send({
		embeds: [{
			description: `**Now Playing:**\n ${emotes[song.type]} [\`\`${song.fancy_title}\`\`](${song.url}) ${emotes[song.type]}${modifier}`,
			color: EMBED_COLOR,
			footer: {
				text: `Powered by OmniParser`,
				iconURL: 'https://i.imgur.com/pwUN0hS.png'
			}
		}]
	})
}

function reset_nick(guild, client) {
	guild.members.fetch(client.user.id).then(ClientMember => {
		ClientMember.setNickname(`BluBot`)
	})
}

function check_queue(msg) {
	print("checkings...")
	var guildid = msg.guild.id
	if (Queues.has(guildid)) {
		var queue = []
		if (Queues.has(guildid)) { queue = Queues.get(msg.guild.id) }
		if (queue.length > 1) {
			var old_song = queue.shift()
			play(queue[0], msg)
			if (Options.has(guildid)) {
				var options = Options.get(guildid)
				if (options["queueloop"] != null && options["queueloop"] == true) {
					queue.push(old_song)
				}
			}
		} else {
			Statuses[guildid] = -1
			function leave_now() {
				play(OmniUtils.link_parse('https://cdn.discordapp.com/attachments/926478435180765214/946652882533507083/oops.mp4'), msg, true).then(i => {
					print("leaving....")
					setTimeout(connection_timeout.bind(null, guildid, msg), 2615)
					clearTimeout(Timeouts.get(guildid))
					Timeouts.delete(guildid)
					Statuses.delete(guildid)
					Queues.delete(guildid)
				})
			}
			setTimeout(leave_now, 10000)
		}
	} else {return}
}

function connection_timeout(guildid, msg) {
	var status = Statuses[guildid]
	var connection = Connections.get(guildid)
	if (status == -1) {
		connection.destroy()
		reset_nick(msg.guild, msg.client)
		msg.channel.send({embeds: [{
			description: "👋 Left voice chat due to innactivity 🚶‍♀️",
			color: EMBED_COLOR
		}]})
	}
}

function queue_func(song, msg, send, pos = null) {
	var queue = Queues.get(msg.guild.id)
	const last_pos = queue.length
	if (pos == null) { pos = last_pos }
	function handling() {
		queue.insert(pos, song)
		if (send) {
			msg.channel.send({
				embeds: [{
					color: EMBED_COLOR,
					description: `Added \`\`${song.fancy_title}\`\` at ${pos}`
				}]
			})
		}
		Queues.set(msg.guild.id, queue)
	}
	if (song.constructed) {
		handling()
	} else {
		song.event.on('constructed', function() {
			handling()
		})
	}
}

async function play(...args) {
	return new Promise((res, rej) => {
		var song = args[0]
		var msg = args[1]
		var songs = null
		var guildid = msg.guild.id
		async function continued() {
			var queue = []
			if (Queues.has(guildid)) { queue = Queues.get(msg.guild.id) }
			var i
			if (msg.member.voice) { i = msg.member.voice.channel } else {
				msg.channel.send({embeds:[{color:ERR_EMBED_COLOR, description:"❌ You have to be in a voice channel"}]})
				return
			}
			if (i == null) { return }	
			var c = i.join()
			Connections.set(guildid, c)
			if (args[2] == null) {
				queue[0] = song
				Queues.set(guildid, queue)
			}
			song.getSource().then(stream => {
				c.play(stream)
				if (args[2] == null) {
					Statuses.set(guildid, 1)
					Times.set(guildid, (new Date()).getTime())
					send_np(msg, song)
					clearTimeout(Timeouts.get(guildid))
					Timeouts.set(guildid, setTimeout(check_queue.bind(null, msg), song.length+1500))
				}
				res("ok now!")
			})

			// if (songs != null) {
			// 	songs.forEach(i => {
			// 		queue_func(i, msg, false)
			// 	})
			// }
		}

		function invaliedate() {
			msg.channel.send({
				embeds: [{
					color: ERR_EMBED_COLOR,
					description: `Song link has been invaliedated`,
					footer: {
						text: `This is likely caused by an error`
					}
				}]
			})
		}

		song.event.on('invalidated', invaliedate)

		if (song.util) {
			songs = []
			var song_count = 0
			song.event.on('song', (local, song_total, playlist_title) => {
				songs.push(local)
				if (local.invalid) {
					song_total--
				} else {
					song_count++
				}
				print(`${song_count} / ${song_total}`)
				if (song_count == song_total) {
					songs = songs.sort((a, b) => a.index - b.index)
					if (Queues.has(guildid)) {
						songs.forEach((i, n) => {
							queue_func(i.song, msg, false, (args[2] == "playtop" ? n+1 : null))
						})
						msg.channel.send({
							embeds: [{
								color: EMBED_COLOR,
								description: `Added \`\`${playlist_title }\`\` to queue (${songs.length} songs added)`
							}]
						})
					} else {
						play(songs[0].song, msg).then(done => {
							songs.forEach((i, n) => {
								if (n != 0) { queue_func(i.song, msg, false) }
							})
						}).catch(err => {
							print(err)
						})
					}
				}
			})
		} else {
			if (song.constructor.name == "ParseError") {
				msg.channel.send(INVALID_LINK)
			} else if (song.constructed) {
				continued()
			} else {
				song.event.on('constructed', continued)
			}
		}
	})
}

function view_queue(type, msg, interaction, client) {
	if (Queues.has(msg.guild.id)) {
		var queue = Queues.get(msg.guild.id)
		let page_number = Number(msg.embeds[0].title.split(" ")[2].replace("#", ""))
		switch(type) {
			case "next":
				page_number++
			break;
			case "prev":
				page_number--
			break;
		}
		let page_total = Math.floor(queue.length/10)+1
		if (page_number > page_total) {
			page_number = page_total
		}
		if (page_number < 1) {
			page_number = 1
		}
		var titles = stringify_queue(queue, page_number)
		// // queue.forEach(i => {
		// // 	if (iter_number == 0) {
		// // 		playing_song = `**NOW PLAYING**: \`\`${i.fancy_title}\`\` ${emotes[i.type]}\n`
		// // 	} else {
		// // 		titles.push(`**${iter_number}.** \`\`${i.fancy_title}\`\` ${emotes[i.type]}`)
		// // 	}
		// // 	iter_number++
		// // })
		interaction.update({
			embeds: [{
				title: `Queue Page #${page_number} of ${page_total} (${(page_number*10 < queue.length ? page_number*10 : queue.length)}/${queue.length})`,
				description: `${titles.join("\n")}`,
				color: EMBED_COLOR
			}]
		})
	} else {
		interaction.update({
			embeds:[NO_QUEUE_MSG.embed]
		})
	}
}

module.exports = {
	view_queue: view_queue
}