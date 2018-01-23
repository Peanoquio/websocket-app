////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the class that supports chatting on the client-side
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 31, 2014
/**
 * This class handles the client-side drawing functions
 *
 * @class ChatClient
 * @constructor ChatClient
 * @param {Object} cSocketIO : the Socket IO object
 */
var ChatClient = function( cSocketIO )
{
    this.Init( cSocketIO );
};


//the client socket object
ChatClient.prototype.m_cSocket = null;

//the user interface class
ChatClient.prototype.m_cUI = null;


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 31, 2014
/**
 * Initializes the class
 *
 * @method Init
 * @param {Object} cSocketIO : the Socket IO object
 */
ChatClient.prototype.Init = function( cSocketIO )
{
    //initialize the client socket channel
    this.m_cSocket = cSocketIO.connect( SocketObj.CHANNEL['CHAT'] );

    //initialize the user interface manager
    this.m_cUI = new CollabUI();

    //activate handling events
    this.HandleSocketEvent();
    this.HandlePageEvent();
};


//added by Oliver Chong - October 31, 2014
/**
 * Handle socket events
 *
 * @method HandleSocketEvent
 */
ChatClient.prototype.HandleSocketEvent = function()
{
    var that = this;

    //open a new connection
    this.m_cSocket.on('connect', function () {
        $('#chatArea').addClass('connected');
    } );

    //once reconnected to the server
    this.m_cSocket.on( 'reconnect', function () {
        //$('#lines').remove();
        //hide the chat message area
        that.m_cUI.HideWorkArea();
        //show the register user area
        that.m_cUI.ToggleUserRegisterArea( true );   

        console.log( 'Reconnected to the server' );
        that.m_cUI.DisplayStatus('System', 'Reconnected to the server');
    } );

    //when trying to reconnect to the server
    this.m_cSocket.on( 'reconnecting', function () {
        console.log( 'Attempting to re-connect to the server' );
        that.m_cUI.DisplayStatus('System', 'Attempting to re-connect to the server');
    }) ;

    //upon receiving a server error
    this.m_cSocket.on( 'error', function ( e ) {
        console.log( 'error : ' + e );
        that.m_cUI.DisplayStatus('System', e ? e : 'A unknown error occurred');
    } );

    //upon receiving general chat notifications
    this.m_cSocket.on( 'notification', function ( sMsg ) {
        that.m_cUI.DisplayNotificationMessage( sMsg );
    } );

    //upon receiving a chat messafe
    this.m_cSocket.on( 'chat_message', function( sMsg ) { 
        var aMsgObj = JSON.parse( sMsg );
        that.m_cUI.DisplayMessage( aMsgObj['sender'], aMsgObj['msg'] );
    } );

    //upon receiving an image
    this.m_cSocket.on( 'user_image', function( sMsg ) { 
        var aMsgObj = JSON.parse( sMsg );
        that.m_cUI.DisplayImage( aMsgObj['sender'], aMsgObj['msg'] );
    } );

    //refresh the room list
    this.m_cSocket.on( 'rooms', function ( aRooms ) { 
        console.log( aRooms );   

        //apart from the list of rooms, pass the socket context, function and parameter to broadcast a notification if a user joined the room
        that.m_cUI.DisplayRooms( aRooms, that.m_cSocket, that.m_cSocket.emit, 'join_room' ); 
    } );

    //refresh the list of users
    this.m_cSocket.on( 'users', function ( aUsers ) {
        console.log( aUsers );

        that.m_cUI.DisplayUsers( aUsers );
    } );    

};


//added by Oliver Chong - October 31, 2014
/**
 * Handle page events
 *
 * @method HandlePageEvent
 */
ChatClient.prototype.HandlePageEvent = function()
{
    var that = this;

    //set the user name
    $('#set-nickname').submit( function ( ev ) {
        that.m_cSocket.emit( 'register', $('#nick').val(), function ( bNameExists ) {
            //if new user
            if ( !bNameExists ) 
            {
                //hide the status messages
                that.m_cUI.HideStatus();                              
                //hide the user registration area
                that.m_cUI.ToggleUserRegisterArea( false );
                //show the chat area
                that.m_cUI.ShowWorkArea();  

                return true;
            }
            else
            {
                $('#nickname-err').css('visibility', 'visible');  
            }          
        } );

        return false;
    } );


    //create a room
    $('#createRoom').bind( 'click', function( e ) {
        var sCurrRoom = $('#roomName').val();

        that.m_cSocket.emit( 'join_room', sCurrRoom );

        var bShowCreateRoomArea = ( sCurrRoom == SocketObj.DEFAULT_ROOM );
        that.m_cUI.ToggleRoomArea( bShowCreateRoomArea, sCurrRoom );

        that.m_cUI.DisplayNotificationMessage( "You have created and joined the room : " + sCurrRoom );
    } );


    //leave a room
    $('#leaveRoom').bind( 'click', function( e ) {
        var sCurrRoom = $('#currentRoom').text();

        that.m_cSocket.emit( 'leave_room', sCurrRoom );

        that.m_cUI.ToggleRoomArea( true, '' );

        that.m_cUI.DisplayNotificationMessage( "You have left the room : " + sCurrRoom );        
    } );    


    //send the message
    $('#send-message').submit( function () {
        //diplay on message
        that.m_cUI.DisplayMessage( 'me', $('#message').val() );
        
        //emit the message to the others
        that.m_cSocket.emit( 'chat_message', $('#message').val(), function ( sMsg ) {
            console.log( sMsg );
        } );

        that.m_cUI.ClearMsgInput();
        
        that.m_cUI.ScrollToLastMsg();
        
        return false;
    } );
   

    //send the image
    //reference: http://blog.marcon.me/post/31143865164/send-images-through-websockets
    $('#imagefile').bind( 'change', function( e ) {
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
            that.m_cSocket.emit( 'user_image', evt.target.result );

            that.m_cUI.ScrollToLastMsg();
        };        
    } );
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var cChatClient = null;

$( function () 
{
    //start running the client
    cChatClient = new ChatClient( io );
} );