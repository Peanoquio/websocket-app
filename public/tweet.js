////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the class that supports displaying tweets on the page
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 * @reference: http://www.kdelemme.com/2014/04/24/use-socket-io-to-stream-tweets-between-nodejs-and-angularjs/
 */
////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - November 3, 2014
/**
 * This class handles the client-side tweet functions
 *
 * @class TweetClient
 * @constructor TweetClient
 * @param {Object} cSocketIO : the Socket IO object
 */
var TweetClient = function( cSocketIO )
{
	//initialize the client socket channel
	this.m_cSocket = cSocketIO.connect( SocketObj.CHANNEL['TWIT'] );

	//activate handling events
	this.HandleSocketEvent();
	this.HandlePageEvent();

	/*
	//for testing only
	var cTweetMsg = {};
	    cTweetMsg.text = "hi there";
	    cTweetMsg.location = "SG";
	    cTweetMsg.user = {
	        name: "ORC",
            nick: "Pea",
	        image: "http://pbs.twimg.com/profile_images/506104767072849920/SFFb4Qcs_normal.jpeg"
	    };

	for ( var i = 0; i < 3; ++i )
	{
		this.DisplayTweets( cTweetMsg );
	}
	*/
};


//the client socket object
TweetClient.prototype.m_cSocket = null;


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - November 3, 2014
/**
 * Handle socket events
 *
 * @method HandleSocketEvent
 */
TweetClient.prototype.HandleSocketEvent = function()
{
	var that = this;

	this.m_cSocket.on( 'connect', function() { 
		console.log( "tweet client connected!" );	
	} );	

	//whenever a tweet is received
	this.m_cSocket.on( 'tweets', function ( aTweets ) {
		console.log( aTweets );

		for ( var nKey in aTweets )
		{
			//console.log( aTweets[ nKey ] );
			that.DisplayTweets( aTweets[ nKey ] );		    
		}//end loop
	} );
};


//added by Oliver Chong - November 23, 2014
/**
 * Display the tweet
 *
 * @method DisplayTweets
 * @param {Object} cTweet : the object containing the details of the tweet
 */
TweetClient.prototype.DisplayTweets = function( cTweet )
{
	console.log( "---------------------------- DisplayTweets" );
	console.log( cTweet );

	if ( cTweet )
	{
		var cTweetContainerElem = document.createElement( "div" );
		cTweetContainerElem.setAttribute( "class", "tweet_container" );

		//the Twitter user portrait image
		var cUserPortraitElem = document.createElement( "img" );
		cUserPortraitElem.setAttribute( "class", "user_portrait" );
		cUserPortraitElem.setAttribute( "src", cTweet.user.image );

		//the Twitter user name
		var cUserNameElem = document.createElement( "span" );
		cUserNameElem.setAttribute( "class", "user_name" );
		cUserNameElem.innerHTML = cTweet.user.name;

		//the user Twitter nick
		var cUserNickElem = document.createElement( "span" );
		cUserNickElem.setAttribute( "class", "user_nick" );
		cUserNickElem.innerHTML = '@' + cTweet.user.nick;

		//the location from where the user made the tweet
		var cUserLocationElem = null;
		if ( typeof( cTweet.location ) !== "undefined" && cTweet.location !== "" && cTweet.location != null )
		{
			cUserLocationElem = document.createElement( "span" );
			cUserLocationElem.setAttribute( "class", "user_location" );
			cUserLocationElem.innerHTML = '(' + cTweet.location + ')';
		}

		//the tweet message
		var cUserTweetElem = document.createElement( "span" );
		cUserTweetElem.setAttribute( "class", "user_tweet" );
		cUserTweetElem.innerHTML = cTweet.text;

		cTweetContainerElem.appendChild( cUserPortraitElem );
		cTweetContainerElem.appendChild( cUserNameElem );
		cTweetContainerElem.appendChild( cUserNickElem );		
		cTweetContainerElem.appendChild( cUserTweetElem );
		if ( cUserLocationElem )
		{
			cTweetContainerElem.appendChild( cUserLocationElem );
		}

		var cTweetsListElem = document.getElementById( "tweets" );

		//cTweetsListElem.appendChild( cTweetContainerElem );
		cTweetsListElem.insertBefore( cTweetContainerElem, cTweetsListElem.childNodes[0] );
	}
};


//added by Oliver Chong - November 23, 2014
/**
 * Handles the page events
 *
 * @method HandlePageEvent
 */
TweetClient.prototype.HandlePageEvent = function()
{
	var that = this;

    $('#startStream').bind( 'click', function( e ) {
        var sFilter = $('#filterStream').val();

        if ( sFilter == null || sFilter.trim() == '' )
        {
        	alert( "Please enter valid search parameters." );
        }
        else
        {
        	//start the Twitter stream based on the provided filter parameters
        	var aFilterParams = sFilter.split(',');
        	that.m_cSocket.emit( 'start_stream', aFilterParams );
    	}
    } );

    $('#stopStream').bind( 'click', function( e ) {
    	//stop the Twitter stream
        that.m_cSocket.emit( 'stop_stream', '' );
    } );
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var cTweetClient = null;

$( function () 
{
    //start running the client
    cTweetClient = new TweetClient( io ); 
} );