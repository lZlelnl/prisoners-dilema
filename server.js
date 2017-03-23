var server = require('ws').Server;
var sqlite3 = require('sqlite3');
var s = new server({ port: 5001 });
var clientports = {};
function allmessage(message){
  s.clients.forEach(function(client){
    client.send(message);
  });
};
function handlemessage(message, ws){
  if (message.startsWith("username;")) {
    var name = message.split("username;")[1];
    db.run('INSERT INTO nametable (name) VALUES(?)', [name], function(e) {
      ws.send(this.lastID);
      clientports[this.lastID] = ws;
    });

  }
  //setting up a game
  if (message.startsWith("play;")){
    var id = message.split(";")[1];
    db.run("UPDATE nametable SET playing = 1 WHERE id = ?",[id]);
    db.all("SELECT * FROM nametable WHERE playing = 0", function(e, players){
      var randomplayer = Math.floor(Math.random()*players.length);
      var chosenOne = players[randomplayer]
      console.log(chosenOne);
      db.run("update nametable SET playing = 1 WHERE id = ?",[chosenOne.id]);
      ws.send("you have been matched with " + chosenOne.name);
      db.get("SELECT * FROM nametable WHERE id = ?", [id], function(e,challanger){
        var chosenWS = clientports[chosenOne.id];
        chosenWS.send("picked;" + chosenOne.id + ";" + challanger.name);
        db.run("INSERT INTO games (player1id, player2id, active) VALUES(?,?,1)", [id, chosenOne.id]);
      });
    });
    db.run("UPDATE nametable SET playing = 0 WHERE id = ?",[id]);
  };
//for sending and reciving text messages
  if(message.startsWith("message;")){
    var messagearray = message.split(";");
    var senderID = messagearray[1];
    var messageinfo = messagearray[2];
    db.get("SELECT * FROM nametable WHERE id = ?", [senderID], function(e, worm){
      console.log(e);
      console.log(worm);
      if (e) {
        console.log(e);
      } else if (worm) {
        db.run("INSERT INTO conversationlistener (senderID, message) VALUES(?,?)", [senderID, messageinfo]);
        console.log(worm.name + ": " + messageinfo);
        allmessage(worm.name + ": " + messageinfo);
      } else {
        console.log("I didn't find anything");
      }
    });
  };
  if(message.startsWith("leaving")){
    var leavingid = message.split(";")[1];
    db.get("SELECT * FROM games WHERE active = 1 AND (player1id = ? OR player2id = ?)",[parseInt(leavingid),parseInt(leavingid)],function(e,row){
      if(row.player1id === parseInt(leavingid)){
        clientports[row.player2id].send("you are left alone");
      }else{
        clientports[row.player1id].send("you are left alone");
      };
      db.run("UPDATE games SET active = 0 WHERE player1id = ? OR player2id = ?",[parseInt(leavingid),parseInt(leavingid)]);
      db.run("UPDATE nametable SET playing = 0 WHERE id = ? OR id = ?",[row.player1id,row.player2id])
      });
  };

  //when someone makes a choice
  if(message.startsWith("choice")){
    var choicearray = message.split(";");
    db.get("SELECT * FROM games WHERE (player1id = ? OR player2id = ?) AND active = 1",[choicearray[2],choicearray[2]],function(e, row){
      if(parseInt(choicearray[2]) === row.player1id){
        db.run("UPDATE games SET player1choice = ? WHERE player1id = ?",[choicearray[1],parseInt(choicearray[2])]);
        clientports[row.player1id].send("waiting for player 2 to choose");
        clientports[row.player2id].send("player 1 is waiting for you to choose");
      }else{
        db.run("UPDATE games SET player2choice = ? WHERE player2id = ?",[choicearray[1],parseInt(choicearray[2])]);
        clientports[row.player2id].send("waiting for player 1 to choose");
        clientports[row.player1id].send("player 2 is waiting for you");
      };
    });
    db.get("SELECT * FROM games WHERE (player1id = ? OR player2id = ?) AND active = 1",[choicearray[2],choicearray[2]],function(e, row){


      console.log(row);
      // if both players picked something
      if(row.player1choice !== null && row.player2choice !== null){
        clientports[row.player1id].send("both players have made their choice");
        clientports[row.player2id].send("both players have made their choice");
        //if player 1 chose to cooperate
        if(row.player1choice === "cooperate"){
          //if player 2 choose to cooperate
          if(row.player2choice === "cooperate"){
            clientports[row.player1id].send("you both cooperated yay");
            clientports[row.player2id].send("you both cooperated yay");
          //otherwise player 2 defected
          }else{
            clientports[row.player1id].send("your back has a knife shaped hole");
            clientports[row.player2id].send("you sucsessfully backstabbed");

          };
        //player 1 defects
        }else{
          if(row.player2choice === "cooperate"){
            clientports[row.player1id].send("you sucsessfully backstabbed");
            clientports[row.player2id].send("your back has a knife shaped hole");

          }else{
            clientports[row.player1id].send("you both stabbed eachother");
            clientports[row.player2id].send("you both stabbed eachother");

          };
        };

      };

    });

    //when someone leaves

    //db.run("UPDATE SET  = ?")
  };
};

var db = new sqlite3.Database("Database");
db.run("DROP TABLE IF EXISTS nametable");
db.run("DROP TABLE IF EXISTS games");
db.run("DROP TABLE IF EXISTS conversationlistener");

db.run("CREATE TABLE IF NOT EXISTS nametable (id INTEGER PRIMARY KEY, name TEXT, playing BOOLEAN default 0, online INTEGER default 0)" );
db.run("CREATE TABLE IF NOT EXISTS conversationlistener(id INTEGER PRIMARY KEY, senderID INTEGER, message TEXT)");
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
