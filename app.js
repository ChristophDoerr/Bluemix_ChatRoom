
var express = require('express');
var app = express();

var helmet = require('helmet');
var server = require('http').createServer(app);
var passwordHash = require('password-hash');

var io = require('socket.io').listen(server, {transports:['websocket']});
var users = {};

app.enable('trust proxy');

server.listen(8080);



var cfEnv = require('cf-env');
var cfenv = require('cfenv');
var redis = require('socket.io-redis');
io.adapter(redis({host:'pub-redis-10532.dal-05.1.sl.garantiadata.com', port: '10532', password:'nyrsAxtcsrIioVO0'}))
//var appEnv = cfenv.getAppEnv();
var pkg   = require("./package.json");
  //var dbCreds =  appEnv.getServiceCreds('Cloudant NoSQL DB-08');  
  var nano;
  var prints;  
  var cloudant = {
		  url : "https://c446af86-b321-4984-876a-f6de4da3bab3-bluemix:aeb8123f68f6f64116c92fdea258bbadaa3fcf83349192fe69913687e3726750@c446af86-b321-4984-876a-f6de4da3bab3-bluemix.cloudant.com"     	             
  }; 
  var nano = require("nano")(cloudant.url);
  var db = nano.db.use("users");
  var cfCore = cfEnv.getCore({name: pkg.name});

  var instanceId = cfCore.app && cfCore.app != null ? cfCore.app.instance_id : undefined;
 app.get('/instanceId', function(req, res) {
   if(!instanceId) {
      res.writeHeader(204);
     res.end();
   } else {
     res.end(JSON.stringify({
       id : instanceId
      }));
    }
  });


 app.use(helmet());



app.use(function (req, res, next) {

    if (req.secure) {
        
            next();
    } else {
 
            res.redirect('https://' + req.headers.host + req.url);
    }
});

app.get('/', function(req, res) {

	res.sendFile(__dirname + '/index.html');
});




io.sockets.on('connection', function(socket) {
	 var hashedPassword0 = passwordHash.generate('1337');
	 var hashedPassword = passwordHash.generate('123456');
	 var hashedPassword1 = passwordHash.generate('test123');
	 var hashedPassword2 = passwordHash.generate('apfel');
	 var hashedPassword3 = passwordHash.generate('cloud');
	 console.log("HASHED PW: 1337 " + hashedPassword0);
	 console.log("HASHED PW: 123456 " + hashedPassword);
	 console.log("HASHED PW: test123 " + hashedPassword1);
	 console.log("HASHED PW: apfel" + hashedPassword2);
	 console.log("HASHED PW: cloud" + hashedPassword3);
	socket.on('new user', function(data, callback) {
		if (data.nick in users) {
			callback(false);
		} else {
			
			
			
			db.get(data.nick, function(err, dataGet) {
				if (!err){
					if (passwordHash.verify(data.pw,dataGet.password)){
						
				
					
				
					socket.nickname = data.nick;
					users[socket.nickname] = socket;
					
					socket.emit('username', {
						nick : socket.nickname
					});
								
					io.sockets.emit('new UserJoined', {
						nick : socket.nickname
					});
					
					  callback(true);
					}else{
						callback(false);
					}
				  }else{
					  callback(false);
				  }
				  });
	
		}
	});

	
	socket.on('send message', function(data, callback) {
		data = data.trim();
		if(data.indexOf('<html>') >= 0 ||data.indexOf('</html>' )>= 0){
			return;
		}
		if(data.indexOf('<script>') >= 0 ||data.indexOf('</script>' )>= 0){
			return;
		}
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