////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the websocket manager client class
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 9, 2014
/**
 * The constructor for the websocket client
 *
 * @class WebSocketMgrClient
 * @constructor WebSocketMgrClient
 * @param {string} sUrl : the URL of the websocket server
 * @param {array} aSubprotocol : the list of websocket protocols to be used (assuming the server supports it)
 */
var WebSocketMgrClient = function( sUrl, aSubprotocol )
{
    this.m_sUrl = sUrl;
    this.m_aSubprotocol = aSubprotocol;
}

//data members
WebSocketMgrClient.prototype.m_sUrl = '';
WebSocketMgrClient.prototype.m_cSocket = null;
WebSocketMgrClient.prototype.m_nPingInterval = 60000;
WebSocketMgrClient.prototype.m_aSubprotocol = null;
WebSocketMgrClient.prototype.m_sUserName = '';
WebSocketMgrClient.prototype.m_nHeartbeatId = null;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 16, 2014
/**
 * Start the heartbeat to keep the connection alive
 *
 * @method StartHeartbeat
 */
WebSocketMgrClient.prototype.StartHeartbeat = function()
{
    var that = this;

    //keep on pinging the server to keep the connection alive (heartbeat)
    this.m_nHeartbeatId = setInterval( function() { that.Ping(); }, that.m_nPingInterval );
};


//added by Oliver Chong - October 16, 2014
/**
 * Stop emitting heartbeats
 *
 * @method StopHeartbeat
 */
WebSocketMgrClient.prototype.StopHeartbeat = function()
{
    if ( this.m_nHeartbeatId )
    {
        clearInterval( this.m_nHeartbeatId );
    }
};


//added by Oliver Chong - October 9, 2014
/**
 * Send a ping message to the server
 * 
 * @method Ping
 */
WebSocketMgrClient.prototype.Ping = function()
{
    if ( this.IsConnectionActive() )
    {
        var aPingMsg = WebSocketMgrCommon.CreatePingPongMsg( this.m_sUserName, true );

        var sPingMsg = JSON.stringify( aPingMsg );

        console.log( "ping : " + sPingMsg );

        this.m_cSocket.send( sPingMsg );  
    }
};


//added by Oliver Chong - October 12, 2014
/**
 * Checks if the message is a pong response
 *
 * @method IsPong
 * @param {array} aMsg : the array containing the pi\ong message
 * @return {boolean} : return true if it is a pong response
 */
WebSocketMgrClient.prototype.IsPong = function( aMsg )
{
    if ( WebSocketMgrCommon.IsPingPongMsg( aMsg, false ) )
    {
        return true; 
    }
    else
    {
        return false;
    }
};


//added by Oliver Chong - October 9, 2014
/**
 * Checks if the current websocket connection is still active
 *
 * @method IsConnectionActive
 */
WebSocketMgrClient.prototype.IsConnectionActive = function()
{
    if ( !this.m_cSocket || this.m_cSocket.readyState == undefined || this.m_cSocket.readyState == this.m_cSocket.CLOSING || this.m_cSocket.readyState == this.m_cSocket.CLOSED )
    {
        return false;
    }
    else
    {
        return true;
    }
};


//added by Oliver Chong - October 9, 2014
/**
 * Sends the message to the server
 *
 * @method SendMessage
 * @param {string} sMsg :  the message string
 */
WebSocketMgrClient.prototype.SendMessage = function( sMsg )
{
    if ( this.IsConnectionActive() )
    {
        //var aMsg = WebSocketMgrCommon.FormatMsg( this.m_sUserName, sMsg );

        //console.log( aMsg );

        //this.m_cSocket.send( JSON.stringify( aMsg ) );

        this.m_cSocket.send( sMsg );

        console.log( "message sent buffer count : " + this.m_cSocket.bufferedAmount );
    }
};


//added by Oliver Chong - October 9, 2014
/**
 * Close the websocket connection
 * 
 * @method CloseConnection
 * @return {boolean} : if true, the connection has been closed otherwise return false
 */
WebSocketMgrClient.prototype.CloseConnection = function()
{
    if ( this.IsConnectionActive() )
    {        
        this.m_cSocket.onclose = function () {}; // disable onclose handler first
        this.m_cSocket.close(); 

        this.StopHeartbeat();   

        console.log( "connection closed..." );

        return true;
    }
    else
    {
        return false;
    }
};


//added by Oliver Chong - October 9, 2014
/**
 * Initialize the websocket connection
 *
 * @method InitConnection
 * @return {boolean} : if true, the connection has been initialized otherwise return false
 */
WebSocketMgrClient.prototype.InitConnection = function( fCallback )
{
    //if ("WebSocket" in window)
    if ( window.WebSocket != undefined )
    {
        alert("WebSocket is supported by your Browser!");
        
        //create the websocket connection
        if ( !this.IsConnectionActive() )
        {
            if ( this.m_aSubprotocol )
            {
                this.m_cSocket = new WebSocket( this.m_sUrl, this.m_aSubprotocol );
            }
            else
            {
                this.m_cSocket = new WebSocket( this.m_sUrl );
            }

            this.m_cSocket.binaryType = "arraybuffer"; 

            if ( typeof( fCallback ) === "function" )
            {
                fCallback.call();
            }

            return true;
        }
        else
        {
            alert("WebSocket is still active!");

            return false;
        }
    }
    else
    {
        // The browser doesn't support WebSocket
        alert("WebSocket NOT supported by your Browser!");

        return false;
    }
};