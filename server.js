var server = require('ws').Server;
var sqlite3 = require('sqlite3');
var path = require('path');
var express = require('express');
var functions = require('/.server_function');
const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');
const httpserver = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
var s = new server({ port: 5001 });
var clientports = {};

function handlemessage(message, ws){
  if (message.startsWith("username;")) {
    addplayer(message, ws);
  }
  //setting up a game
  if (message.startsWith("play;")){
    startgame(message, ws);
  };
  if(message.startsWith("message;")){
    globalchat(message, ws);
  };
  if(message.startsWith("leaving")){
    leavingame(message, ws);
  };

  //when someone makes a choice
  if(message.startsWith("choice")){
    var choicearray = message.split(";");
    decision(message, ws);
    scoreing(message, ws);
  }
};

var db = new sqlite3.Database("Database");
db.run("DROP TABLE IF EXISTS nametable");
db.run("DROP TABLE IF EXISTS games");
//db.run("DROP TABLE IF EXISTS conversationlistener");

db.run("CREATE TABLE IF NOT EXISTS nametable (id INTEGER PRIMARY KEY, name TEXT, playing BOOLEAN default 0, online INTEGER default 0)" );
//db.run("CREATE TABLE IF NOT EXISTS conversationlistener(id INTEGER PRIMARY KEY, senderID INTEGER, message TEXT)");
db.run("CREATE TABLE IF NOT EXISTS games(id INTEGER PRIMARY KEY, player1id INTEGER, player2id INTEGER, player1choice TEXT, player2choice TEXT, active BOOLEAN)");

s.on('connection', function(ws){
  ws.on('message', function(message){
    handlemessage(message, ws);
  });
  ws.on('close', function(){
    allmessage("request id");
    ws.on('message', function(message){
      if(message.startsWith("imhere;"));
        var aliveid = message.split(";")[1];
        db.run("UPDATE nametable SET online = 1 WHERE id = ? ",[aliveid]);
        db.all("SELECT * FROM nametable WHERE online = 0",function(){});

    });
      console.log("someone left");
      first = true;

  });
});
  console.log("someone joined");
