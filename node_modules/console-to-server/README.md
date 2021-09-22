![ConsoleServer Logo](https://i.imgur.com/V8PrJZC.png)
# ConsoleServer
 A module that hosts a local server and outputs console to website
 Useful for people who...
- Want to view console output on another devide *(linux machine, mobile phone, etc.)*
- Want to share console with other people
- Send simple strings to an HTML document

## Usage
```javascript
const {ConsoleCommand} = require('console-to-server') // Try to declare this before every other module

new ConsoleCommand("name", "this is a description", ["none"], function () {
    print("this is my custom command!")
})
```

## Configuration
Make a json file named 'console_server_config.json' in the root directory and then you can configure how the package works!
Example 'console_server_config.json' file:
```json
{
  "print_link": true,
  "server": {
    "port": "8000"
  },
  "html": {
    "styles": [
      "body { background: #231f23 }",
      ".log_message { color: #FFF; font-family: FreeMono, monospace }"
    ]
  },
  "console": {
    "default_commands": true
  }
}
```

- **require_enable** (bool): If true, then you have to call ``CONSERV=true`` environment variable to enable server features *(value can literally be anything, just call)*
- **print_link** (bool): If true, prints the url of the console server *(if not defined, then it won't print url)*
- **server:**
  - **path** (string): Changes the path of the console ``localhost:8000*/path_here*`` *(if not defined, is '/console' by default)*
  - **host** (string): Changes the host of the server *(If not defined, is internal IP by default)*
  - **port** (string): Changes the port of server *(If not defined, is '8000' by default)*
- **console:**
  - **prefix** (string): Sets the prefix to be entered before every command ``$ ping`` *(If not defined, then there is no prefix)*
  - **default_commands** (bool): If false, disables all default commands ``ping, help, testargs`` *(If not defined, then default_commands are enabled)*
- **html:**
  - **styles** (array[String]): An array of css rules to alter the look of the website hosted on server
    - timestamp (class): This is a class for all timestamps ``opacity: 0.5;``
		- console_line (class): This is a class that every console_line has ``.console_line { color: white }``
		- 
  - **format_ansi** (bool): Converts ANSI formatting to HTML for chalk users *(If not defined, is false)*
  - **show_timestamps** (bool): Toggles timestamp on console lines *(If not defined, then false)*

## Screenshots
Working on a mobile browser!

![ConsoleServer in a console](https://i.imgur.com/ANcYKzd.png)
![ConsoleServer on mobile](https://i.imgur.com/vHVp3Ok.png)
