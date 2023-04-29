//Importing required packages
let ITPResponse = require('./ITPResponse');
let singleton = require('./Singleton');
let fs = require("fs");
let net = require("net");

//Module used to handle client requests in server
module.exports = {

    handleClientJoining: function (socket) {    //Called every time a client connects to the server

        const timeStamp = singleton.getTimestamp();

        socket.on("data", packet => {   //Entered for every packet sent by clients
            let fileType;
            const version = parseBitPacket(packet, 0, 4);   //Gets value from bits 0-3 to get version
            const requestType = parseBitPacket(packet, 24, 8);  //Gets value from bits 25-32 to get requestTyoe
            const fileTypeNumber = parseBitPacket(packet, 64, 4);   //Gets value from bits 65-68 to 
            const fileName = bytesToString(packet.slice(12));   //Takes an array of bytes (the payload) and turns it back into a string which will be the fileName, everything after 12th index is payload
            const seqeunceNumber = singleton.getSequenceNumber();   //Get the sequence number

            console.log("Client-" + singleton.getTimestamp() + " is connected at timestamp: " + timeStamp + "\n");

            console.log("ITP packet received:");
            printPacketBit(packet); //Print the packet in bits

            //Convert the fileTypeNumber to the fileType it corresponds too
            if (fileTypeNumber === 1) {
                fileType = "bmp";
            }
            else if (fileTypeNumber === 2) {
                fileType = "jpeg";
            }
            else if (fileTypeNumber === 3) {
                fileType = "gif";
            }
            else if (fileTypeNumber === 4) {
                fileType = "png";
            }
            else if (fileTypeNumber === 5) {
                fileType = "tiff";
            }
            else if (fileTypeNumber === 15) {
                fileType = "raw";
            }
            else {
                fileType = "invalid";
            }

            //Print client request info
            console.log("\nClient-" + timeStamp + " requests: ");
            console.log("\t--ITP version: 7");
            console.log("\t--Timestamp: " + parseBitPacket(packet, 32, 32));
            console.log("\t--Request type: Query");
            console.log("\t--Image file extension(s): " + fileType.toUpperCase());
            console.log("\t--Image file name: " + fileName);

            fs.access("images/" + fileName + "." + fileType, fs.constants.F_OK, err => {    //Check if file exists
                if (err) {  //If it doesn't exist, send a packet with no file to the user
                    socket.write(ITPResponse.getPacket(2, seqeunceNumber, timeStamp, 0, null));
                } else {    //If it does exist try to read the file
                    fs.readFile("images/" + fileName + "." + fileType, (err, data) => {     //Check if file is readable
                        if (err) {  //If its not readable thown an error and close the server connection
                            socket.emit("error", "Image was found but error reading image data on server");
                            socket.end();
                        }
                        else {  //If its readable, convert the image to an array of bytes and send a packet with correct headers and payload then close the connection
                            const imageData = [...data];
                            socket.write(ITPResponse.getPacket(1, seqeunceNumber, timeStamp, imageData.length, imageData));
                            socket.end();
                        }
                    });
                }
            });
        });

        socket.on("close", () => {  //Closes connection
            console.log("\nClient-" + timeStamp + " closed the connection");
        });


        socket.on("error", (err) => {   //If an error occures display error in terminal
            console.log("\nThe following error occured: " + err);
        });
    }
};


//// Some usefull methods ////
// Feel free to use them, but DON NOT change or add any code in these methods.

// Returns the integer value of the extracted bits fragment for a given packet
function parseBitPacket(packet, offset, length) {
    let number = "";
    for (var i = 0; i < length; i++) {
        // let us get the actual byte position of the offset
        let bytePosition = Math.floor((offset + i) / 8);
        let bitPosition = 7 - ((offset + i) % 8);
        let bit = (packet[bytePosition] >> bitPosition) % 2;
        number = (number << 1) | bit;
    }
    return number;
}

// Prints the entire packet in bits format
function printPacketBit(packet) {
    var bitString = "";

    for (var i = 0; i < packet.length; i++) {
        // To add leading zeros
        var b = "00000000" + packet[i].toString(2);
        // To print 4 bytes per line
        if (i > 0 && i % 4 == 0) bitString += "\n";
        bitString += " " + b.substr(b.length - 8);
    }
    console.log(bitString);
}

// Converts byte array to string
function bytesToString(array) {
    var result = "";
    for (var i = 0; i < array.length; ++i) {
        result += String.fromCharCode(array[i]);
    }
    return result;
}