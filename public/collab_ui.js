////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the class that manages the user interface for the collaboration application
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 31, 2014
/**
 * This class handles the user interface of the page
 *
 * @class CollabUI
 * @constructor CollabUI
 */
var CollabUI = function()
{    
};


//added by Oliver Chong - October 31, 2014
/**
 * Hides status messages (example: system messages that shows reconnecting to server message)
 *
 * @method HideStatus
 */
CollabUI.prototype.HideStatus = function()
{
    $('#status').css('display', 'none');  
};


//added by Oliver Chong - October 31, 2014
/**
 * Shows status messages (example: system messages that shows reconnecting to server message)
 *
 * @method DisplayStatus
 * @param {string} sFrom : the sender of the message
 * @param {string} sMsg : the message text
 */
CollabUI.prototype.DisplayStatus = function( sFrom, sMsg ) 
{
    $('#status').css('display', 'block');  
    $('#status').append( $('<p>').append( $('<b>').text( sFrom ), ( ' ' + sMsg ) ) );
};


//added by Oliver Chong - October 31, 2014
/**
 * Shows chat messages
 *
 * @method DisplayMessage
 * @param {string} sFrom : the sender of the message
 * @param {string} sMsg : the message text
 */
CollabUI.prototype.DisplayMessage = function( sFrom, sMsg ) 
{
    $('#lines').append( $('<p>').append( $('<b>').text( sFrom ), sMsg ) );
};


//added by Oliver Chong - October 31, 2014
/**
 * Shows chat notification messages (example: a user has joined the room)
 *
 * @method DisplayNotificationMessage
 * @param {string} sMsg : the message text
 */
CollabUI.prototype.DisplayNotificationMessage = function( sMsg )
{
    $('#lines').append( $('<p>').append( $('<em>').text( sMsg ) ) );
};


//added by Oliver Chong - October 31, 2014
/**
 * Shows the image sent by a user
 *
 * @method DisplayImage
 * @param {string} sFrom : the sender of the message
 * @param {string} sBase64Image : the base64 encoded message that represents the binary image data
 */
CollabUI.prototype.DisplayImage = function( sFrom, sBase64Image ) 
{
    $('#lines').append( $('<p>').append( $('<b>').text( sFrom ), '<img src="' + sBase64Image + '"/>') );
};


//added by Oliver Chong - October 31, 2014
/**
 * Shows the work/collaboration area
 *
 * @method ShowWorkArea
 */
CollabUI.prototype.ShowWorkArea = function()
{
    $('#send-message').css('display', 'block');    
    $('#messages').css('display', 'block');
    $('#roomArea').css('display', 'block');
    $('#drawingBoard').css('display', 'block'); 
    $('#twitBoard').css('display', 'block');    

    this.ClearMsgInput();
};


//added by Oliver Chong - October 31, 2014
/**
 * Hides the work/collaboration area
 *
 * @method HideWorkArea
 */
CollabUI.prototype.HideWorkArea = function()
{    
    $('#send-message').css('display', 'none');    
    $('#messages').css('display', 'none');
    $('#roomArea').css('display', 'none');
    $('#drawingBoard').css('display', 'none');
    $('#twitBoard').css('display', 'none');  

    this.ClearMsgInput();
};


//added by Oliver Chong - October 31, 2014
/**
 * Toggles the display of the room panel
 *
 * @method ToggleRoomArea
 * @param {boolean} bShowCreateRoomArea : if true, show the room creation mode otherwise show the leave room mode
 * @param {string} sCurrRoom : the current room that the user is in
 */
CollabUI.prototype.ToggleRoomArea = function( bShowCreateRoomArea, sCurrRoom )
{
    if ( bShowCreateRoomArea )
    {
        $('#createRoomArea').css('display', 'block');
        $('#leaveRoomArea').css('display', 'none');
        $('#currentRoom').html( '' );
        $('#roomName').val( '' );
    }
    else
    {
        $('#createRoomArea').css('display', 'none');
        $('#leaveRoomArea').css('display', 'block');
        $('#currentRoom').html( sCurrRoom );
        $('#roomName').val( '' );
    }
};


//added by Oliver Chong - October 31, 2014
/**
 * Toggles the display of the registration/login panel
 *
 * @method ToggleUserRegisterArea
 * @param {boolean} bShow : if true, show the room creation mode otherwise show the leave room mode
 */
CollabUI.prototype.ToggleUserRegisterArea = function( bShow )
{
    if ( bShow )
    {
        $('#chatArea').removeClass('nickname-set');
    }
    else
    {        
        $('#chatArea').addClass('nickname-set');
    }

    this.ClearUsernameInput();
};


//added by Oliver Chong - October 31, 2014
/**
 * Clears the chat message input field
 *
 * @method ClearMsgInput
 */
CollabUI.prototype.ClearMsgInput = function() 
{
    $('#message').val('').focus();
};


//added by Oliver Chong - October 31, 2014
/**
 * Clears the user name input field
 *
 * @method ClearUsernameInput
 */
CollabUI.prototype.ClearUsernameInput = function() 
{
    $('#nick').val('').focus();
};


//added by Oliver Chong - October 31, 2014
/**
 * Scrolls to the end of the chat message panel so the user can see the newest posted message
 *
 * @method ScrollToLastMsg
 */
CollabUI.prototype.ScrollToLastMsg = function()
{
    $('#lines').get(0).scrollTop = 10000000;
};


//added by Oliver Chong - October 31, 2014
/**
 * Display the list of users who has logged in to the work area
 *
 * @method DisplayUsers
 * @param {array} aUsers : the list of user names
 */
CollabUI.prototype.DisplayUsers = function( aUsers )
{
    $('#nicknames').empty().append( $('<span>Online: </span>') );
        
    for ( var i in aUsers ) 
    {
        $('#nicknames').append( $('<b>').text( aUsers[i] ) );
    }//end loop
};


//added by Oliver Chong - October 31, 2014
/**
 * Display the list of available rooms that users can either join or leave
 *
 * @method DisplayRooms
 * @param {array} aRooms : the list of room names
 * @param {object} cSocketCtx : the context of the Socket.IO socket object
 * @param {function} cSocketFunc : the Socket.IO socket function to invoke
 * @param {string} sSocketParam : the parameter to be passed to the Socket.IO socket function
 */
CollabUI.prototype.DisplayRooms = function( aRooms, cSocketCtx, cSocketFunc, sSocketParam )
{
    var that = this;

    $('#rooms').empty().append( $('<span>Rooms: </span>') ).append( '<br>' );
        
    for ( var i in aRooms ) 
    {
        var sRoomName = aRooms[i];

        $('#rooms').append( $('<span id="' + sRoomName + '">').html( '<b>' + sRoomName + '</b>' ) ).append( '<br>' );

        //used closure to be able to pass unique parameters when binding events
        $('#rooms #' + sRoomName).unbind( 'click' ).bind( 'click', ( function ( sRoomName ) {
 
            return function() {

                if ( typeof( cSocketFunc ) === "function" )
                {
                    //execute the provided socket related function                
                    cSocketFunc.apply( cSocketCtx, [ sSocketParam, sRoomName ] );
                }

                var bShowCreateRoomArea = ( sRoomName == SocketObj.DEFAULT_ROOM );
                that.ToggleRoomArea( bShowCreateRoomArea, sRoomName );

                that.DisplayNotificationMessage( "You have joined the room : " + sRoomName );
            };
            
        } )( sRoomName ) //pass the room name to the closure function
        );
    }//end loop
};