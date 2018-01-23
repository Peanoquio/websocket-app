////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the class that will manage Twitter channel events
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - November 3, 2014
/**
 * The constructor for the Twitter channel handler
 *
 * @class ChannelHandlerTwitter
 * @constructor ChannelHandlerTwitter
 */
var ChannelHandlerTwitter = function()
{
};


//added by Oliver Chong - November 3, 2014
/**
 * Listens and handles the events in the channel
 *
 * @method Listen
 * @param {object} cTwitChannel : the Socket.IO namespace (Twitter communication channel)
 * @param {object} cTwitterHandler : the class that supports connecting and streaming through Twitter
 * @param {unsigned} nClientCnt : the number of connected clients
 */
ChannelHandlerTwitter.Listen = function( cTwitChannel, cTwitterHandler, nClientCnt )
{
	cTwitChannel.on( 'connection', function ( socket ) {

        console.log( "A user connected to the Twitter channel" );
        
        //start streaming upon the very first connection
        /*
        if ( that.GetClientCount() == 1 )
        {
            console.log('First active client. Start streaming from Twitter');
            cTwitterHandler.StartStream();
        } 
        */       
     
        socket.on( 'disconnect', function() {
            console.log('Client disconnected !');
     
            //stop streaming once there is no more users connected to the channel
            if ( nClientCnt == 0 )
            {
                console.log("No active client. Stop streaming from Twitter");
                cTwitterHandler.StopStream();
            }
        } );

        socket.on( 'start_stream', function( aFilter ) { 
            console.log( "Start the Twitter stream..." );
            //cTwitterHandler.StartStream();
            cTwitterHandler.FilterStream( aFilter );
        } );

        socket.on( 'stop_stream', function() { 
            console.log( "Stop the Twitter stream..." );
            cTwitterHandler.StopStream();
        } );
    } );
};


////////////////////////////////////////////////////////////////////////////////////////


if ( typeof( module ) !== 'undefined' )
{
    //export (or "expose") the internally scoped functions
    module.exports = ChannelHandlerTwitter;
}