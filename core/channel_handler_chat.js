////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the class that will manage chat channel events
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 27, 2014
/**
 * The constructor for the chat channel handler
 *
 * @class ChannelHandlerChat
 * @constructor ChannelHandlerChat
 */
var ChannelHandlerChat = function()
{
};


//added by Oliver Chong - October 27, 2014
/**
 * Listens and handles the events in the channel
 *
 * @method Listen
 * @param {object} cChatChannel : the Socket.IO namespace (chat communication channel)
 * @param {object} cClientRoomMgr : the client and room manager class
 * @param {string} sDefaultRoom : the name of the default room
 */
ChannelHandlerChat.Listen = function( cChatChannel, cClientRoomMgr, sDefaultRoom )
{
	//handle websocket requests upon successful connection
    cChatChannel.on( 'connection', function ( socket ) { 

        console.log( "A user connected to the chat channel" );
        //console.log( that.m_cSocketIO );

        //handle registering new users
        socket.on( 'register', function ( sUsername, fCallback ) {
            console.log( 'A user is registering... ' + sUsername ); 

            //check if the usernamen already exists
            if ( cClientRoomMgr.DoesClientExist( sUsername ) )
            {
                //callback function
                fCallback( true );
            }
            else
            {
                fCallback( false );

                //store the registered name in the client list
                cClientRoomMgr.AddClient( sUsername, sUsername );
                //add the custom variable to store the name
                socket.custom_nickname = sUsername;

                //add the person to the default room
                socket.join( sDefaultRoom );
                socket.custom_curr_room = sDefaultRoom;

                //broadcast to the others about this new user joining
                socket.broadcast.emit( 'notification', sUsername + ' is online.' );

                //broadcast the updated list of users to everyone
                cChatChannel.emit( 'users', cClientRoomMgr.m_aClients );

                //broadcast the updated list of rooms to everyone
                //var aMsg = { roomList: that.m_aRooms, currentRoom: socket.custom_curr_room };
                cChatChannel.emit( 'rooms', cClientRoomMgr.m_aRooms );
            }
        } );        


        //handle users who disconnects
        socket.on( 'disconnect', function() {     
            
            //console.log( socket );

            if ( !socket.custom_nickname )
            {
                console.log( 'A user disconnected...' );                
            }
            else
            {
                console.log( 'A user disconnected... ' + socket.custom_nickname ); 

                //remove the user who disconnected from the client list
                cClientRoomMgr.RemoveClient( socket.custom_nickname );

                //broadcast to the others about this user leaving
                socket.broadcast.emit( 'notification', socket.custom_nickname  + ' has logged off...' );

                //broadcast the updated list of users to everyone
                cChatChannel.emit( 'users', cClientRoomMgr.m_aClients );
            }
        } );     


        //handle chat messages
        socket.on( 'chat_message', function ( sMsg, fn ) {
            console.log( 'message: ' + sMsg ); 
            fn( "Your message has been successfully sent : " + sMsg );

            var aMsgObj = { sender: socket.custom_nickname, msg: sMsg };

            socket.broadcast.to( socket.custom_curr_room ).emit( 'chat_message', JSON.stringify( aMsgObj ) );
        } );  


        //handle images
        socket.on( 'user_image', function ( sBase64Image ) { 
            console.log( sBase64Image );

            var aMsgObj = { sender: socket.custom_nickname, msg: sBase64Image };

            socket.broadcast.to( socket.custom_curr_room ).emit( 'user_image', JSON.stringify( aMsgObj ) );
        } );


        //handle joining rooms
        socket.on( 'join_room', function ( sRoomName ) { 

            console.log( socket.custom_nickname + " is joining room : " + sRoomName );
            
            //check if the room exists
            if ( !cClientRoomMgr.DoesRoomExist( sRoomName ) )
            {
                //add the room name to the room list
                cClientRoomMgr.AddToRoomList( sRoomName );

                //broadcast to others that a new room has been created
                socket.broadcast.emit( 'notification', "A new room (" + sRoomName + ") has been created by " + socket.custom_nickname );                
            }
            
            //this is to make sure that a person can only be in one room at a time
            //leave the room that the socket is currently in and if not the same room
            if ( typeof( socket.custom_curr_room ) !== 'undefined' && socket.custom_curr_room != sRoomName )
            {
                console.log( socket.custom_nickname + " will leave old room : " + socket.custom_curr_room );
                socket.leave( socket.custom_curr_room );    

                //inform the people in the same room that a person left
                socket.broadcast.to( socket.custom_curr_room ).emit( 'notification', socket.custom_nickname + " has left the room : " + socket.custom_curr_room );            
            }     

            //join the room
            socket.join( sRoomName );
            //set the custom variable to store the current room the player is in
            socket.custom_curr_room = sRoomName;

            //inform the people in the same room that a new person joined
            socket.broadcast.to( sRoomName ).emit( 'notification', socket.custom_nickname + " has joined the room." );

            //refresh the room list
            cClientRoomMgr.RefreshRoomList( cChatChannel );
            //broadcast the updated list of rooms to everyone
            //var aMsg = { roomList: that.m_aRooms, currentRoom: SocketObj.DEFAULT_ROOM };
            cChatChannel.emit( 'rooms', cClientRoomMgr.m_aRooms );

            console.log( cChatChannel.adapter.rooms );
        } );


        //handle leaving rooms
        socket.on( 'leave_room', function ( sRoomName ) { 
            //leave the room
            socket.leave( sRoomName );

            //inform the people in the same room that a person left
            socket.broadcast.to( sRoomName ).emit( 'notification', socket.custom_nickname + " has left the room : " + sRoomName );

            //return the person to the default room
            socket.join( sDefaultRoom );
            socket.custom_curr_room = sDefaultRoom;

            //refresh the room list
            cClientRoomMgr.RefreshRoomList( cChatChannel );
            //broadcast the updated list of rooms to everyone
            //var aMsg = { roomList: that.m_aRooms, currentRoom: socket.custom_curr_room };
            cChatChannel.emit( 'rooms', cClientRoomMgr.m_aRooms );
        } );

    } );
};



////////////////////////////////////////////////////////////////////////////////////////


if ( typeof( module ) !== 'undefined' )
{
    //export (or "expose") the internally scoped functions
    module.exports = ChannelHandlerChat;
}