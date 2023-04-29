//Generate random numbers within assigned ranges for sequenceNumber and timeStamp
let sequenceNumber = Math.floor(Math.random() * Math.pow(2, 20));
let timestamp = Math.floor(Math.random() * 999) + 1;

module.exports = {

    init: function () { //Initializes server timer, timeStamp increments by 1 every 10ms
        setInterval(function () {
            timestamp += 1;
            if (timestamp > Math.pow(2, 32)) {
                timestamp = Math.floor(Math.random() * 999) + 1;
            }
        }, 10);
    },

    getSequenceNumber: function () {
        sequenceNumber++;
        return sequenceNumber;
    },

    getTimestamp: function () {
        return Math.floor(timestamp);
    }
};
