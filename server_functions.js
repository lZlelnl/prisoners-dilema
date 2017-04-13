var startgame = function(message, ws){
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
var globalchat = function(message, ws){
  var messagearray = message.split(";");
  var senderID = messagearray[1];
  var messageinfo = messagearray[2];
  db.get("SELECT * FROM nametable WHERE id = ?", [senderID], function(e, worm){
    console.log(e);
    console.log(worm);
    if (e) {
      console.log(e);
    } else if (worm) {
      //db.run("INSERT INTO conversationlistener(senderID, message) VALUES(?,?)", [senderID, messageinfo]);
      console.log(worm.name + ": " + messageinfo);
      allmessage(worm.name + ": " + messageinfo);
    } else {
      console.log("I didn't find anything");
    }
  });
};
var levingame = function(message, ws){
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
var scoreing = function(choicearray){
  db.run("BEIN TRANSACTION");
  db.get("SELECT * FROM games WHERE (player1id = ? OR player2id = ?) AND active = 1",[parseInt(choicearray[2]),parseInt(choicearray[2])],function(e, row){

    console.log("row after updating");
    console.log(row);
    // if both players picked something
    if(row.player1choice !== null && row.player2choice !== null){
      clientports[row.player1id].send("both players have made their choice");
      clientports[row.player2id].send("both players have made their choice");

      //if player 1 chose to cooperate
      if(row.player1choice === "cooperate"){
        //if player 2 choose to cooperate
        if(row.player2choice === "cooperate"){
          return("sucsess");
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

        }else{var decision = function(choicearray){
          //the choice messages go choice[0];cooperate/defect[1];id[2]
          db.get("SELECT * FROM games WHERE (player1id = ? OR player2id = ?) AND active = 1",[parseInt(choicearray[2]),parseInt(choicearray[2])],function(e, row){
            console.log("row before updating");
            console.log(row);
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

          //when someone leaves

          //db.run("UPDATE SET  = ?")
        };
          clientports[row.player1id].send("you both stabbed eachother");
          clientports[row.player2id].send("you both stabbed eachother");

        };
      };

    };

  });
  db.run("COMMIT");
};
var decision = function(choicearray){
  //the choice messages go choice[0];cooperate/defect[1];id[2]
  db.run("BEGIN TRANSACTION");
  db.get("SELECT * FROM games WHERE (player1id = ? OR player2id = ?) AND active = 1",[parseInt(choicearray[2]),parseInt(choicearray[2])],function(e, row){
    console.log("row before updating");
    console.log(row);
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
  db.run("COMMIT");

  //when someone leaves

  //db.run("UPDATE SET  = ?")
};
var addplayer = function(message, ws){
  var name = message.split("username;")[1];
  db.run('INSERT INTO nametable (name) VALUES(?)', [name], function(e) {
    ws.send(this.lastID);
    clientports[this.lastID] = ws;
  });
};
function allmessage(message){
  s.clients.forEach(function(client){
    client.send(message);
  });
};
