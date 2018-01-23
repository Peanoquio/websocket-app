////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the websocket connection object class
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 14 2014
/**
 * The constructor for the custom socket object
 * @param string sId : the id to uniquely identify the socket
 * @oaram Socket cSocket : the actual socket object
 */
var SocketObj = function( sId, cSocket )
{
	this.m_sId = sId;
	this.m_cSocket = cSocket;
};


//the type of socket object
SocketObj.TYPE = {
	CONNECT: 1,
	MESSAGE: 2
};

//the communication subprotocol of the socket
SocketObj.PROTOCOL = {
	JSON: 'json',
	BINARY: 'binary',
	SOAP: 'soap',
	CUSTOM: 'custom'
};


//the socket namespace (currently used for Socket IO)
SocketObj.CHANNEL = {
	CHAT: '/chat',
	DRAW: '/draw',
	GAME: '/game',
	TWIT: '/twit'
};

//default socket room name
SocketObj.DEFAULT_ROOM = 'lobby';

//server connection
SocketObj.CONNECTION = {
	//HOST: '192.168.1.2',
	HOST: '192.168.1.143',
	//PORT: '80'
	//HOST: '127.0.0.1',
	//HOST: '10.25.11.26',
	//HOST: '10.25.10.34',
	PORT: '8080'
};


////////////////////////////////////////////////////////////////////////////////////////


if ( typeof( module ) !== 'undefined' )
{
	//export (or "expose") the internally scoped functions
	module.exports = SocketObj;
}