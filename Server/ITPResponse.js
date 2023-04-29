//Module that is used to format packet headers and payload of the response packets

module.exports = {
    init: function (responseType, seqeunceNumber, timeStamp, fileSize, fileData) {  //Initialize packet
        const packet = new Uint8Array(12 + fileSize);   //The packet is equal to an array of bytes, its always at least length 12 cause it contains 12 bytes of header, extra length is determined by fileSize which is payload
        storeBitPacket(packet, 7, 0, 4);    //Store version 7 in bits 1-4
        storeBitPacket(packet, responseType, 4, 8); //Store responseType in bits 5-12
        storeBitPacket(packet, seqeunceNumber, 12, 20); //Store sequence number in bits 13-32
        storeBitPacket(packet, timeStamp, 32, 32);  //Store timeStamp in bits 33-64
        storeBitPacket(packet, fileSize, 64, 32);   //Store fileSize in bits 65-96

        if (fileSize !== 0) {   //If the file size is 0 do not send a payload
            for (let i = 0; i < fileData.length; i++) { //Iterate over the number of bytes in the image and add each byte to the payload
                storeBitPacket(packet, fileData[i], 96 + (8 * i), 8);
            }
        }
        return packet;  //return the formatted response packet
    },

    getPacket: function (responseType, seqeunceNumber, timeStamp, fileSize, fileData) {     //Calls init method to get formatted response packet
        const packet = this.init(responseType, seqeunceNumber, timeStamp, fileSize, fileData);
        return packet;
    }
};

//// Some usefull methods ////
// Feel free to use them, but DO NOT change or add any code in these methods.

// Store integer value into specific bit poistion the packet
function storeBitPacket(packet, value, offset, length) {
    // let us get the actual byte position of the offset
    let lastBitPosition = offset + length - 1;
    let number = value.toString(2);
    let j = number.length - 1;
    for (var i = 0; i < number.length; i++) {
        let bytePosition = Math.floor(lastBitPosition / 8);
        let bitPosition = 7 - (lastBitPosition % 8);
        if (number.charAt(j--) == "0") {
            packet[bytePosition] &= ~(1 << bitPosition);
        } else {
            packet[bytePosition] |= 1 << bitPosition;
        }
        lastBitPosition--;
    }
}