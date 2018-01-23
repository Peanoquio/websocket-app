////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the websocket manager class
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


var g_cCrypto = require('crypto');
var g_cRsvp = require( 'rsvp' );


//custom files
var Packet = require( '../common/websocket_packet' );
var SocketObj = require( '../common/websocket_conn_obj' );

var WebSocketMgrCommon = require( '../websocket_custom/websocket_manager_common' );


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 1, 2014
/**
 * The constructor for the web socket manager
 *
 * @class WebSocketMgr
 * @constructor WebSocketMgr
 */
var WebSocketMgr = function()
{
};


//the current sub protocol being used
WebSocketMgr.prototype.m_sSubprotocol = null;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//MANAGE WEBSOCKET CONNECTION


//added by Oliver Chong - October 1, 2014
/**
 * Manages the HTTP upgrade request
 *
 * @method ManageUpgrade
 * @param {object} request : the HTTP request
 * @param {object} socket : socket is the network socket between the server and client
 * @param {object} cCallbackCtx : the context in which the callback function will be executed
 * @param {function} fNewConnCallback : the callback function to be invoked when a websocket connection is established (must take 1 parameter: Socket object)
 * @param {function} fCloseConnCallback : the callback function to be invoked when a websocket connection is closed
 * @param {function} fOnDataCallback : the callback function to be invoked when a socket data has been received (must take 1 parameter: Packet object) 
 */
WebSocketMgr.prototype.ManageUpgrade = function( request, socket, cCallbackCtx, fNewConnCallback, fCloseConnCallback, fOnDataCallback )
{
    var sKey = request.headers['sec-websocket-key'];
    //console.log( "client key : " + sKey );

    //choose the subprotocol for the socket communication
    this.ChooseSubprotocol( request );

    //generate the handshake response to be sent to the client
    var sResponse = this.GenerateHandshakeResponse( sKey );
    console.log( sResponse );

    // handshake succeeded, open connection
    if ( socket.write( sResponse, 'binary' ) && socket.readyState == 'open' )
    {
        console.log( "------------------------ connected" );

        //attempt to keep the socket connection alive
        //however, it is limited by the timeout set in the HTTP server
        socket.setKeepAlive( true, 0 );

        //handle the socket events
        this.HandleSocketEvents( socket, cCallbackCtx, fNewConnCallback, fCloseConnCallback, fOnDataCallback );
    }
};


//added by Oliver Chong - October 1, 2014
/**
 * Handles the socket related events
 *
 * @method HandleSocketEvents
 * @param {object} socket : socket is the network socket between the server and client
 * @param {object} cCallbackCtx : the context in which the callback function will be executed
 * @param {function} fNewConnCallback : the callback function to be invoked when a websocket connection is established (must take 1 parameter: Socket object)
 * @param {function} fCloseConnCallback : the callback function to be invoked when a websocket connection is closed
 * @param {function} fOnDataCallback : the callback function to be invoked when a socket data has been received (must take 1 parameter: Packet object) 
 */
WebSocketMgr.prototype.HandleSocketEvents = function( socket, cCallbackCtx, fNewConnCallback, fCloseConnCallback, fOnDataCallback )
{
    var that = this;

    //TODO: this does not get triggered
    socket.on( "connect", function () {
        console.log("connection success!");
    } );

    //handles data received from the client
    socket.on( "data", function ( data ) {

        var cPacket = that.DecodeDataFrame( data );

        //console.log( " ---------------------------------------------------- " );
        //console.log( cPacket );

        //if the packet is sending a close request
        if ( cPacket.IsClose() )
        {
            console.log( "closing the socket connection..." );            
            
            socket.destroy();

            //callback function when a websocket connection is closed
            if ( typeof( fCloseConnCallback ) === "function" )
            {
                fCloseConnCallback.apply( cCallbackCtx );
            }
        }
        else
        {
            //add the client if it is a custom connection message
            var cSocketObj = that.HandleConnection( socket, cPacket );  

            //callback function when there is a new websocket connection
            if ( cSocketObj && typeof( fNewConnCallback ) === "function" )
            {
                fNewConnCallback.apply( cCallbackCtx, [ cSocketObj ] );
            }  

            //callback function when a websocket data is received
            if ( typeof( fOnDataCallback ) === "function" )
            {
                console.log( cPacket.m_nFIN,
                    cPacket.m_nOpCode,
                    cPacket.m_nMask,
                    cPacket.m_aMaskingKey,
                    cPacket.m_nPayloadLen );
                var aDecodedMsg = JSON.parse( cPacket.m_sDecodedMsg );

                fOnDataCallback.apply( cCallbackCtx, [ aDecodedMsg['clientId'], cPacket ] );
            }      
        } 
    } ); 
};


//added by Oliver Chong - October 14, 2014
/**
 * Handles the connection request that came from the client and adds the client to the list
 * 
 * @method HandleConnection
 * @param {object} socket : the socket object
 * @param {object} cPacket : the Packet object containing the message to be broadcasted
 */
WebSocketMgr.prototype.HandleConnection = function( socket, cPacket )
{
    var cSocketObj = null;

    //check if there is a packet and if it contains a message string
    if ( cPacket && cPacket.m_sDecodedMsg && cPacket.m_sDecodedMsg != '' )
    {
        //check if it is a valid JSON string
        if ( WebSocketMgrCommon.CheckIfValidJson( cPacket.m_sDecodedMsg ) ) 
        {
            var aDecodedMsg = JSON.parse( cPacket.m_sDecodedMsg );

            //check if it is a connection custom message
            if ( WebSocketMgrCommon.IsConnectionMsg( aDecodedMsg ) )
            {                
                cSocketObj = new SocketObj( aDecodedMsg['clientId'], socket );                     
            }            
        }
    }   

    return cSocketObj; 
};


//added by Oliver Chong - October 1, 2014
/**
 * Generates the handshake response based on the key received from the client
 *
 * @method StartStream
 * @param {string} sKey : the generated websocket key from the client
 * @return {string} : the handshake response
 */
WebSocketMgr.prototype.GenerateHandshakeResponse = function( sKey )
{
    var cShasum = g_cCrypto.createHash('sha1');

    //create the corresponding handshake response key
    var sMagicString = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    cShasum.update( sKey + sMagicString );

    var sHandshakeRes = cShasum.digest('base64');
    //console.log( "handshake response : " + sHandshakeRes );

    var aResponse = [];
    aResponse.push( "HTTP/1.1 101 Switching Protocols" );
    aResponse.push( "Upgrade: Websocket" );
    aResponse.push( "Connection: Upgrade" );
    aResponse.push( "Sec-WebSocket-Accept: " + sHandshakeRes );
    if ( this.m_sSubprotocol )
    {
        aResponse.push( "Sec-WebSocket-Protocol: " + this.m_sSubprotocol );
    }
    aResponse.push( "\r\n" );

    var sResponse = aResponse.join('\r\n');

    return sResponse;
};


//added by Oliver Chong - October 17, 2014
/**
 * Choose from the list of subprotocols that the client and server will use to communicate
 *
 * @method ChooseSubprotocol
 * @param {object} request : request is the arguments for the http request, as it is in the request event
 * @return {boolean} : return true if a protocol has been chosen
 */ 
WebSocketMgr.prototype.ChooseSubprotocol = function( request )
{
    var sSubprotocols = request.headers['sec-websocket-protocol'];
    var aSubprotocols = sSubprotocols.split(",");

    console.log( aSubprotocols );

    //go through the list of available subprotocols and choose it
    for ( var nKey in aSubprotocols )
    {
        var sSubprotocol = aSubprotocols[ nKey ];

        if ( sSubprotocol == SocketObj.PROTOCOL['JSON'] )
        {
            this.m_sSubprotocol = sSubprotocol;
            return true;
        }
    }//end loop

    return false;
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//PACK THE MESSAGE INTO A DATA FRAME TO BE SENT TO THE CLIENT


//added by Oliver Chong - October 3, 2014
/*
 * Packs the message into a data frame to be sent to the client
 *
 * @method PackMessage
 * @param {string} sMsg : the message string
 * @return {ArrayBuffer} : returns a binary data frame

HOW TO READ THE BINARY DATA
0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
*/
WebSocketMgr.prototype.PackMessage = function( sMsg )
{
    console.log( "============================ sMsg : " + sMsg );

    var nMsgLen = sMsg.length;
    console.log( "============================ nMsgLen : " + nMsgLen );

    //determine the size of the buffer
    var nBufferSize = 2 + nMsgLen;
    //if the payload length is medium or large
    if ( nMsgLen >= Packet.PAYLOAD_MED )
    {
        //if the message length is greater than 16 bits / 2 bytes / 2 ^ 16 (large payload)
        if ( nMsgLen > ( 1 << 16 ) )
        {
            nBufferSize += Packet.PAYLOAD_BYTES_LARGE;
        }
        //medium payload
        else
        {
            nBufferSize += Packet.PAYLOAD_BYTES_MED;
        }
    }

    var aDataFrame = new Uint8Array( nBufferSize );

    //set the FIN to 1
    //1000 0000
    aDataFrame[ 0 ] |= ( 1 << 7 );

    //set the opcode to 1 (TEXT)
    //1000 0001
    aDataFrame[ 0 ] |= Packet.OP_CODE_ARR.TEXT;

    //start to pack payload data
    var nDataFramePayloadIndex = 2;

    //if the payload length is medium or large
    if ( nMsgLen >= Packet.PAYLOAD_MED )
    {
        //if the message length is greater than 16 bits / 2 bytes / 2 ^ 16 (large payload)
        if ( nMsgLen > ( 1 << ( Packet.PAYLOAD_BYTES_MED * 8 ) ) )
        {
            aDataFrame[ 1 ] = Packet.PAYLOAD_LARGE;

            //update the starting byte index of the payload
            nDataFramePayloadIndex += Packet.PAYLOAD_BYTES_LARGE;
        }
        //medium payload
        else
        {
            aDataFrame[ 1 ] = Packet.PAYLOAD_MED;

            //update the starting byte index of the payload
            nDataFramePayloadIndex += Packet.PAYLOAD_BYTES_MED;           
        }

        //store the value of the layload length
        this.StoreBigPayloadLen( aDataFrame, nDataFramePayloadIndex, nMsgLen );
    }
    //small payload
    else
    {
        //set the payload length
        aDataFrame[ 1 ] = nMsgLen;        
    }

    //ensure the mask bit is 0
    aDataFrame[ 1 ] &= ~( 1 << 7 );

    //store the actual payload (no masking)    
    for ( var i = 0; i < nMsgLen; ++i )
    {
        //store the unicode equivalent of each character in the string
        aDataFrame[ nDataFramePayloadIndex ] = sMsg.charCodeAt( i );
        ++nDataFramePayloadIndex;
    }//end loop
    
    return new Buffer( aDataFrame );
};


//added by Oliver Chong - October 9, 2014
/*
 * Stores the payload length of medium/large payload data
 *
 * @method StoreBigPayloadLen
 * @param {ArrayBuffer} aDataFrame : an ArrayBuffer object that represents the binary data frame 
 * @param {unsigned} nDataFramePayloadIndex : the starting byte index of the payload data in the data frame
 * @param {unsigned} nMsgLen : the message length
 */
WebSocketMgr.prototype.StoreBigPayloadLen = function( aDataFrame, nDataFramePayloadIndex, nMsgLen )
{
    //convert the message length into its binary equivalent
    aBinaryVal = nMsgLen.toString( 2 ).split("");
    nBinaryLen = aBinaryVal.length;

    //start from the last byte index of the payload length
    var nDataFramePayloadLenIndex = ( nDataFramePayloadIndex - 1 );
    var nBitCounter = 0;
    for ( var i = ( nBinaryLen - 1 ); i >= 0; --i )
    {
        //set the payload length bit by bit
        aDataFrame[ nDataFramePayloadLenIndex ] |= ( aBinaryVal[ i ] << nBitCounter );

        //increment the bit counter
        ++nBitCounter;
        //if the bit counter reaches 8 bits (end of the byte)
        if ( nBitCounter == 8 )
        {
            //reset the bit counter back to 0
            nBitCounter = 0;
            //decrement the payload length index to the previous byte
            --nDataFramePayloadLenIndex;
        }
    }//end loop
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//DECODE THE DATA FRAME THAT WAS SENT FROM THE CLIENT


//added by Oliver Chong - October 1, 2014
/*
 * Decodes the binary data frame
 *
 * @method DecodeDataFrame
 * @param {binary} nDataFrame : the binary data to be decoded
 * @return {object} : returns an instance of the Packet class

HOW TO READ THE BINARY DATA
0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
*/
WebSocketMgr.prototype.DecodeDataFrame = function( nDataFrame )
{
    //console.log( nDataFrame );

    //convert the binary data frame into a readable ArrayBuffer object
    var aDataFrame = new Uint8Array( nDataFrame );

    //creates the packet object based on the metadata of the data frame
    var cPacket = this.CreatePacket( aDataFrame );

    //computes and reads the payload size before storing it in the packet object 
    var nMaskingKeyStartOffset = this.ComputePayloadSize( aDataFrame, cPacket );

    //stores the payload data into the packet object
    this.PopulatePayloadForDecoding( aDataFrame, cPacket, nMaskingKeyStartOffset );

    //decodes the payload data stored in the packet object
    this.DecodeMessage( cPacket );

    //console.log( cPacket );

    return cPacket;
};


//added by Oliver Chong - October 2, 2014
/**
 * Creates the data packet that will contain the contents of the binary data frame
 *
 * @method CreatePacket
 * @param {ArrayBuffer} aDataFrame : an ArrayBuffer object that represents the binary data frame 
 * @return {object} : an instance of the Packet object
 */
WebSocketMgr.prototype.CreatePacket = function( aDataFrame )
{
    //1st byte
    //if 1, the data frame contains the final part of the message
    //example: divide 128 by 2 (7 times)
    var nFIN = aDataFrame[0] >> 7;
    //console.log( "nFIN : " + nFIN );
    
    //check the last 4 bits if either one of them is set
    //1111 AND
    //0001
    //---------
    //0001
    var nOpCode = aDataFrame[0] & 15;
    //console.log( "nOpCode : " + nOpCode );

    //2nd btye
    //the bit 1 is the mask 
    //check if the first bit is set
    var nMask = ( aDataFrame[1] & 128 ) ? 1 : 0;
    //console.log( "nMask : " + nMask );

    return new Packet( nFIN, nOpCode, nMask );
};


//added by Oliver Chong - October 2, 2014
/**
 * Computes the payload size and stores it in the packet
 *
 * @method ComputePayloadSize
 * @param {ArrayBuffer} aDataFrame : an ArrayBuffer object that represents the binary data frame 
 * @param {object} cPacket : an instance of the Packet object
 * @return {unsigned} : the starting byte offset of the masking key that is dependent on the computed payload size
 */
WebSocketMgr.prototype.ComputePayloadSize = function( aDataFrame, cPacket )
{
    //bits 2-8 contains the payload length
    //unset the first bit since we only need the next 7 bits
    //example: 10000011 becomes 00000011
    var nPayloadLen = aDataFrame[1] & ~128;
    //console.log( "nPayloadLen : " + nPayloadLen );

    var nMaskingKeyStartOffset = 0;
    switch( nPayloadLen )
    {
        //the following 2 bytes (16-bit unsigned integer) are the length
        case Packet.PAYLOAD_MED: 
            nMaskingKeyStartOffset = Packet.PAYLOAD_BYTES_MED;

            //combine the 8 bit unsigned integers and compute the 16 bit unsigned integer value
            //nPayloadLen = ( aDataFrame[ 2 ] << 8 ) + aDataFrame[ 3 ];

            nPayloadLen = 0;
            var nBytePos = Packet.PAYLOAD_BYTES_MED - 1;
            var nEndingByte = Packet.PAYLOAD_EXT_LEN_START_BYTE + Packet.PAYLOAD_BYTES_MED;
            for ( var i = Packet.PAYLOAD_EXT_LEN_START_BYTE; i < nEndingByte; ++i )
            {
                nPayloadLen += aDataFrame[ i ] << ( 8 * nBytePos );
                --nBytePos;
            }//end loop

            break

        //the following 8 bytes (64-bit unsigned integer) are the length
        case Packet.PAYLOAD_LARGE: 
            nMaskingKeyStartOffset = Packet.PAYLOAD_BYTES_LARGE;

            nPayloadLen = 0;
            var nBytePos = Packet.PAYLOAD_BYTES_LARGE - 1;
            var nEndingByte = Packet.PAYLOAD_EXT_LEN_START_BYTE + Packet.PAYLOAD_BYTES_LARGE;
            for ( var i = Packet.PAYLOAD_EXT_LEN_START_BYTE; i < nEndingByte; ++i )
            {
                nPayloadLen += aDataFrame[ i ] << ( 8 * nBytePos );
                --nBytePos;
            }//end loop
            
            break;
        
        default:
            break;
    }

    //console.log( "nPayloadLen (extended) : " + nPayloadLen );

    cPacket.m_nPayloadLen = nPayloadLen;

    return nMaskingKeyStartOffset;
};


//added by Oliver Chong - October 2, 2014
/**
 * Populates the packet with the masking key and the encoded contents of the payload
 *
 * @method PopulatePayloadForDecoding
 * @param {ArrayBuffer} aDataFrame : an ArrayBuffer object that represents the binary data frame 
 * @param {object}  : an instance of the Packet object
 * @param {unsigned} nMaskingKeyStartOffset : the starting byte offset of the masking key
 */
WebSocketMgr.prototype.PopulatePayloadForDecoding = function( aDataFrame, cPacket, nMaskingKeyStartOffset )
{
    var nMaskKeyStartIndex = 2 + nMaskingKeyStartOffset;
    var nPayloadStartIndex = nMaskKeyStartIndex + 4; //the masking key is 4 bytes long by default
    var nPayloadEndIndex = nPayloadStartIndex + cPacket.m_nPayloadLen;

    //get the masking key
    if ( cPacket.m_nMask )
    {
        for ( var index = nMaskKeyStartIndex; index < nPayloadStartIndex; ++index )
        {
            cPacket.m_aMaskingKey.push( aDataFrame[ index ] );
        }//end loop

        //console.log( "masking key" );
        //console.log( cPacket.m_aMaskingKey );
    }

    //get the actual payload
    var aEncodedPayload = [];
    for ( var index = nPayloadStartIndex; index < nPayloadEndIndex; ++index )
    {
        cPacket.m_aEncodedPayload.push( aDataFrame[ index ] );
    }//end loop

    //console.log( "payload" );
    //console.log( cPacket.m_aEncodedPayload );
};


//added by Oliver Chong - October 2, 2014
/**
 * Decodes the encoded payload based on the masking key and stores it in the packet
 *
 * @method DecodeMessage
 * @param {object}} cPacket : an instance of the Packet object
 */
WebSocketMgr.prototype.DecodeMessage = function( cPacket )
{
    //if the packet mesaage is masked
    if ( cPacket.m_nMask )
    {
        //decode the payload
        var nMsgLen = cPacket.m_aEncodedPayload.length;
        for ( var index = 0; index < nMsgLen; ++index )
        {   
            var nDecodedVal = cPacket.m_aEncodedPayload[ index ];
            
            //the algorithm to decode the encoded payload using the masking key
            //toggle the bits using the ^ (XOR) bitwise function
            nDecodedVal ^= cPacket.m_aMaskingKey[ index % 4 ];

            cPacket.m_aDecodedPayload.push( nDecodedVal );
              
        }//end loop
    }

    //if the packet payload is a text
    if ( cPacket.IsText() )
    {
        nMsgLen = cPacket.m_aDecodedPayload.length;
        for ( var index = 0; index < nMsgLen; ++index )
        {
            //convert the decoded value to its character equivalent
            cPacket.m_sDecodedMsg += String.fromCharCode( cPacket.m_aDecodedPayload[ index ] );
        }//end loop   
    }

    //console.log( "decoded message : " + cPacket.m_sDecodedMsg );
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 14, 2014
/**
 * Send the message to the target client socket 
 *
 * @method SendMessage
 * @param {object} socket : the Socket object that refers to the client websocket connection
 * @param {string} sMsg : the message to be sent
 */
WebSocketMgr.prototype.SendMessage = function( socket, sMsg )
{
    var aDataFrame = this.PackMessage( sMsg );

    return socket.write( aDataFrame, 'binary' );
};


//added by Oliver Chong - October 9, 2014
/**
 * Process the message then send it to the target client socket
 *
 * @method ProcessMessage
 * @param {object} cSocketObj : the custom socket object (instance of SocketObj)
 * @param {object} cPacket : the Packet object containing the message to be broadcasted (instance of Packet)
 */
WebSocketMgr.prototype.ProcessMessage = function( cSocketObj, cPacket )
{
    //check if there is a packet and if it contains a message string
    if ( cPacket && cPacket.m_sDecodedMsg && cPacket.m_sDecodedMsg != '' )
    {
        //check if it is a valid JSON string
        if ( WebSocketMgrCommon.CheckIfValidJson( cPacket.m_sDecodedMsg ) ) 
        {
            var aDecodedMsg = JSON.parse( cPacket.m_sDecodedMsg );   

            //check if it is a custom connection message
            if ( WebSocketMgrCommon.IsConnectionMsg( aDecodedMsg ) )
            {                
                //do something
            }            
            else
            {
                //handle the ping manually since there is no API from the browser that sends a ping request
                if ( !this.HandlePing( cSocketObj.m_sId, cSocketObj.m_cSocket, aDecodedMsg ) )
                {
                    //if not a ping request, handle the JSON message
                    var aFormattedMsg = WebSocketMgrCommon.FormatMsg( aDecodedMsg['clientId'], aDecodedMsg['messageType'], aDecodedMsg['message'] );
                    this.SendMessage( cSocketObj.m_cSocket, JSON.stringify( aFormattedMsg ) );
                }
            }        
        }
        //if normal string
        else
        {
            //send the message to the client
            this.SendMessage( cSocketObj.m_cSocket, cPacket.m_sDecodedMsg );
        }
    }    
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//KEEPING CONNECTION ALIVE


//added by Oliver Chong - October 9, 2014
/**
 * Handles the ping request that came from the client and sends back a pong response
 *
 * @method HandlePing
 * @param {string} sId : the client id of the socket
 * @param {object} socket : the socket object
 * @param {array} aMsg : the array containing the ping message
 * @return {boolean} : return true if successful
 */
WebSocketMgr.prototype.HandlePing = function( sClientId, socket, aMsg )
{
    //check if it is a ping message
    //and ensure that the pong message is only sent to the client who sent the ping request
    if ( WebSocketMgrCommon.IsPingPongMsg( aMsg, true ) )
    {
        if ( sClientId == aMsg['clientId'] )
        {
            this.Pong( socket, aMsg['clientId'] );  
        }

        return true;
    }
    else
    {
        return false;
    }
};


//added by Oliver Chong - October 9, 2014
/**
 * Sends the pong response back to the client
 *
 * @method Pong
 * @param {object} socket : the socket object
 * @return {boolean} : return true if the buffer has beeen flushed
 */
WebSocketMgr.prototype.Pong = function( socket, sSenderId )
{
    var aPongMsg = WebSocketMgrCommon.CreatePingPongMsg( sSenderId, false );

    var sPongMsg = JSON.stringify( aPongMsg )

    var aDataFrame = this.PackMessage( sPongMsg );

    return socket.write( aDataFrame, 'binary' );
};


////////////////////////////////////////////////////////////////////////////////////////


if ( typeof( module ) !== 'undefined' )
{
    //export (or "expose") the internally scoped functions
    module.exports = WebSocketMgr;
}