////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the websocket client class
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 9, 2014
/**
 * The constructor for the socket client
 *
 * @class SocketClient
 * @constructor SocketClient
 * @param {string} sUrl : the URL of the websocket server
 * @param {array} aSubprotocol : the list of websocket protocols to be used (assuming the server supports it)
 */
var SocketClient = function( sUrl, aSubprotocol )
{  
    this.m_cWebSocketMgr = new WebSocketMgrClient( sUrl, aSubprotocol );    

    //initialize the user interface manager
    this.m_cUI = new CollabUI();

    //activate handling events
    this.HandlePageEvent();    
};


//data members
//the custom websocket manager
SocketClient.prototype.m_cWebSocketMgr = null;

//the user interface class
SocketClient.prototype.m_cUI = null;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 9, 2014
/**
 * Initializes the web socket connection
 *
 * @method InitWebSocketConn
 */
SocketClient.prototype.InitWebSocketConn = function()
{
    if ( this.m_cWebSocketMgr.InitConnection() )
    {
        this.HandleSocketEvents();
    }

    console.log( this.m_cWebSocketMgr );
};


//added by Oliver Chong - October 9, 2014
/**
 * Closes the web socket connection
 *
 * @method CloseWebSocketConn
 */
SocketClient.prototype.CloseWebSocketConn = function()
{
    this.m_cWebSocketMgr.CloseConnection();
};


//added by Oliver Chong - October 9, 2014
/**
 * Handle the events related to the websockets
 *
 * @method HandleSocketEvents
 */
SocketClient.prototype.HandleSocketEvents = function()
{
    var that = this;

    //using the addEventListener can allow multiple handlers to be attached
    this.m_cWebSocketMgr.m_cSocket.addEventListener( "message", function ( evt ) {
        
        //check if it is a valid JSON string
        if ( WebSocketMgrCommon.CheckIfValidJson( evt.data ) ) 
        {
            var aMsgObj = JSON.parse( evt.data );            

            //check if pong response
            if ( !that.m_cWebSocketMgr.IsPong( aMsgObj ) )
            {
                console.log( aMsgObj );

                //handle the JSON message
                if ( aMsgObj['clientId'] && aMsgObj['clientId'] != "" )
                {
                    //check the message type
                    //normal message
                    if ( aMsgObj['messageType'] == 1 )
                    {
                        that.m_cUI.DisplayMessage( aMsgObj['clientId'], aMsgObj['message'] );                        
                    }
                    //image
                    else if ( aMsgObj['messageType'] == 3 )
                    {
                        that.m_cUI.DisplayImage( aMsgObj['clientId'], aMsgObj['message'] );
                    }
                    //client list
                    else
                    {
                        that.m_cUI.DisplayUsers( aMsgObj['message'] );
                    }
                }
                else
                {
                    that.m_cUI.DisplayNotificationMessage( aMsgObj['message'] );
                }
            }
        }
        //if normal string
        else
        {
            that.m_cUI.DisplayNotificationMessage( evt.data );
        }        
    } );

    //event once a websocket connection has been established
    this.m_cWebSocketMgr.m_cSocket.onopen = function()
    {
        if ( that.m_cWebSocketMgr.m_sUserName && that.m_cWebSocketMgr.m_sUserName != '' )
        {      
            var aConnMsg = WebSocketMgrCommon.CreateConnectionMsg( that.m_cWebSocketMgr.m_sUserName );
            
            that.m_cWebSocketMgr.SendMessage( JSON.stringify( aConnMsg ) );

            //keep on pinging the server to keep the connection alive (heartbeat)
            that.m_cWebSocketMgr.StartHeartbeat();

            //hide the status messages
            that.m_cUI.HideStatus();                              
            //hide the user registration area
            that.m_cUI.ToggleUserRegisterArea( false );
            //show the chat area
            that.m_cUI.ShowWorkArea(); 
        }
        else
        {
            alert("No username provided. Closing connection...");

            that.m_cWebSocketMgr.CloseConnection();
        }       
    };     

    //event once a websocket connection has been closed
    this.m_cWebSocketMgr.m_cSocket.onclose = function()
    { 
        // websocket is closed.
        alert("Connection is closed...");

        that.m_cWebSocketMgr.StopHeartbeat();

        //hide the chat message area
        that.m_cUI.HideWorkArea();
        //show the register user area
        that.m_cUI.ToggleUserRegisterArea( true ); 
    };

    //when an error was encountered
    this.m_cWebSocketMgr.m_cSocket.onerror = function( err )
    {
        alert( "ERROR!" );
        console.log( err );
    };
};


//added by Oliver Chong - October 31, 2014
/**
 * Handle page events
 *
 * @method HandlePageEvent
 */
SocketClient.prototype.HandlePageEvent = function()
{
    var that = this;

    //set the user name
    $('#set-nickname').submit( function ( ev ) {

        that.m_cWebSocketMgr.m_sUserName = $('#nick').val();

        if ( that.m_cWebSocketMgr.m_sUserName && that.m_cWebSocketMgr.m_sUserName != '' )
        {
            //once the username is provided, start the websocket connection
            that.InitWebSocketConn();
        }

        return false;
    } );


    //send the message
    $('#send-message').submit( function ( ev ) {

        ev.preventDefault();

        //diplay on message
        that.m_cUI.DisplayMessage( 'me', $('#message').val() );
        
        //emit the message to the others
        var aMsg = WebSocketMgrCommon.FormatMsg( that.m_cWebSocketMgr.m_sUserName, 1, $('#message').val() );
        that.m_cWebSocketMgr.SendMessage( JSON.stringify( aMsg ) );

        that.m_cUI.ClearMsgInput();
        
        that.m_cUI.ScrollToLastMsg();
        
        return false;
    } );
   

    //send the image
    //reference: http://blog.marcon.me/post/31143865164/send-images-through-websockets
    $('#imagefile').bind( 'change', function ( e ) {
        //Get the first (and only one) file element
        //that is included in the original event
        var data = e.originalEvent.target.files[0];
        console.log( data );

        //read the file
        var cFileReader = new FileReader();
        cFileReader.readAsDataURL( data );

        //load the file
        cFileReader.onload = function( evt ) {
            console.log( evt );

            //Because of how the file was read,
            //evt.target.result contains the image in base64 format
            that.m_cUI.DisplayImage( 'me', evt.target.result );

            //emit the message to the others
            var aMsg = WebSocketMgrCommon.FormatMsg( that.m_cWebSocketMgr.m_sUserName, 3, evt.target.result );
            //console.log( JSON.stringify( aMsg ) );
            that.m_cWebSocketMgr.SendMessage( JSON.stringify( aMsg ) );

            that.m_cUI.ScrollToLastMsg();
        };        
    } );
};