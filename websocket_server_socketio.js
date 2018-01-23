////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the websocket server class
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


var g_cHttp = require('http');
var g_cExp = require('express');
var g_cSocketIO = require('socket.io');
var g_cFs = require('fs');
var g_cAsync = require('async');


//custom files
var SocketObj = require( './common/websocket_conn_obj' );
var CommonUtil = require( './common/common_utility' );

var TwitHandler = require( './core/twitter_stream' );
var ClientRoomMgr = require( './core/client_room_mgr' );

var ChannelHandlerChat = require( './core/channel_handler_chat' );
var ChannelHandlerDraw = require( './core/channel_handler_draw' );
var ChannelHandlerTwitter = require( './core/channel_handler_twitter' );


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 1, 2014
/**
 * The constructor for the web server
 * @param String sHost : the IP address of the server host
 * @param unsigned nPort : the port number to which the client will connect to
 */
var WebServer = function( sHost, nPort )
{
    this.m_sHost = sHost;
    this.m_nPort = nPort;

    this.InitServer();
};


//data members
//port number
WebServer.prototype.m_nPort = 0;
//host name
WebServer.prototype.m_sHost = '';

//the HTTP server object
WebServer.prototype.m_cServer = null;
//the Express application
WebServer.prototype.m_cExpApp = null;
//Socket IO
WebServer.prototype.m_cSocketIO = null;

//the list of namespaces (websocket communication channels)
WebServer.prototype.m_aChannels = {};

//the client and room manager
WebServer.prototype.m_cClientRoomMgr = null;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 23, 2014
/**
 * Initialize the server
 */
WebServer.prototype.InitServer = function()
{
    var that = this;

    //create the Express application
    this.m_cExpApp = g_cExp();

    //create the server instance that will handle request and response
    this.m_cServer = g_cHttp.createServer( this.m_cExpApp );  

    //integrate the Socket IO modele
    this.m_cSocketIO = g_cSocketIO( this.m_cServer );

    //set the transport modes
    //'websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling', 'polling'
    this.m_cSocketIO.set( 'transports', [ 'websocket', 'polling' ] ); 

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //initialize the client room manager
    this.m_cClientRoomMgr = new ClientRoomMgr();
                                        
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    g_cAsync.parallel( [
        //add the static file serving middleware to serve static files in the lib directory folder
        function() { that.SetStaticDirectory.call( that ); },
        //handle HTTP requests
        function() { that.RouteRequest.call( that ); },
        //initialize the communication channels
        function() { that.InitChannels.call( that ); }
    ], 
    function ( err, results )
    {
        console.log( err, results );
    } );

    //handle websocket requests
    this.HandleSocketRequest();

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //server will listen for client requests
    this.m_cServer.listen( this.m_nPort, this.m_sHost, function() {         
        console.log( "Server initialized at " + that.m_sHost + ":" + that.m_nPort );
    } );    
};


//added by Oliver Chong - October 27, 2014
/**
 * Set the static directories in the server
 */
WebServer.prototype.SetStaticDirectory = function()
{
    //add the static file serving middleware to serve static files in the lib directory folder
    this.m_cExpApp.use( '/lib', g_cExp.static( __dirname + '/lib' ) );  
    this.m_cExpApp.use( '/common', g_cExp.static( __dirname + '/common' ) ); 
    this.m_cExpApp.use( '/public', g_cExp.static( __dirname + '/public' ) ); 
    this.m_cExpApp.use( '/hellophaser', g_cExp.static( __dirname + '/public/hellophaser' ) );  
};


//added by Oliver Chong - October 27, 2014
/**
 * Route the HTTP request and serve the corresponding page
 */
WebServer.prototype.RouteRequest = function()
{
    //handle HTTP requests
    this.m_cExpApp.get( '/', function ( req, res ) {
        res.send('<h1>Hello world</h1>');
    });

    this.m_cExpApp.get( '/chat', function ( req, res ) {
        //this is deprecated in Express
        //res.sendfile( 'webSocketIO.html' );
        res.sendFile( __dirname + '/webSocketIO.html' );
    });

    this.m_cExpApp.get( '/collab', function ( req, res ) {
        res.sendFile( __dirname + '/public/collab.html' );
    });

    this.m_cExpApp.get( '/hellophaser', function ( req, res ) {
        res.sendFile( __dirname + '/public/hellophaser/index.html' );
    });
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//MANAGE SOCKET CHANNELS


//added by Oliver Chong - October 29, 2014
/**
 * Initializes the websocket communication channels
 */
WebServer.prototype.InitChannels = function()
{
    this.RegisterChannel( SocketObj.CHANNEL['CHAT'] );
    this.RegisterChannel( SocketObj.CHANNEL['DRAW'] );
    this.RegisterChannel( SocketObj.CHANNEL['TWIT'] );
};


//added by Oliver Chong - October 29, 2014
/**
 * Registers a websocket communication channel
 * @param string sChannelName : the channel name
 */
WebServer.prototype.RegisterChannel = function( sChannelName )
{
    this.m_aChannels[ sChannelName ] = this.m_cSocketIO.of( sChannelName );
};


//added by Oliver Chong - October 29, 2014
/**
 * Gets a websocket communication channel
 * @param string sChannelName : the channel name
 * @return socket : the chosen websocket communication channel
 */
WebServer.prototype.UseChannel = function( sChannelName )
{
    return this.m_aChannels[ sChannelName ];
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//MANAGE WEBSOCKET REQUESTS


//added by Oliver Chong - October 27, 2014
/**
 * Handle websocket requests
 */
WebServer.prototype.HandleSocketRequest = function()
{
    var that = this;

    g_cAsync.parallel( [
        function() { that.HandleChatChannel.call( that ); },
        function() { that.HandleDrawChannel.call( that ); },
        function() { that.HandleTwitterChannel.call( that ); }
    ], 
    function ( err, results )
    {
        console.log( err, results );
    } );
};


//added by Oliver Chong - October 27, 2014
/**
 * Handles the request for the CHAT communication channel
 */
WebServer.prototype.HandleChatChannel = function()
{
    var cChatChannel = this.UseChannel( SocketObj.CHANNEL['CHAT'] );

    //listen for events in the channel
    ChannelHandlerChat.Listen( cChatChannel, this.m_cClientRoomMgr, SocketObj.DEFAULT_ROOM );
};


//added by Oliver Chong - October 31, 2014
/**
 * Handles the request for the DRAW communication channel
 */
WebServer.prototype.HandleDrawChannel = function()
{
    var cDrawChannel = this.UseChannel( SocketObj.CHANNEL['DRAW'] );

    //listen for events in the channel
    ChannelHandlerDraw.Listen( cDrawChannel );  
};


//added by Oliver Chong - November 3, 2014
/**
 * Handles the request for the TWIT communication channel
 */
WebServer.prototype.HandleTwitterChannel = function()
{
    var cTwitChannel = this.UseChannel( SocketObj.CHANNEL['TWIT'] );

    //initialize the Twitter handler
    var cTwitterHandler = new TwitHandler( cTwitChannel, 3 );

    //listen for events in the channel
    ChannelHandlerTwitter.Listen( cTwitChannel, cTwitterHandler, this.m_cClientRoomMgr.GetClientCount() );
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//start running the server
var cWebServer = new WebServer( SocketObj.CONNECTION['HOST'], SocketObj.CONNECTION['PORT'] );