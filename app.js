var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
 var dbCreds =  appEnv.getServiceCreds('Cloudant NoSQL DB-08');  
 var nano;
 var prints;  
 var cloudant = {
		  url : "https://c446af86-b321-4984-876a-f6de4da3bab3-bluemix:aeb8123f68f6f64116c92fdea258bbadaa3fcf83349192fe69913687e3726750@c446af86-b321-4984-876a-f6de4da3bab3-bluemix.cloudant.com"     	         
  }; 
  var nano = require("nano")(cloudant.url);
  var db = nano.db.use("users");
	if (dbCreds) {
		console.log('URL is ' + dbCreds.url); 	
		nano = require('nano')(dbCreds.url); 	
		prints = nano.use('prints'); 
	} else {  
		console.log('NO DB!'); 
	}




var express = require('express');
app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server);
users = {};

server.listen(8080);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});




io.sockets.on('connection', function(socket) {
	
	
	console.log("Piplinetest");
	socket.on('new user', function(data, callback) {
		
		if (data in users) {
			callback(false);
		} else {
			callback(true);
			
			db.get("Hans", function(err, dataGet) {
				if (!err){
					  console.log(dataGet.id);
					
				  }else{
					  console.log(dataGet.id);
				  }});

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