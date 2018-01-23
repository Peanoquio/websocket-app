////////////////////////////////////////////////////////////////////////////////////////
/**
 * This is the websocket packet class
 *
 * @author Oliver Ryan Chong
 * @version 1.0
 */
////////////////////////////////////////////////////////////////////////////////////////


//added by Oliver Chong - October 2, 2014
/**
 * The constructor for the data packet
 * @param bit nFIN : if the value is 1, it signifies the end of the message
 * @param bit nOpCode : this determines how to interpret the payload data (refer to Packet.OP_CODE_ARR)
 * @param bit nMask : if 1, the payload data is masked
 */
var Packet = function( nFIN, nOpCode, nMask )
{
    this.m_nFIN = nFIN;
    this.m_nOpCode = nOpCode;
    this.m_nMask = nMask;
    this.m_aMaskingKey = [];
    this.m_nPayloadLen = 0;
    this.m_aEncodedPayload = [];
    this.m_aDecodedPayload = [];
    this.m_sDecodedMsg = '';
}


//static variables
Packet.PAYLOAD_MED = 126;
Packet.PAYLOAD_LARGE = 127;
Packet.PAYLOAD_BYTES_MED = 2;
Packet.PAYLOAD_BYTES_LARGE = 8;

Packet.PAYLOAD_EXT_LEN_START_BYTE = 2;

//the op code types
Packet.OP_CODE_ARR = {
    CONT : 0x0,
    TEXT : 0x1,
    BINARY : 0x2,
    CLOSE : 0x8,
    PING : 0x9,
    PONG : 0xA
};


//added by Oliver Chong - October 2, 2014
/**
 * Checks if the payload data is a text
 * return bit : if 1, the payload is a text otherwise return 0
 */
Packet.prototype.IsText = function()
{
    return ( ( this.m_nOpCode & Packet.OP_CODE_ARR['TEXT'] ) == Packet.OP_CODE_ARR['TEXT'] );
};


//added by Oliver Chong - October 10, 2014
/**
 * Checks if the payload data is a binary data
 * return bit : if 1, the payload is a binary data otherwise return 0
 */
Packet.prototype.IsBinary = function()
{
    return ( ( this.m_nOpCode & Packet.OP_CODE_ARR['BINARY'] ) == Packet.OP_CODE_ARR['BINARY'] );
};


//added by Oliver Chong - October 10, 2014
/**
 * Checks if its a ping request
 * return bit : if 1, it's a ping request otherwise return 0
 */
Packet.prototype.IsPing = function()
{
    return ( ( this.m_nOpCode & Packet.OP_CODE_ARR['PING'] ) == Packet.OP_CODE_ARR['PING'] );
};


//added by Oliver Chong - October 10, 2014
/**
 * Checks if its a close request
 * return bit : if 1, it's a close request otherwise return 0
 */
Packet.prototype.IsClose = function()
{
    return ( ( this.m_nOpCode & Packet.OP_CODE_ARR['CLOSE'] ) == Packet.OP_CODE_ARR['CLOSE'] );
};


//added by Oliver Chong - October 10, 2014
/**
 * Checks if its a continuation of another data frame
 * return bit : if 1, it's a continuation of another data frame otherwise return 0
 */
Packet.prototype.IsContinuation = function()
{
    return ( ( this.m_nOpCode & Packet.OP_CODE_ARR['CONT'] ) == Packet.OP_CODE_ARR['CONT'] );
};



////////////////////////////////////////////////////////////////////////////////////////


if ( typeof( module ) !== 'undefined' )
{
	//export (or "expose") the internally scoped functions
	module.exports = Packet;
}