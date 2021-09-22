// Requiring and Declaring ⬇⬇⬇

var chalk = require('chalk');
const internalIp = require('internal-ip')
var Convert = require('ansi-to-html');
const date = require('date-and-time')
var convert = new Convert();
var { exists } = require('fs')
const default_config = {
	require_enable: false,
	print_link: false
}
var inited = false
var config = default_config
try {
	config = require('../../console_server_config.json')
} catch (err) {
	try {
		config = require('./console_server_config.json')
	} catch (err) {
		config = default_config
	}
}
var enabled = false

if (process.env.DEV == null) {
	enabled = process.env.CONSERV
	if (config.require_enable == false) {
		enabled = true
	}
} else {
	enabled = true
}

var show_timestamps = false
if (config.html  != null && config.html.show_timestamps != null) {
	show_timestamps = config.html.show_timestamps
}

var Commands = {
	array: [],
	dict: {}
}

function newline_weird(string) {
	return string.replace(/\r?\n/g, '<br>$&');
}

// Exported functions ⬇⬇⬇

if (console.everything === undefined)
{
    console.everything = [];

    console.defaultLog = console.log.bind(console);
    console.log = function(){
			let real_time = date.format(new Date(), 'hh:mm:ss A')
				let obj = {"type":"log", "datetime":real_time, "value":Array.from(arguments)}
        console.defaultLog.apply(console, arguments);
				let stuff = Array.from(arguments).join(" ")
				if (enabled) {
					if (config.html.format_ansi) {
						let thing = convert.toHtml(newline_weird(stuff))
						obj["html"] = thing
						console_io.emit("print", JSON.stringify(obj))
					} else {
						let thing = newline_weird(stuff)
						obj["html"] = thing
						console_io.emit("print", JSON.stringify(obj))
					}
				}
				console.everything.push(obj);
    }
    console.defaultError = console.error.bind(console);
    console.error = function(){
				let real_time = date.format(new Date(), 'hh:mm:ss A')
				let obj = {"type":"error", "datetime":real_time, "value":Array.from(arguments)}
        console.defaultError.apply(console, arguments);
				let stuff = Array.from(arguments).join(" ")
				// stuff = chalk.hex("#E03C28").bold(newline_weird(stuff))
				if (enabled) {
					let thing = convert.toHtml(newline_weird(stuff))
					obj["html"] = thing
					console_io.emit("print", JSON.stringify(obj))
				}
				console.everything.push(obj)
    }
    console.defaultWarn = console.warn.bind(console);
    console.warn = function(){
				let real_time = date.format(new Date(), 'hh:mm:ss A')
				let obj = {"type":"warn", "datetime":real_time, "value":Array.from(arguments)}
        console.defaultWarn.apply(console, arguments);
				let stuff = Array.from(arguments).join(" ")
				// stuff = chalk.hex("#FFE737")(newline_weird(stuff))
				if (enabled) {
					let thing = convert.toHtml(newline_weird(stuff))
					obj["html"] = thing
					console_io.emit("print", JSON.stringify(obj))
				}
				console.everything.push(obj)
    }
    console.defaultDebug = console.debug.bind(console);
    console.debug = function(){
				let real_time = date.format(new Date(), 'hh:mm:ss A')
				let obj = {"type":"debug", "datetime":real_time, "value":Array.from(arguments)}
        console.defaultDebug.apply(console, arguments);
				let stuff = Array.from(arguments).join(" ")
				// stuff = chalk.hex("#888888").italic(stuff)
				if (enabled) {
					let thing = convert.toHtml(newline_weird(stuff))
					obj["html"] = thing
					console_io.emit("print", JSON.stringify(obj))
				}
				console.everything.push(obj)
    }
}

const print = console.log
const print_warn = console.warn
const print_error = console.error
const print_debug = console.debug

// const print = function (stuff) {
// 	console.log(stuff)
// 	if (enabled) {
// 		if (config.html.format_ansi) {
// 			console_io.emit("print", convert.toHtml(newline_weird(stuff)))
// 		} else {
// 			console_io.emit("print", newline_weird(stuff))
// 		}
// 	}
// }

const print_html = function (stuff) {
	if (enabled) {
		let real_time = date.format(new Date(), 'hh:mm:ss A')
		if (show_timestamps) { stuff = `<span class="timestamp"><em>[${real_time}] </em></span>`+stuff }
		console_io.emit("print", newline_weird(stuff))
	}
}

// const printf = function (stuff) {
// 	console.log(stuff)
// 	if (enabled) {
// 		if (config.html.format_ansi) {
// 			console_io.emit("print", convert.toHtml(newline_weird(stuff)))
// 		} else {
// 			console_io.emit("print", newline_weird(stuff))
// 		}
// 	}
// }

// const print_warn = function(stuff) {
// 	stuff = chalk.hex("#FFE737")(newline_weird(stuff))
// 	console.log(stuff)
// 	if (enabled) {
// 		console_io.emit("print", convert.toHtml(newline_weird(stuff)))
// 	}
// }

// const print_error = function(stuff) {
// 	stuff = chalk.hex("#E03C28").bold(newline_weird(stuff))
// 	console.log(stuff)
// 	if (enabled) {
// 		console_io.emit("print", convert.toHtml(newline_weird(stuff)))
// 	}
// }

// const print_debug = function(stuff) {
// 	stuff = chalk.hex("#888888").italic(stuff)
// 	console.log(stuff)
// 	if (enabled) {
// 		console_io.emit("print", convert.toHtml(newline_weird(stuff)))
// 	}
// }

// Server startup and configuration ⬇⬇⬇

const express = require('express');
const console_app = express();
const { Server } = require("socket.io");
const http = require('http');
const console_server = http.createServer(console_app);
const readline = require('readline')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    historySize: 30,
    prompt: '$ '
})

const console_io = new Server(console_server)

if (enabled == null) {
	enabled = false
}

// Here's the constructor class. Feel free to make a new one that extends this one to fit your needs! ⬇⬇⬇

class ConsoleCommand {
	constructor (name, desc, args, func) {
		this.name = name
		this.desc = desc
		this.args = args
		this.func = func
		Commands.array.push(this)
		Commands.dict[this.name] = this
	}

	exec(args) {
		this.func(args)
	}
}

// Reading Console Input ⬇⬇⬇

if (enabled) {
	rl.on('line', console_input)
}

function console_input(input) {
	let run = false
	let args = input.split(" ")
	if (config.console && config.console.prefix) {
	let prefix = args.shift()
	run = (config.console && prefix == config.console.prefix)
	} else {
	run = true
	}
	let command_name = args.shift()
	if (run) {
		try {
			let command = Commands.dict[command_name]
			if (command) {
				command.exec(args)
			} else {
				print_debug(`Command '${command_name}' does not exist`)
			}
		} catch (err) {
		print_debug(String(err))
		}
	}
} 

// Default Commands ⬇⬇⬇

if (config.console == null || config.console.default_commands == true) {
	new ConsoleCommand("help", "Lists all commands and their functions", ["none"], function() {
		let arr = []
		Commands.array.forEach(i => {
			arr.push(`${i.name}: ${i.desc} (${i.args.join(", ")})`)
		})
		print_debug(arr.join("\n"))
	})

	new ConsoleCommand("ping", "Responds with pong!", ["none"], function() {
		print_debug("pong")
	})

	new ConsoleCommand("testargs", "Test command for arguments", ["arg1", "arg2"], function(args) {
		print_debug(`The arguments were ${args[0]} & ${args[1]}`)
	})

	new ConsoleCommand("crash", "Intentionally crashes nodejs", ["none"], function(args) {
		try {
			nonexistant()
		} catch(err) {
			print_error(err)
		}
	})
}

// Server Redirect and Listen ⬇⬇⬇

var server_path = (config.server && config.server.path ? config.server.path : "/console")

console_app.get(server_path, (req, res) => {
  res.sendFile(__dirname + '/console.html') // Fix icon/logo/favicon thing
})

var server_host = (config.server && config.server.host ? config.server.host : internalIp.v4.sync())
var server_port = (config.server && config.server.port ? config.server.port : 8000)

console_io.on('connection', socket => {
	if (config.html != null && config.html.styles != null) {
		let json = JSON.stringify({
			styles: config.html.styles,
			current_console: console.everything,
			timestamp: show_timestamps,
		})
		socket.emit("html_init", json)

		socket.on('input',console_input)

		socket.on('consolelog', i => {
			console.log(i)
		})
	}
})

if (enabled) {
	console_server.listen({
		host: server_host, // Make this dynamic to get current machine's ipv4 address and also interact with config json
		port: server_port // Make this interact with config json
	}, () => {
		inited = true
		if (config.print_link == true) {
			print(`ConsoleServer @http://${server_host}:${server_port}${server_path}`)
		}

		if (config.html != null && config.html.styles != null) {
			let json = JSON.stringify({
				styles: config.html.styles,
				current_console: console.everything,
				timestamp: show_timestamps,
			})
			console_io.emit("html_init", json)
		}
	})
}

// Module Exports ⬇⬇⬇

module.exports = {
    print: print,
    print_html: print_html,
    print_error: print_error,
    print_warn: print_warn,
    print_debug: print_debug,
    ConsoleCommand: ConsoleCommand
}

// My personal to-do list ⬇⬇⬇

// ## List of stuff to add
// [ ] HTML Send console commands
// [ ] Readable stream process thing
// [ ] Send outputs as POST requests *(or GET, or PUT)*
// [ ] Formatted HTML option
// [ ] 