var http = require('http'),
	fs 	 = require('fs'),
	url  = require('url');

	
var html = fs.readFileSync('./public/client.html', 'utf-8');

exports.gui = function (clients) {
	http.createServer(function (req, res) {
		
		var views = {	'fore' 		: 0,
						'port' 		: 1,
						'starboard'	: 2,
						'aft'		: 3,
						'tactical'	: 4,
						'long range': 5,
						'status'	: 6
					};

		// buff[28] = select view
		var viewChangePacket = new Buffer([
			0xef, 0xbe, 0xad, 0xde, 
			0x20, 0x00, 0x00, 0x00,
			0x02, 0x00, 0x00, 0x00,
			0, 0, 0, 0,
			0x0c, 0x00, 0x00, 0x00,
			0x3c, 0x1d, 0x82, 0x4c,
			0x01, 0x00, 0x00, 0x00,
			0x05, 0x00, 0x00, 0x00 ]);

		if(url.parse(req.url).pathname == '/views'){
			    res.writeHead(200, {
					'Content-Length' : html.length,
					'Content-Type' : 'text/html' });
				res.end(html, 'utf-8');
		}else if(url.parse(req.url).pathname == '/changeview'){
			console.log('je moeder id '+ url.parse(req.url, true).query.id);
			res.writeHead(200);
			res.end();
			viewChangePacket[28] =  parseInt(url.parse(req.url, true).query.id);
			clients[0].serverConnection.write(viewChangePacket);
		}
		
			
	}).listen(80);
}