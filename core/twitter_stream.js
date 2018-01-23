////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the Twitter stream class
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 * @reference: http://www.kdelemme.com/2014/04/24/use-socket-io-to-stream-tweets-between-nodejs-and-angularjs/
 *             http://codetheory.in/how-to-use-twitter-oauth-with-node-oauth-in-your-node-js-express-application/
 */
////////////////////////////////////////////////////////////////////////////////////////


var g_aTwitterLib = {
    TWIT: 'twit',
    NTWITTER: 'ntwitter'
};

var g_sCurrTwitterLib = g_aTwitterLib.TWIT;


//the Twitter API
var g_cTwit = require( g_sCurrTwitterLib );


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - November 3, 2014
/**
 * This class for the Twit handler
 *
 * @class TwitHandler
 * @constructor TwitHandler
 * @param {Object} cSocketChannel : the Socket IO channel
 * @param {unsigned} nTweetsBufferSize : the size of buffer containing tweets before it get flushed
 */
var TwitHandler = function( cSocketChannel, nTweetsBufferSize )
{
    this.m_cSocketChannel = cSocketChannel;
	this.m_nTweetsBufferSize = nTweetsBufferSize;

	this.Init();
};


//the instance of the Twit class from the Twit library
TwitHandler.prototype.m_cTwit = null;

//the Twit stream
TwitHandler.prototype.m_cStream = null;

//contain the tweets in a list
TwitHandler.prototype.m_aTweetsBuffer = [];
//the size of buffer containing tweets before it get flushed
TwitHandler.prototype.m_nTweetsBufferSize = 0;

//the sockt channel
TwitHandler.prototype.m_cSocketChannel = null;


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - November 3, 2014
/**
 * Initializes the class
 *
 * @method Init
 */
TwitHandler.prototype.Init = function()
{
    //this is needed to access the Twitter application
    //you need to create your Twitter application in https://apps.twitter.com/
    var sConsumerKey = '';
    var sConsumerSecret = '';
    var sAccessTokenKey = '';
    var sAccessTokenSecret = '';
    
    switch( g_sCurrTwitterLib )
    {
        case g_aTwitterLib.TWIT:
            this.m_cTwit = new g_cTwit( {
                consumer_key:         sConsumerKey,
                consumer_secret:      sConsumerSecret,
                access_token:         sAccessTokenKey,
                access_token_secret:  sAccessTokenSecret
            } );
            break;

        case g_aTwitterLib.NTWITTER:
            this.m_cTwit = new g_cTwit( {
                consumer_key:         sConsumerKey,
                consumer_secret:      sConsumerSecret,
                access_token_key:     sAccessTokenKey,
                access_token_secret:  sAccessTokenSecret
            } );
            break;
    }	

    //console.log( "Twitter class ==============================" );
    //console.log( this.m_cTwit );
};


//added by Oliver Chong - November 3, 2014
/**
 * Filters the Twitter stream based on search parameters
 *
 * @method FilterStream
 * @param {array} aFilterParams : the array that contains the parameters to filter the Twitter stream
 */
TwitHandler.prototype.FilterStream = function( aFilterParams )
{
    var that = this;

    console.log( "------------------- FilterStream" );
    console.log( aFilterParams );        

    var aFilter = {};   
    aFilter['track'] = aFilterParams;

    //var aFilter = { locations: [ '-122.75', '36.8', '-121.75', '37.8' ] }; //San Francisco coordinates
    //var aFilter = { track: ['love', 'hate'] };

    switch ( g_sCurrTwitterLib )
    {
        case g_aTwitterLib.TWIT:
            this.m_cStream = this.m_cTwit.stream( 'statuses/filter', aFilter );
            break;

        case g_aTwitterLib.NTWITTER:
            this.m_cTwit.stream( 'statuses/filter', aFilter, function ( cStream ) { 
                that.HandleStreamNwtwitter( cStream ); 
            } );
            break;
    }

    //console.log( "Twitter stream object ==============================" );
    //console.log( this.m_cStream );

    this.HandleStream();
};


//added by Oliver Chong - November 3, 2014
/**
 * Starts the Twitter stream
 *
 * @method StartStream
 */
TwitHandler.prototype.StartStream = function()
{
    if ( g_sCurrTwitterLib == g_aTwitterLib.TWIT && this.m_cStream )
    {
        this.m_cStream.start();
    }
};


//added by Oliver Chong - November 3, 2014
/**
 * Stops the Twitter stream
 *
 * @method StopStream
 */
TwitHandler.prototype.StopStream = function()
{
    if ( g_sCurrTwitterLib == g_aTwitterLib.TWIT && this.m_cStream )
    {
        this.m_cStream.stop();
    }
};


//added by Oliver Chong - November 4, 2014
/**
 * Handles the Twitter stream and emits the tweets through the socket
 *
 * @method HandleStream
 */
TwitHandler.prototype.HandleStream = function()
{
    switch ( g_sCurrTwitterLib )
    {
        case g_aTwitterLib.TWIT:
            this.HandleStreamTwit();
            break;
    }
}


//added by Oliver Chong - November 4, 2014
/**
 * Handles the Twitter stream and emits the tweets through the socket (twit library)
 *
 * @method HandleStreamTwit
 */
TwitHandler.prototype.HandleStreamNwtwitter = function( cStream )
{
    var that = this;

    cStream.on( 'data', function ( data ) { 
        console.log( "tweeting..." );
        console.log( data );

        //push msg into buffer
        that.m_aTweetsBuffer.push( data );
     
        //send buffer only if full
        if ( that.m_aTweetsBuffer.length >= that.m_nTweetsBufferSize ) 
        {
            console.log( "tweets are coming!!!" );
            //console.log( that.m_aTweetsBuffer );

            //broadcast tweets
            that.m_cSocketChannel.emit( 'tweets', that.m_aTweetsBuffer );
            that.m_aTweetsBuffer = [];
        }
    } );
};


//added by Oliver Chong - November 4, 2014
/**
 * Handles the Twitter stream and emits the tweets through the socket (twit library)
 *
 * @method HandleStreamTwit
 */
TwitHandler.prototype.HandleStreamTwit = function()
{
    if ( this.m_cStream )
    {
    	var that = this;

    	this.m_cStream.on( 'connect', function ( request ) {
        	console.log('Connecting to Twitter API -------------------------------------------------------');
            //console.log( request );
    	} );

        this.m_cStream.on( 'connected', function ( response ) {
            console.log('Connected to Twitter API!!! -------------------------------------------------------');
            //console.log( response );
        } );
    	 
    	this.m_cStream.on( 'disconnect', function ( message ) {
    	    console.log('Disconnected from Twitter API. Message: ' + message);
    	} );
    	 
    	this.m_cStream.on( 'reconnect', function ( request, response, connectInterval ) {
    	  console.log('Trying to reconnect to Twitter API in ' + connectInterval + ' ms');
    	} );

        this.m_cStream.on( 'error', function ( err ) {
            console.log( err );
        } );

        //if there is a tweet
    	this.m_cStream.on( 'tweet', function( tweet ) {
            console.log( "tweeting..." );
            console.log( tweet );

            if ( tweet /*&& tweet.user && tweet.place*/ )
            {
                //console.log( tweet );
        	     
        	    //Create message containing tweet + username + profile pic + location
        	    var cTweetMsg = {};
        	    cTweetMsg.text = tweet.text;
        	    cTweetMsg.location = tweet.place ? tweet.place.full_name : "";
        	    cTweetMsg.user = {
        	        name: tweet.user.name,
                    nick: tweet.user.screen_name,
        	        image: tweet.user.profile_image_url
        	    };
        	 
        	    //push msg into buffer
        	    that.m_aTweetsBuffer.push( cTweetMsg );
        	 
        	    //send buffer only if full
        	    if ( that.m_aTweetsBuffer.length >= that.m_nTweetsBufferSize ) 
        	    {
                    console.log( "tweets are coming!!!" );
                    //console.log( that.m_aTweetsBuffer );

        	        //broadcast tweets
        	        that.m_cSocketChannel.emit( 'tweets', that.m_aTweetsBuffer );
        	        that.m_aTweetsBuffer = [];
        	    }
            }
    	} );
    }
}


////////////////////////////////////////////////////////////////////////////////////////


if ( typeof( module ) !== 'undefined' )
{
    //export (or "expose") the internally scoped functions
    module.exports = TwitHandler;
}