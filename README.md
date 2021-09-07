![ConsoleServer Logo](https://i.imgur.com/V8PrJZC.png)
# ConsoleServer

#### A module that hosts a local server and outputs console to website
#### Useful for people who...
##### • Want to view console output on another devide *(linux machine, mobile phone, etc.)*
##### • Want to share console with other people
##### • Send simple strings to an HTML document
## Usage
```javascript
const {print, print_debug} = require('console-to-server')

print('stuff') // Normal printing

print_debug('stuff') // Grey & italics formatting
```
##### And then hosts a server on from your machine's Ipv4 address *``192.168.1.240:8000/console``*

## Configuration
### console_server_config.json
```json
{
  "host": "192.168.1.240", 
  "port": "8000"
}
```
#### • host: If not defined, is <Ivp4 address> by default
#### • port: If not defined, is '8000' by default
