var net = require('net'),
	gui = require('./gui.js').gui;

var artemisIP   = 'localhost',
	artemisPort = 2011,
	listenIP    = '0.0.0.0',
	listenPort  = 2010;

var clients = [];

var Enummer = { 'origin' : {
					'server': 0x01,
					'client': 0x02
				},
				'packets': {
					'shipactionpacket': {
						'header': 0x4c821d3c,
						'subtypes': {
							'setship': 0x0d,
							'setconsole': 0x0e
						}
					}
				},
				'console' : 
					{ 	'main screen' 	:0,
						'helm'			:1,	
						'weapons'		:2,
						'engineering'	:3,
						'science'		:4,
						'communications':5,
						'data'			:6,
						'observer'		:7,
						'captain\'s map':8,
						'game master'	:9
					},
			  };

var clientConnectionHandler = function (clientConnection) {

	var instance = { };

	console.log('New connection');

	var clientData = new Buffer(0);
	var serverData = new Buffer(0);

	var shipIndex = -1,
		consoles  = []; 	

	var serverConnected = function () {
		clientConnection.pipe(serverConnection);
		serverConnection.pipe(clientConnection);

		clients.push(instance);

		serverConnection.on('data',  serverDataReceived);
		serverConnection.on('error', serverClosed);
		serverConnection.on('close', serverClosed);
		serverConnection.on('end',   serverClosed);
	}

	var clientClosed = function () {
		if (serverConnection)
			serverConnection.end();

		cleanUp();
	}

	var serverClosed = function () {
		clientConnection.end();
		cleanUp();
	}

	var cleanUp = function () {
		clients.splice(clients.indexOf(instance), 1);
	}

	var clientDataReceived = function (data) {
		clientData = Buffer.concat([clientData, data]);
		clientData = parseArtemisStream(clientData, parsePacket);
	}

	var serverDataReceived = function (data) {
		serverData = Buffer.concat([serverData, data]);
		serverData = parseArtemisStream(serverData, parsePacket);
	}

	var parseArtemisStream = function (data, cb) {
		if (data.length < 8) {
			// 0xdeadbeef + packet length
			return data;
		}

		var packetLength = data.readInt32LE(4);

		if (data.length < packetLength) {
			return data;
		} else {
			if (cb) {
				cb(data.slice(0, packetLength));
			}

			return parseArtemisStream(data.slice(packetLength), cb);
		}
	}

	var parsePacket = function (data) {
		var origin = data.readInt32LE(8);
		var packetType = data.readInt32LE(20);

		// console.log('SERVER' + (origin == Enummer.origin.client ? ' <-- ' : ' --> ') + 'CLIENT: ' + hexify(data));

		if (origin == Enummer.origin.client) {
			if (packetType == Enummer.packets.shipactionpacket.header) {
				var subType = data.readInt32LE(24);
				var subs = Enummer.packets.shipactionpacket.subtypes;
				if (subType == subs.setship) {
					shipIndex = data.readInt32LE(28);
				}

				// add/remove consoles from client
				if (subType == subs.setconsole){
				    var consoleType = data.readInt32LE(28);
					var selected 	= data.readInt32LE(32);
					var consoleIndex = consoles.indexOf(consoleType);

					if (selected && consoleIndex === -1) {
						consoles.push(consoleType);
					} else if (!selected && consoleIndex !== -1) {
						consoles.splice(consoleIndex, 1);
					}
				}
			}
		}
	}

	var hexify = function (data) {
		var result = '';

		for (var i = 0; i < data.length; i++) {
			result += data[i].toString(16) + ' ';
		}

		return result;
	}

	var serverConnection = net.connect(
		{ host: artemisIP, port: artemisPort }, serverConnected);

	instance.serverConnection = serverConnection;

	clientConnection.on('data',  clientDataReceived);
	clientConnection.on('error', clientClosed);
	clientConnection.on('close', clientClosed);
	clientConnection.on('end',   clientClosed);
}

var server    = net.createServer(clientConnectionHandler);
var guiServer = new gui(clients);

server.listen(listenPort, listenIP);
console.log('Server listening...');
