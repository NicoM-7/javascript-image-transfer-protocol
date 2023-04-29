//Module that is used to format packet headers and payload of the request packets

module.exports = {
  init: function (timeStamp, fileType, fileName) {  //Initialize packet

    const packet = new Uint8Array(12 + fileName.length); //The packet is equal to an array of bytes, its always at least length 12 cause it contains 12 bytes of header, extra length is determined by fileName in which 1 character corresponds to one byte which is payload

    let fileTypeNumber; //fileType must be sent as a number in the header so check all cases and get the right file type

    if (fileType === "bmp") {
      fileTypeNumber = 1;
    }
    else if (fileType === "jpeg") {
      fileTypeNumber = 2;
    }
    else if (fileType === "gif") {
      fileTypeNumber = 3;
    }
    else if (fileType === "png") {
      fileTypeNumber = 4;
    }
    else if (fileType === "tiff") {
      fileTypeNumber = 5;
    }
    else if (fileType === "raw") {
      fileTypeNumber = 15;
    }
    else {
      fileTypeNumber = 0;
    }

    storeBitPacket(packet, 7, 0, 4);  //Stores version as value 7 in bits 0-3, it will always be 7 since its verified on client side
    storeBitPacket(packet, 0, 24, 8); //Stores query as value 0 in bits 25,32
    storeBitPacket(packet, timeStamp, 32, 32);  //Stores timeStamp in bits 33-64
    storeBitPacket(packet, fileTypeNumber, 64, 4);  //Stores fileTypeNumber in bits 65-68
    storeBitPacket(packet, stringToBytes(fileName).length, 68, 28); //Stores the size of the fileName in bits 69-96
    for (let i = 0; i < stringToBytes(fileName).length; i++) {  //Iterate over filename string length and assign bytes for each character to payload
      storeBitPacket(packet, stringToBytes(fileName)[i], 96 + (8 * i), 8);
    }

    return packet;  //return formatted packet
  },

  getPacket: function (timeStamp, fileType, fileName) { //Calls init method to get formatted request packet
    const packet = this.init(timeStamp, fileType, fileName);
    return packet;
  }
};

//// Some usefull methods ////
// Feel free to use them, but DON NOT change or add any code in these methods.

// Convert a given string to byte array
function stringToBytes(str) {
  var ch,
    st,
    re = [];
  for (var i = 0; i < str.length; i++) {
    ch = str.charCodeAt(i); // get char
    st = []; // set up "stack"
    do {
      st.push(ch & 0xff); // push byte to stack
      ch = ch >> 8; // shift value down by 1 byte
    } while (ch);
    // add stack contents to result
    // done because chars have "wrong" endianness
    re = re.concat(st.reverse());
  }
  // return an array of bytes
  return re;
}

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
