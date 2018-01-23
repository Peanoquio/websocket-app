////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the class that will manage draw channel events
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 31, 2014
/**
 * The constructor for the draw channel handler
 *
 * @class ChannelHandlerDraw
 * @constructor ChannelHandlerDraw
 */
var ChannelHandlerDraw = function()
{
};


//added by Oliver Chong - October 31, 2014
/**
 * Listens and handles the events in the channel
 *
 * @method Listen
 * @param {object} cTwitChannel : the Socket.IO namespace (draw communication channel)
 */
ChannelHandlerDraw.Listen = function( cDrawChannel )
{
	cDrawChannel.on( 'connection', function ( socket ) { 

        console.log( "A user connected to the draw channel" );

        //once the person is drawing something, broadcast the data to all the others
        socket.on( 'draw_something', function ( data ) { 
            //console.log( "draw something..." );
            //console.log( data );
            socket.broadcast.emit( 'moving_pen', data );
        } );
    } );
};


////////////////////////////////////////////////////////////////////////////////////////


if ( typeof( module ) !== 'undefined' )
{
    //export (or "expose") the internally scoped functions
    module.exports = ChannelHandlerDraw;
}