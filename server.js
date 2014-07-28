var net = require('net'),
	artemisIP = 'localhost',
	artemisPort = 2011,
	listenIP = '0.0.0.0',
	listenPort = 2010;

var clientConnectionHandler = function (clientConnection) {
	
	console.log('New connection');

	var serverConnected = function () {
		clientConnection.pipe(serverConnection);
		serverConnection.pipe(clientConnection);

		serverConnection.on('data',  serverDataReceived);
		serverConnection.on('error', serverClosed);
		serverConnection.on('close', serverClosed);
		serverConnection.on('end',   serverClosed);
	}

	var clientClosed = function () {
		if (serverConnection)
			serverConnection.end();
	}

	var serverClosed = function () {
		clientConnection.end();
	}

	var clientDataReceived = function (data) {
		console.log('SERVER <-- CLIENT: ' + hexify(data));
	}

	var serverDataReceived = function (data) {
		console.log('SERVER --> CLIENT: ' + hexify(data));
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

	clientConnection.on('data',  clientDataReceived);
	clientConnection.on('error', clientClosed);
	clientConnection.on('close', clientClosed);
	clientConnection.on('end',   clientClosed);
}

var server = net.createServer(clientConnectionHandler);

server.listen(listenPort, listenIP);
console.log('Server listening...');
