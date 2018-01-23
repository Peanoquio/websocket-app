////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the websocket manager common class that can be shared by both server and client
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


if ( typeof( require ) !== 'undefined' )
{
    var Packet = require( '../common/websocket_packet' );
    var SocketObj = require( '../common/websocket_conn_obj' );
}


////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 9, 2014
/**
 * The constructor for the WebSocketMgrCommon class
 *
 * @class WebSocketMgrCommon
 * @constructor WebSocketMgrCommon
 */
var WebSocketMgrCommon = function()
{
};


//added by Oliver Chong - October 9, 2014
//reference: http://stackoverflow.com/questions/3710204/how-to-check-if-a-string-is-a-valid-json-string-in-javascript-without-using-try
/**
 * Checks if the message is in the valid JSON format
 *
 * @method CheckIfValidJson
 * @param {string} sMsg : the message string
 * @return {boolean} : if true, the message is a JSON string
 */
WebSocketMgrCommon.CheckIfValidJson = function( sMsg )
{
    //check if it is a valid JSON string    
    if ( /^[\],:{}\s]*$/.test( sMsg.replace(/\\["\\\/bfnrtu]/g, '@').
        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
        replace(/(?:^|:|,)(?:\s*\[)+/g, '') ) && isNaN( sMsg) ) 
    {
        return true;
    }
    else
    {
        return false;
    }
};


//added by Oliver Chong - October 15, 2014
/**
 * Formats the message
 *
 * @method FormatMsg
 * @param {string} sSenderId : the id of the client that sends the message
 * @param {unsigned} nMsgType : the message type
 * @param {string} sMsg : the message to be sent
 * @return {array} : the JSON formatted message
 */
WebSocketMgrCommon.FormatMsg = function( sSenderId, nMsgType, sMsg )
{
    var aFormattedMsg = {
        'clientId': sSenderId,
        'messageType' : nMsgType,
        'message': sMsg,
        'timeStamp': new Date().getTime()
    };

    return aFormattedMsg;
};


//added by Oliver Chong - October 16, 2014
/**
 * Crates the ping/pong message in JSON format
 *
 * @method CreatePingPongMsg
 * @param {string} sSenderId : the id of the client sending the message
 * @param {boolean} bIsPing : if true, check if it is a ping request else check if it is a pong request
 * @return array : the ping/pong request in JSON format
 */
WebSocketMgrCommon.CreatePingPongMsg = function( sSenderId, bIsPing )
{
    var nOpcode = bIsPing ? Packet.OP_CODE_ARR['PING'] : Packet.OP_CODE_ARR['PONG'];

    var aPingPongMsg = {
      'opcode': nOpcode, //ping/pong opcode
      'clientId': sSenderId,
      'timeStamp': new Date().getTime()
    };

    return aPingPongMsg;
};


//added by Oliver Chong - October, 16, 2014
/**
 * Check if the message is a ping/pong request
 *
 * @method IsPingPongMsg
 * @param {array} aMsg : the message in JSON format
 * @param {boolean} bIsPing : if true, check if it is a ping request else check if it is a pong request
 * @return {boolean} : if true, the message is either a ping/pong request
 */
WebSocketMgrCommon.IsPingPongMsg = function( aMsg, bIsPing )
{
    var nOpcode = bIsPing ? Packet.OP_CODE_ARR['PING'] : Packet.OP_CODE_ARR['PONG'];

    //check if it contains the opcode and time stamp
    if ( typeof( aMsg['opcode'] ) !== 'undefined' && typeof( aMsg['timeStamp'] ) !== 'undefined' )
    {
        //check the opcode if it is either a ping or a pong packet
        if ( ( aMsg['opcode'] & nOpcode ) == nOpcode )
        {
            return true;            
        }
        else
        {
            return false;
        }
    }
    else
    {
        return false;
    } 
};


//added by Oliver Chong - October, 15, 2014
/**
 * Crates the connection message in JSON format
 *
 * @method CreateConnectionMsg
 * @param {string} sSenderId : the id of the client sending the message
 * @return {array} : the connection request in JSON format
 */
WebSocketMgrCommon.CreateConnectionMsg = function( sSenderId )
{
    var aConnMsg = {
        'type': SocketObj.TYPE['CONNECT'],
        'clientId': sSenderId
    };

    return aConnMsg;
};


//added by Oliver Chong - October, 15, 2014
/**
 * Check if the message is a connection request
 *
 * @method IsConnectionMsg
 * @param {array} aMsg : the message in JSON format
 * @return {boolean} : if true, the message is a connection request
 */
WebSocketMgrCommon.IsConnectionMsg = function( aMsg )
{
    //check if it contains the opcode and time stamp
    if ( typeof( aMsg['type'] ) !== 'undefined' && typeof( aMsg['clientId'] ) !== 'undefined' )
    {
        //check if it is a connection custom message
        if ( aMsg['type'] == SocketObj.TYPE['CONNECT'] )
        {
            return true;     
        }
        else
        {
            return false;
        }
    }
    else
    {
        return false;
    }  
};


////////////////////////////////////////////////////////////////////////////////////////


if ( typeof( module ) !== 'undefined' )
{
	//export (or "expose") the internally scoped functions
	module.exports = WebSocketMgrCommon;
}