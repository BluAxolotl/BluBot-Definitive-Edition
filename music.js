var { BotCommand } = require('./bot_commands.js')
const {print, print_warn, print_error, print_debug, ConsoleCommand } = require('console-to-server')
const { SoundcloudSong, BotbSong, TwitterSong, YouTubeSong, OmniUtils } = require('omni-parser')
const emotes = {
	soundcloud: "<:bbsoundcloud:888916985793089587>",
	battleofthebits: "<:bbbattleofthebits:888916552760569857>",
	youtube: "<:bbyoutube:888916552794144859>",
	twitter: "<:bbtwitter:888916553188405288>",
	audio_file: "🔊"
}

const EMBED_COLOR = "024aca"
const ERR_EMBED_COLOR = "E03C28"
const NO_QUEUE_MSG = {embed: {description: 'There is no queue :/ *(Add something with ``.bb play <link>``)*',color:EMBED_COLOR}}
const INVALID_LINK = {embed:{title:"**Cannot play song:**",description:"This is possibly due to **an error** or **an invalid link**",footer:{text:"Possibly submit this with the command you inputed to #bot-errors on the Blu Heck Hole server"},color:ERR_EMBED_COLOR}}

var Queues = new Map()
var Connections = new Map()
var Timeouts = {}
var Statuses = {}

new ConsoleCommand("list_connections", "Lists all voice chat connection objects", ["none"], function() {
	let print_string = []
	Connections.forEach((v, k, m) => { print_string.push(`${k} => ${v.channel.name}`) })
	print(print_string.join("\n\n"))
})

new BotCommand(["play", "p"], "Plays Soundcloud, BattleOfTheBits, & Youtube music in voice chat", ["song_link"], null, async function (msg, args) {
	let song = new OmniUtils.link_parse(args[0])
	if (song.constructor.name == "ParseError") {
		msg.channel.send(INVALID_LINK)
	}
	if (Queues.has(msg.guild.id)) {
		let queue = Queues.get(msg.guild.id)
		function handling() {
			queue.push(song)
			msg.channel.send("", {
				embed: {
					color: EMBED_COLOR,
					description: `Added \`\`${song.fancy_title}\`\` at ${queue.length-1}`
				}
			})
		}
		if (song.constructed) {
			handling()
		} else {
			song.event.on('constructed', function() {
				handling()
			})
		}
		Queues.set(msg.guild.id, queue)
	} else {
		play(song, msg)
	}
})

new BotCommand(["queue", "list", "q", "ls"], "Shows the current queue of music", ["song_link"], null, async function (msg, args) {
	if (Queues.has(msg.guild.id)) {
		let queue = Queues.get(msg.guild.id)
		let titles = queue.map(stringify_queue)
		let iter_number = 0
		let playing_song
		// queue.forEach(i => {
		// 	if (iter_number == 0) {
		// 		playing_song = `**NOW PLAYING**: \`\`${i.fancy_title}\`\` ${emotes[i.type]}\n`
		// 	} else {
		// 		titles.push(`**${iter_number}.** \`\`${i.fancy_title}\`\` ${emotes[i.type]}`)
		// 	}
		// 	iter_number++
		// })
		msg.channel.send("", {
			embed: {
				title: "Queue:",
				description: `${titles.join("\n")}`,
				color: EMBED_COLOR
			}
		})
	} else {
		msg.channel.send("",NO_QUEUE_MSG)
	}
})

new BotCommand(["nowplaying", "playing", "np"], "Shows the currently playing song", ["none"], null, async function (msg, args) {
	if (Queues.has(msg.guild.id)) {
		let queue = Queues.get(msg.guild.id)
		let song = queue[0]
		send_np(msg, song)
	} else {
		msg.channel.send(NO_QUEUE_MSG)
	}
})

new BotCommand(["skip", "s", "fs"], "Skips the current playing song to play the next in queue", ["song_link"], null, async function (msg, args) {
	let guildid = msg.guild.id
	if (Queues.has(msg.guild.id)) {
		let queue = Queues.get(msg.guild.id)
		if (queue.length == 1) {
			msg.channel.send({embed:{description:`Can't skip this song since it's the only song in queue`}})
		} else {
			let old_song = queue.shift()
			clearTimeout(Timeouts[guildid])
			play(queue[0], msg)
			msg.channel.send({embed:{description:`Skipped \`\`${old_song.fancy_title}\`\``}})
		}
	} else {
		msg.channel.send("",NO_QUEUE_MSG)
	}
})

new BotCommand(["leave", "stop", "fuckoff"], "Plays Soundcloud, shut the fuck up", ["song_link"], null, async function (msg, args) {
	let guildid = msg.guild.id
	if (Connections.has(guildid)) {
		let c = Connections.get(guildid)
		c.disconnect()
	}
})

new BotCommand(["playnow", "pn"], "Plays Soundcloud, shut the fuck up", ["song_link"], null, async function (msg, args) {
	let guildid = msg.guild.id
	if (Statuses[guildid] != -1) {
		clearTimeout(Timeouts[guildid])
	}
	play(OmniUtils.link_parse(args[0]), msg)
})

new BotCommand(["move", "m"], "Plays Soundcloud, shut the fuck up", ["song_link"], null, async function (msg, args) {
	let guildid = msg.guild.id
	if (Queues.has(guildid)) {
		let queue = Queues.get(guildid)
		let old_pos = Math.floor(Number(args[0]))
		let new_pos = Math.floor(Number(args[1]))
		if (old_pos > 0 && new_pos > 0) {
			let old_song = queue[old_pos]
			let new_queue = array_move(queue, old_pos, new_pos)
			let titles = new_queue.map(stringify_queue)
			msg.channel.send(`**Moved \`\`${queue[old_pos].fancy_title}\`\` to ${new_pos}**\n${titles.join("\n")}`)
			Queues.set(guildid, new_queue)
		} else {
			msg.chanel.send(`0 is not a valid queue position! *(queue starts at 1)*`)
		}
	} else {
		msg.channel.send(NO_QUEUE_MSG)
	}
})

/// ⬇⬇⬇ FUNCTIONS ⬇⬇⬇ ///

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

function stringify_queue(i,o) { if (o != 0) { return `**${o}.** [\`\`${i.fancy_title}\`\`](${i.url})` } else { return `**NOW PLAYING:** [\`\`${i.fancy_title}\`\`](${i.url})\n` }}

function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
}

function send_np(msg, song){
	msg.channel.send("", {
		embed: {
			description: `**Now Playing:**\n ${emotes[song.type]} [\`\`${song.fancy_title}\`\`](${song.url}) ${emotes[song.type]}`,
			color: EMBED_COLOR,
			footer: {
				text: `Powered by OmniParser`,
				iconURL: 'https://i.imgur.com/pwUN0hS.png'
			}
		}
	})
}

function check_queue(msg) {
	print("checkings...")
	let guildid = msg.guild.id
	if (Queues.has(guildid)) {
		let queue = []
		if (Queues.has(guildid)) { queue = Queues.get(msg.guild.id) }
		if (queue.length > 1) {
			let old_song = queue.shift()
			play(queue[0], msg)
		} else {
			Statuses[guildid] = -1
			Queues.delete(guildid)
		}
	} else {return}
}

async function play(song, msg) {
	async function continued() {
		let guildid = msg.guild.id
		let queue = []
		if (Queues.has(guildid)) { queue = Queues.get(msg.guild.id) }
		let i = msg.member.voice.channel
		let c = await i.join()
		Connections.set(guildid, c)
		let d
		queue[0] = song
		Queues.set(guildid, queue)
		song.getSource().then(stream => {
			d = c.play(stream)
			Statuses[guildid] = 1
			send_np(msg, song)
			print(song.length)
			Timeouts[guildid] = setTimeout(check_queue.bind(null, msg), song.length+1500)
		})
	}

	if (song.constructor.name == "ParseError") {
		msg.channel.send("", INVALID_LINK)
	} else if (song.constructed) {
		continued()
	} else {
		song.event.on('constructed', continued)
	}
}
