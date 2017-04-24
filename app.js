var express = require('express');
app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server);
users = {};

server.listen(8080);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});


var cloudant = {
        url : "https://c446af86-b321-4984-876a-f6de4da3bab3-bluemix.cloudant.com"
};
var nano = require("nano")(cloudant.url);

var db = nano.db.use("users");



io.sockets.on('connection', function(socket) {
	
	db.insert({ _id: "penis"}, function(err, body) {
		  if (!err){
			  console.log(body);
		  }else{
			  console.log(err);
		  }
		});
	console.log("Piplinetest");
	socket.on('new user', function(data, callback) {
		if (data in users) {
			callback(false);
		} else {
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			
			socket.emit('username', {
				nick : socket.nickname
			});
						
			io.sockets.emit('new UserJoined', {
				nick : socket.nickname
			});
		}
	});

	
	socket.on('send message', function(data, callback) {
		data = data.trim();
		if (data === "/list") {
			socket.emit('userlist', {
				msg : Object.keys(users)
			});
		} else if (data.charAt(0) === '@') {
			targetUser = data.slice(1, data.indexOf(" "));
			pvtMessage = data.slice(data.indexOf(" ") + 1, 200);
			for ( var i in users) {
				if (targetUser === i) {
					socket.emit('whisperSelf', {msg: data, nick: socket.nickname});
					users[i].emit('whisper', {
						msg : data,
						nick : socket.nickname
					});
				}
			}

		} else {
			io.sockets.emit('new message', {
				msg : data,
				nick : socket.nickname,
				time : new Date()
			});
		}
	});

	socket.on('disconnect', function(data) {
		if (!socket.nickname)
			return;
		delete users[socket.nickname];
		io.sockets.emit('new UserDisconnected', {
			nick : socket.nickname
		});
	});
});