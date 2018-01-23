////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the websocket server class
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


var g_cHttp = require('http');
var g_cFs = require('fs');
var g_cUrl = require( 'url' );
var g_cPath = require( 'path' );
var g_cRsvp = require( 'rsvp' );


//custom files
var Packet = require( './common/websocket_packet' );
var SocketObj = require( './common/websocket_conn_obj' );
var CommonUtil = require( './common/common_utility' );

var WebSocketMgrCommon = require( './websocket_custom/websocket_manager_common' );
var WebSocketMgr = require( './websocket_custom/websocket_manager_server' );

var ClientRoomMgr = require( './core/client_room_mgr' );


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 1, 2014
/**
 * The constructor for the web server
 *
 * @class WebServer
 * @constructor WebServer
 * @param {string} sHost : the IP address of the server host
 * @param {unsigned} nPort : the port number to which the client will connect to
 */
var WebServer = function( sHost, nPort )
{
    this.m_sHost = sHost;
    this.m_nPort = nPort;

    this.m_cWebSocketMgr = new WebSocketMgr();

    this.m_cClientRoomMgr = new ClientRoomMgr();

    this.InitRouteHandle();

    this.InitServer();
};


//data members
//port number
WebServer.prototype.m_nPort = 0;
//host name
WebServer.prototype.m_sHost = '';
//the HTTP server object
WebServer.prototype.m_cServer = null;

//map the request to the corresponding request handler functions and store in the array
WebServer.prototype.m_aRouteHandle = {};

//the websocket manager
WebServer.prototype.m_cWebSocketMgr = null;

//the client and room manager
WebServer.prototype.m_cClientRoomMgr = null;



//added by Oliver Chong - October 1, 2014
/**
 * Initialize the server
 *
 * @method InitServer
 */
WebServer.prototype.InitServer = function()
{
    var that = this;

    var sTest = "Server initialized at " + this.m_sHost + ":" + this.m_nPort;

    //create the server instance that will handle request and response
    this.m_cServer = g_cHttp.createServer( function ( request, response ) 
    { 
        that.HandleRequest( request, response );
    } );    

    //server will listen for client requests
    this.m_cServer.listen( this.m_nPort, this.m_sHost, function() {         
        that.HandleUpgradeRequest(); 
    } );

    console.log( sTest );
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//REQUEST HANDLING


//added by Oliver Chong - October 19, 2014
/** 
 * Maps the request to the corresponding request handler functions and store in the array
 *
 * @method InitRouteHandle
 */
WebServer.prototype.InitRouteHandle = function()
{
    this.m_aRouteHandle[ '/' ] = this.ServeFile;
    this.m_aRouteHandle[ '/chat' ] = this.ServeFile;
};


//added by Oliver Chong - October 19, 2014
/**
 * This handles the HTTP request from the client
 *
 * @method HandleRequest
 * @param {object} request : the HTTP Request
 * @param {object} response : the HTTP Response
 */
WebServer.prototype.HandleRequest = function( request, response )
{
    /*
    The url module provides methods which allow us to extract the different parts of a URL
    (like e.g. the requested path and query string),
    and querystring can in turn be used to parse the query string for request parameters:

                                    url.parse(string).query
                                               |
               url.parse(string).pathname      |
                           |                   |
                           |                   |
                         ------ -------------------
    http://localhost:8888/start?foo=bar&hello=world
                                    ---       -----
                                     |          |
                                     |          |
                  querystring(string)["foo"]    |
                                                |
                             querystring(string)["hello"]
    */
    var sPathName = g_cUrl.parse( request.url ).pathname;
    console.log( "-------------------- Request received for : " + sPathName );


    //block favicon requests
    if ( sPathName === '/favicon.ico' )
    {
        response.writeHead( 200, {'Content-Type' : 'image/x-icon'});
        response.end();
        console.log( "-------------------- favicon requested" );

        return;
    }
    //handle valid requests
    else
    {
        //determine the content type for the respose based on the extension name
        var sExtName = g_cPath.extname( sPathName );
        var sContentType = 'text/html';
        switch ( sExtName ) 
        {
            case '.js':
                sContentType = 'text/javascript';
                break;
            case '.css':
                sContentType = 'text/css';
                break;
        }

        console.log( "sContentType:" + sContentType );

        //route the request to the corresponding response page/file
        this.RouteRequest( sPathName, sContentType, response, request );
    }
};


//added by Oliver Chong - October 19, 2014
/**
 * This routes the request based on the URL pathname
 *
 * @method RouteRequest
 * @param {string} sPathName : the URL pathname
 * @param {string} sContentType : the content type of the response
 * @param {object} request : the HTTP Request
 * @param {object} response : the HTTP Response
 */
WebServer.prototype.RouteRequest = function( sPathName, sContentType, response, request )
{
    console.log( "About to route a request for : " + sPathName );        
    
    //check if a request handler for the given pathname exists
    if ( typeof this.m_aRouteHandle[ sPathName ] === 'function' )
    {
        var sFilePath = __dirname + '/public/websocket_sample.html';
        //var sFilePath = __dirname + '/webSocketTest.html';
        //var sFilePath = './webSocketTest.html';

        this.m_aRouteHandle[ sPathName ]( sFilePath, sContentType, response, request );        
    }
    else
    {
        var sFilePath = __dirname + sPathName;
        //manually serve the file
        this.ServeFile( sFilePath, sContentType, response, request );
    }             
};


//added by Oliver Chong - October 19, 2014
/**
 * This serves the static file based on the path name  
 *
 * @method ServeFile
 * @param {string} sFilePath : the file path
 * @param {string} sContentType : the content type of the response
 * @param {object} request : the HTTP Request
 * @param [object} response : the HTTP Response
 */
WebServer.prototype.ServeFile = function( sFilePath, sContentType, response, request )
{
    var cFile = null;

    console.log( "serve file..." + sFilePath );

    //read the contents of the file
    g_cFs.readFile( sFilePath, function ( err, data ) {
        
        console.log( "read file..." );

        if ( err ) 
        {             
            response.writeHead( 500, {"Content-Type": "text/plain"} );
            response.write( err + "\n" );
            response.end();            

            //throw err;
        }
        else
        {
            console.log( "content : " );
            console.log( data );

            if ( data )
            {
                response.writeHeader( 200, {"Content-Type": sContentType} );
                response.write( data, 'utf-8' );
                response.end();
            }
        }
    });
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//MANAGE THE WEB SOCKET CONNECTION


//added by Oliver Chong - October 1, 2014
/**
 * Handles the HTTP upgrade request sent by the client (to start using websockets)
 *
 * @method HandleUpgradeRequest
 */
WebServer.prototype.HandleUpgradeRequest = function()
{
    var that = this;

    /*
    request is the arguments for the http request, as it is in the request event.
    socket is the network socket between the server and client.
    head is an instance of Buffer, the first packet of the upgraded stream, this may be empty.
    */
    this.m_cServer.on( "upgrade", function ( request, socket, head ) {

        console.log( "----------------------------- on upgrade" );
        console.log( request.headers );

        that.m_cWebSocketMgr.ManageUpgrade( request, socket, that, that.AddClients, that.RefreshClients, that.BroadcastMessage );

        //if the server times out, destroy the socket as well
        socket.setTimeout( that.m_cServer.timeout, function(){ socket.destroy(); } );  
    } );

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//SEND MESSAGES


//added by Oliver Chong - December 12, 2014
/**
 * Broadcast the client list
 *
 * @method BroadcastClientList
 */
WebServer.prototype.BroadcastClientList = function()
{
    console.log( "BroadcastClientList!!! --- CLIENT LIST" );

    var aClientList = [];
    //go through all the clients
    for ( var sClientId in this.m_cClientRoomMgr.m_aClients )
    {
        //create the client list
        aClientList.push( sClientId );
    }//end loop

    //go through all the clients
    for ( var sClientId in this.m_cClientRoomMgr.m_aClients )
    {
        var cSocketObj = this.m_cClientRoomMgr.m_aClients[ sClientId ];

        //if the socket is active
        if ( cSocketObj.m_cSocket && !cSocketObj.m_cSocket.destroyed )
        {
            //send the list of clients
            var aFormattedMsg = WebSocketMgrCommon.FormatMsg( sClientId, 2, aClientList );

            console.log( aFormattedMsg );
            this.m_cWebSocketMgr.SendMessage( cSocketObj.m_cSocket, JSON.stringify( aFormattedMsg ) );
        }
    }//end loop
};


//added by Oliver Chong - October 14, 2014
/**
 * Broadcast the custom message to all the clients
 *
 * @method BroadcastMessageCustom
 * @param {string} sSender : the sender of the message
 * @param {string} sMsg : the message to be broadcasted
 * @param {boolean} bExcludeSender : if true, exclude the sender from receiving the broadcasted message
 */
WebServer.prototype.BroadcastMessageCustom = function( sSender, sMsg, bExcludeSender )
{
    console.log( "BroadcastMessage!!! --- CUSTOM" );

    bExcludeSender = ( typeof( bExcludeSender ) !== "undefined" ) ? bExcludeSender : true;

    //go through all the clients
    for ( var sClientId in this.m_cClientRoomMgr.m_aClients )
    {
        var cSocketObj = this.m_cClientRoomMgr.m_aClients[ sClientId ];

        //if the socket is active
        //and check if the sender is to be excluded from the message broadcast
        if ( cSocketObj.m_cSocket && !cSocketObj.m_cSocket.destroyed 
            && ( bExcludeSender && ( sClientId != sSender ) ) )
        {
            //send the message
            this.m_cWebSocketMgr.SendMessage( cSocketObj.m_cSocket, sMsg );
        }
    }//end loop
};


//added by Oliver Chong - October 12, 2014
/**
 * Broadcast the message to all the clients
 *
 * @method BroadcastMessage
 * @param {string} sSender : the sender of the message
 * @param {object} cPacket : the Packet object containing the message to be broadcasted
 * @param {boolean} bExcludeSender : if true, exclude the sender from receiving the broadcasted message
 */
WebServer.prototype.BroadcastMessage = function( sSender, cPacket, bExcludeSender )
{
    console.log( "BroadcastMessage!!!" );

    bExcludeSender = ( typeof( bExcludeSender ) !== "undefined" ) ? bExcludeSender : true;

    //go through all the clients
    for ( var sClientId in this.m_cClientRoomMgr.m_aClients )
    {
        var cSocketObj = this.m_cClientRoomMgr.m_aClients[ sClientId ];

        //if the socket is active
        //and check if the sender is to be excluded from the message broadcast
        if ( cSocketObj.m_cSocket && !cSocketObj.m_cSocket.destroyed 
            && ( bExcludeSender && ( sClientId != sSender ) ) )
        {
            //send the message
            this.m_cWebSocketMgr.ProcessMessage( cSocketObj, cPacket );
        }
    }//end loop
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//MANAGE CLIENTS


//added by Oliver Chong - October 11, 2014
/**
 * Adds a client
 *
 * @method AddClients
 * @return {boolean} : if true, the client has been added 
 */
WebServer.prototype.AddClients = function( cSocketObj )
{
    //check if the client exists
    if ( !this.m_cClientRoomMgr.DoesClientExist( cSocketObj.m_sId ) )
    {
        //add the client to the list
        this.m_cClientRoomMgr.AddClient( cSocketObj.m_sId, cSocketObj );

        //broadcast the message
        this.BroadcastMessageCustom( cSocketObj.m_sId, cSocketObj.m_sId + " has connected." );

        //broadcast the client list
        this.BroadcastClientList();

        return true;
    } 
    else
    {
        return false;
    }
};


//added by Oliver Chong - October 11, 2014
/**
 * Refreshes the list of clients to remove the inactive ones
 *
 * @method RefreshClients
 */
WebServer.prototype.RefreshClients = function()
{
    var nPos = 0;

    for ( var sClientId in this.m_cClientRoomMgr.m_aClients )
    {
        var cSocketObj = this.m_cClientRoomMgr.m_aClients[ sClientId ];

        console.log( '--------------------------- RefreshClients' );

        if ( cSocketObj.m_cSocket && cSocketObj.m_cSocket.destroyed )
        {
            console.log( '--------------------------- remove ' +  sClientId );

            if ( nPos != -1 ) 
            {
                //remove it from the list of clients
                //this.m_aClients.splice( nPos, 1 );
                //delete this.m_aClients[ sClientId ];
                this.m_cClientRoomMgr.RemoveClient( sClientId );

                //broadcast the message
                this.BroadcastMessageCustom( sClientId, sClientId + " has disconnected." );

                //broadcast the client list
                this.BroadcastClientList();

                console.log( "--------------------------- client removed! position " + nPos );
                console.log( this.m_cClientRoomMgr.m_aClients );
            }            
        }

        ++nPos;
    }//end loop
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//start running the server
var cWebServer = new WebServer( SocketObj.CONNECTION['HOST'], SocketObj.CONNECTION['PORT'] );