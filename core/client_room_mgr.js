////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the class that will manage clients and rooms
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////



//added by Oliver Chong - October 27, 2014
/**
 * The constructor for the client/room manager
 *
 * @class ClientRoomMgr
 * @constructor ClientRoomMgr
 */
var ClientRoomMgr = function()
{
};


//the list of client socket connections
ClientRoomMgr.prototype.m_aClients = {};

//the list of rooms
ClientRoomMgr.prototype.m_aRooms = {};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//MANAGE CLIENTS


//added by Oliver Chong - October 27, 2014
/**
 * Adds the user name to the client list
 *
 * @method AddClient
 * @param {string} sKey : the key that identifies the client
 * @param {object} cData : the client data
 */
ClientRoomMgr.prototype.AddClient = function( sKey, cData )
{
    //store the registered name in the client list
    this.m_aClients[ sKey ] = cData;
};


//added by Oliver Chong - October 27, 2014
/**
 * Removes the user name from the client list
 *
 * @method RemoveClient
 * @param {string} sUsername : the user name to be removed
 */
ClientRoomMgr.prototype.RemoveClient = function( sUsername )
{
    //remove the user who disconnected from the client list
    delete this.m_aClients[ sUsername ];
};


//added by Oliver Chong - October 27, 2014
/**
 * Checks if the user name exists in the client list
 *
 * @method DoesClientExist
 * @param {string} sUsername : the user name to be verified
 * @return {boolean} : if true, the user name exists
 */
ClientRoomMgr.prototype.DoesClientExist = function( sUsername )
{
    return this.m_aClients[ sUsername ];
};


//added by Oliver Chong - October 27, 2014
/**
 * Gets the number of clients
 *
 * @method GetClientCount
 * @return {unsigned} : the number of clients
 */
ClientRoomMgr.prototype.GetClientCount = function()
{
    var nCount = 0;

    for ( var sUsername in this.m_aClients )
    {
        var cClient = this.m_aClients[ sUsername ];

        if ( typeof cClient !== 'undefined' && cClient !== null ) 
        {
            ++nCount;
        }
    }//end loop

    return nCount;
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//MANAGE CHAT ROOMS


//added by Oliver Chong - October 29, 2014
/**
 * Add the room name to the room list
 *
 * @method AddToRoomList
 * @param string {sRoomName} : the room name
 */
ClientRoomMgr.prototype.AddToRoomList = function( sRoomName )
{
    this.m_aRooms[ sRoomName ] = sRoomName;
};


//added by Oliver Chong - October 29, 2014
/**
 * Checks if the room exists
 *
 * @method DoesRoomExist
 * @param {string }sRoomName : the room name
 * @return {boolean} : if true, the room name exists in the list
 */
ClientRoomMgr.prototype.DoesRoomExist = function( sRoomName )
{
    return this.m_aRooms[ sRoomName ];
};


//added by Oliver Chong - October 29, 2014
/**
 * Refreshes the room list with the actual rooms in the channel
 *
 * @method RefreshRoomList
 * @param string cChannel : the Socket.IO namespace (socket communication channel)
 */
ClientRoomMgr.prototype.RefreshRoomList = function( cChannel )
{
    //go through the room list
    for ( var sRoomName in this.m_aRooms )
    {
        //go though the list of active rooms in the channel
        for ( var sKey in cChannel.adapter.rooms )
        {
            //if the room is found
            if ( sRoomName == sKey )
            {
                //console.log( "match : " + sRoomName );

                var cRoom = cChannel.adapter.rooms[ sKey ];
                //console.log( cRoom );

                var bIsRoomEmpty = true;
                //check if the room is empty
                for ( var cUserSocket in cRoom )
                {
                    //console.log( cUserSocket );
                    if ( cUserSocket )
                    {
                        bIsRoomEmpty = false;
                        break;
                    }               
                }//end loop

                if ( bIsRoomEmpty )
                {
                    delete this.m_aRooms[ sRoomName ]; 
                }
            }
        }//end loop
    }//end loop
};


////////////////////////////////////////////////////////////////////////////////////////


if ( typeof( module ) !== 'undefined' )
{
    //export (or "expose") the internally scoped functions
    module.exports = ClientRoomMgr;
}