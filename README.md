# practice-websocket
A NodeJS real-time websocket application for chat, drawing and getting Twitter feeds. <br />
This project is purely developed for academic/training purpose.

## Technical Overview

In this NodeJS websocket project, you have the option to either use `socket-io` which is supported through `websocket_server_socketio.js` 
or the custom class I created `websocket_server.js` that initiates the protocol upgrade, handshake as well as encodes/decodes the data packets/payload.

Since this project uses a Twitter stream functionality, it uses these npm libraries. <br />
You can refer to the API documentation found here for more information. <br />
https://www.npmjs.com/package/twit <br />
https://www.npmjs.com/package/ntwitter <br />

## Installation

1. **Install the package**  
```
npm install
```

2. **Twitter stream support**  
You also need to create a Twitter application for oauth credentials.<br />
http://docs.inboundnow.com/guide/create-twitter-application/

## Usage
Once you have the NodeJS server up and running, simply open `collab.html` through a web browser and you're good to go.

## License
This is an open source project under the MIT license.  For more information, please refer to [license.txt](license.txt)
