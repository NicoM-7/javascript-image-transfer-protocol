//Importing required packages
const net = require("net");
const fs = require("fs");
const ITPRequest = require("./ITPRequest");
const { exec } = require("child_process");
const socket = new net.Socket();

//Generates a random timestamp from 1-999 for a client that increments by one every 10ms
let timeStamp = Math.floor(Math.random() * 999) + 1;
setInterval(function () {
  timeStamp += 1;
}, 10);

if (process.argv.slice(2)[5] != 7) {  //If client tries to use version 7 don't send request
  console.log("Invalid version! Only version 7 works!");
  process.exit(1);
}

if (process.argv.slice(2)[2] != "-q") {  //If client tries to use version 7 don't send request
  console.log("You must use type query!");
  process.exit(1);
}

socket.connect(process.argv.slice(2)[1].split(":")[1], process.argv.slice(2)[1].split(":")[0], () => {  //Coonects client to server with ip address and port entered in terminal

  console.log("Connected to ImageDB server on: " + process.argv.slice(2)[1].split(":")[0] + ":" + process.argv.slice(2)[1].split(":")[1]);

  let packet = ITPRequest.getPacket(timeStamp, process.argv.slice(2)[3].split(".")[1], process.argv.slice(2)[3].split(".")[0]); // Create a packet using the ITPRequest template and pass in a timestamp and the file extension and name entered in terminal
  socket.write(packet); // Send the packet over the socket

  console.log("\nITP packet header received: ");


  socket.on("data", data => {   //called for every packet recieved from server
    printPacketBit(data.slice(0, 12));  //prints the packet in 12 8 bit numbers, the first 12 bytes are headers, rest is payload which is image data
    console.log("\nServer sent: ")
    if (parseBitPacket(data, 4, 8) === 1) {   //Bits 4 to 12 represent the response type, if its 1 it means found, if its 2 go to else block
      console.log("\t--ITP version = 7");
      console.log("\t--Request Type = Found");
      console.log("\t--Sequence Number = " + parseBitPacket(data, 12, 20));
      console.log("\t--Timestamp = " + parseBitPacket(data, 32, 32));
      const imageData = data.slice(12); //Gets bytes after 12th index which is the payload, the bytes of the image data
      fs.writeFile(process.argv.slice(2)[3].split(".")[0] + "." + process.argv.slice(2)[3].split(".")[1], imageData, (err) => {   //create an image file using the array of image bytes
        if (err) {
          socket.emit("error", "Could not parse sent bytes into image");
        }
        else {  //Launch the image file in any program that can read images
          exec(process.argv.slice(2)[3].split(".")[0] + "." + process.argv.slice(2)[3].split(".")[1], (err) => {
            if (err) {
              socket.emit("error", "Image was sent, but could not open image in program");
            }
            else {
              socket.end(); //Go to socket.on("close")
            }
          });
        }
      });
    }
    else {  //If its not found enter this block and display this info
      console.log("\t--ITP version = 7");
      console.log("\t--Response Type = Not Found");
      console.log("\t--Sequence Number = " + parseBitPacket(data, 12, 20));
      console.log("\t--Timestamp = " + parseBitPacket(data, 32, 32));
      socket.end();
    }
  });

  socket.on("close", () => {  //Called after client recieves response from server
    console.log("\nDisconeccted from the server\nConnection closed")
  });

  socket.on("error", (err) => { //If an errors occur, this method is called and will display the error in the terminal
    console.log("\nThe following error occured: " + err);
    socket.end();
  });
});

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