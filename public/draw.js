////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the class that supports collaborative drawing on the canvas
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 * @reference: http://tutorialzine.com/2012/08/nodejs-drawing-game/
 */
////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 31, 2014
/**
 * This class is the container for the client state
 *
 * @class DrawClientObj
 * @constructor DrawClientObj
 * @param {unsigned} nId : the identifier of the client
 * @param {integer} nPosX : the x position
 * @param {integer} nPosY : the y position
 * @param {boolean} bIsDrawing : if true, the client is drawing
 * @param {unsigned} nLastUpdateTime : the last time the client state was updated
 */
var DrawClientObj = function( nId, nPosX, nPosY, bIsDrawing, nLastUpdateTime )
{
	this.m_nId = nId;
	this.m_nPosX = nPosX;
	this.m_nPosY = nPosY;
	this.m_nCursorPosX = nPosX;
	this.m_nCursorPosY = nPosY;
	this.m_bIsDrawing = bIsDrawing;
	this.m_nLastUpdateTime = nLastUpdateTime;
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 31, 2014
/**
 * This class handles the client-side drawing functions
 *
 * @class DrawClient
 * @constructor DrawClient
 * @param {Object} cSocketIO : the Socket IO object
 * @param {unsigned} nSocketEmitRate : how often the client socket emits to the server (in milliseconds)
 * @param {unsigned} nClientInactivityDuration : the duration of inactivity before a client is removed (in milliseconds)
 * @param {String} sCanvasId : the identifier of the canvas
 * @param {unsigned} nCanvasWidth : the canvas width
 * @param {unsigned} nCanvasHeight : the canvas height
 */
var DrawClient = function( cSocketIO, nSocketEmitRate, nClientInactivityDuration, sCanvasId, nCanvasWidth, nCanvasHeight )
{
	this.m_sCanvasId = sCanvasId;
	this.m_nCanvasWidth = nCanvasWidth;
	this.m_nCanvasHeight = nCanvasHeight;

	this.m_nSocketEmitLastTime = $.now();
	this.m_nSocketEmitRate = nSocketEmitRate;
	this.m_nClientInactivityDuration = nClientInactivityDuration;

	this.Init( cSocketIO );
};


//the client socket object
DrawClient.prototype.m_cSocket = null;

//how often the client socket emits to the server (in milliseconds)
DrawClient.prototype.m_nSocketEmitRate = 0;
//last time the client socket emitted to the server
DrawClient.prototype.m_nSocketEmitLastTime = 0;
//the duration of inactivity before a client is removed (in milliseconds)
DrawClient.prototype.m_nClientInactivityDuration = 0; 


//the canvas identifier and dimensions
DrawClient.prototype.m_sCanvasId = '';
DrawClient.prototype.m_nCanvasWidth = 0;
DrawClient.prototype.m_nCanvasHeight = 0;

//the canvas object and context
DrawClient.prototype.m_cCanvasObj = null;
DrawClient.prototype.m_cCanvasCtx = null;

//the client
DrawClient.prototype.m_cClientState = null;

//the list of clients objects drawing on the board
DrawClient.prototype.m_aClients = {};
//the list of active cursors
DrawClient.prototype.m_aCursors = {};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 31, 2014
/**
 * Initializes the class
 *
 * @method Init
 * @param {Object} cSocketIO : the Socket IO object
 */
DrawClient.prototype.Init = function( cSocketIO )
{
	//check if the browser supports the canvas
	if ( !( 'getContext' in document.createElement('canvas') ) )
	{
		alert( "Your browser does not support the canvas" );
		return false;
	}

	var that = this;

	//initialize the client socket channel
	this.m_cSocket = cSocketIO.connect( SocketObj.CHANNEL['DRAW'] );

	//initialize the canvas
	this.m_cCanvasObj = $( '#' + this.m_sCanvasId );
	this.m_cCanvasCtx = this.m_cCanvasObj[0].getContext('2d');

	//set the canvas size	
	this.m_cCanvasObj.attr( "width", this.m_nCanvasWidth );    
	this.m_cCanvasObj.attr( "height", this.m_nCanvasHeight ); 

	//Generate an unique ID
	var nClientId = Math.round( $.now() * Math.random() );

	//create the client state
	this.m_cClientState = new DrawClientObj( nClientId, 0, 0, false, 0 );

	//activate handling events
	this.HandleSocketEvent();
	this.HandlePageEvent();

	//refresh the clients at every interval
	setInterval( function() { that.RefreshClients.call( that ); }, this.m_nClientInactivityDuration );
};


//added by Oliver Chong - October 31, 2014
/**
 * Draws a line on the canvas
 *
 * @method DrawLine
 * @param {integer} nFromX : the starting x position
 * @param {integer} nFromY : the starting y position
 * @param {integer} nToX : the ending x position
 * @param {integer} nToY : the ending y position
 */
DrawClient.prototype.DrawLine = function( nFromX, nFromY, nToX, nToY )
{
	this.m_cCanvasCtx.moveTo( nFromX, nFromY );
	this.m_cCanvasCtx.lineTo( nToX, nToY );
	this.m_cCanvasCtx.stroke();
};


//added by Oliver Chong - October 31, 2014
/**
 * Refresh the clients by removing inactive clients after X seconds of inactivity
 *
 * @method RefreshClients
 */
DrawClient.prototype.RefreshClients = function()
{		
	for ( id in this.m_aClients )
	{
		//check if the client was inactive for a certain amount of time
		if (  ( $.now() - this.m_aClients[ id ].m_nLastUpdateTime ) > this.m_nClientInactivityDuration )
		{	
			//remove the client and the cursor			
			this.m_aCursors[ id ].remove();
			
			delete this.m_aCursors[ id ];
			delete this.m_aClients[ id ];
		}
	}//end loop
};


//added by Oliver Chong - October 31, 2014
/**
 * Handle socket events
 *
 * @method HandleSocketEvent
 */
DrawClient.prototype.HandleSocketEvent = function()
{
	var that = this;

	this.m_cSocket.on( 'moving_pen', function ( cClientNewState ) {
		
		var nClientId = cClientNewState.m_nId;

		if ( !( nClientId in that.m_aClients ) )
		{
			//create the cursor element
			that.m_aCursors[ nClientId ] = $('<div class="cursor">').appendTo('#cursors');
		}
		
		//move the mouse pointer
		that.m_aCursors[ nClientId ].css({
			'left' : cClientNewState.m_nCursorPosX,
			'top' : cClientNewState.m_nCursorPosY
		});

		var cClientOldState = that.m_aClients[ nClientId ];
		
		//if the user is drawing
		if ( cClientNewState.m_bIsDrawing && cClientOldState )
		{			
			//draw the line based on the old position and the new position		
			that.DrawLine( cClientOldState.m_nCursorPosX, cClientOldState.m_nCursorPosY, cClientNewState.m_nCursorPosX, cClientNewState.m_nCursorPosY );
		}
		
		//save the client state
		cClientNewState.m_nLastUpdateTime = $.now();		
		that.m_aClients[ nClientId ] = cClientNewState;
	} );
};


//added by Oliver Chong - October 31, 2014
/**
 * Handle page events
 *
 * @method HandlePageEvent
 */
DrawClient.prototype.HandlePageEvent = function()
{
	var that = this;

	//client raised the pen
	$(document).bind( 'mouseup mouseleave', function() {
		that.m_cClientState.m_bIsDrawing = false;
	} );

	//client raised the pen
	this.m_cCanvasObj.bind( 'mouseup mouseleave', function() {
		that.m_cClientState.m_bIsDrawing = false;
	} );
	
	//client pressed the pen against the paper to draw
	this.m_cCanvasObj.on( 'mousedown', function ( e ) {
		e.preventDefault();

		that.m_cClientState.m_bIsDrawing = true;

		that.m_cClientState.m_nPosX = e.pageX - $(this).offset().left;
		that.m_cClientState.m_nPosY = e.pageY - $(this).offset().top;

		//hide the instructions
		$('#instructions').fadeOut();
	} );
	
	//client is moving the pen (could either be pen up or pen down)
	this.m_cCanvasObj.on( 'mousemove', function ( e ) {

		//get the current mouse pointer position relative to the canvas
		that.m_cClientState.m_nCursorPosX = e.pageX - $(this).offset().left;
		that.m_cClientState.m_nCursorPosY = e.pageY - $(this).offset().top;

		//console.log( posX + " : " + posY );

		//control the rate at which drawing events are emitted to other clients
		if ( ( $.now() - that.m_nSocketEmitLastTime ) > that.m_nSocketEmitRate )
		{
			console.log( "emit drawing..." );

			//emit the client state to the others			
			that.m_cSocket.emit( 'draw_something', that.m_cClientState );

			//store the emit time
			that.m_nSocketEmitLastTime = $.now();
		}
		
		//if the client is currently drawing, draw the line and update the client state position
		if ( that.m_cClientState.m_bIsDrawing )
		{			
			that.DrawLine( that.m_cClientState.m_nPosX, that.m_cClientState.m_nPosY, that.m_cClientState.m_nCursorPosX, that.m_cClientState.m_nCursorPosY );
			
			//synchronize the last draw position with the current mouse position
			that.m_cClientState.m_nPosX = that.m_cClientState.m_nCursorPosX;
			that.m_cClientState.m_nPosY = that.m_cClientState.m_nCursorPosY;
		}
	} );
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var cDrawClient = null;

$( function () 
{
    //start running the client
    cDrawClient = new DrawClient( io, 50, 10000, 'drawArea', 800, 600 );
} );