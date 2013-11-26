var net = require('net'),
	artemisIP = 'localhost',
	artemisPort = 2011,
	listenIP = '0.0.0.0',
	listenPort = 2010;

var server = net.createServer(clientConnectionHandler);

var clientConnectionHandler = function (clientConnection) {

	console.log('New connection');

	var serverConnected = function () {
		clientConnection.pipe(serverConnection);
		serverConnection.pipe(clientConnection);
		serverConnection.on('end', serverClosed);
	}

	var clientClosed = function () {
		if (serverConnection)
			serverConnection.end();
	}

	var serverClosed = function () {
		clientConnection.end();
	}

	var serverConnection = net.connect(
		{ host: artemisIP, port: artemisPort }, serverConnected);

	clientConnection.on('end', clientClosed);

}

server.listen(listenPort, listenIP);
console.log('Server listening...');