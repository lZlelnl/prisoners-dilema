require("./server_functions");

test("lets hope this works", function(assert){
  db.run("INSERT INTO games (player1id, player2id, player2choice, active) VALUES(1,2, cooperate, 1)");
  var assert.equal(scoring(["choice","cooperate","1"]), "sucsess");
});
;
