$(function(){
	var dbURL = "https://rps-multiplayer-e9d13.firebaseio.com";

	var config = {
		apiKey: "AIzaSyBfHzgSuQIsvGGusmlFAJziSECE7O4mbg4",
		authDomain: "rps-multiplayer-e9d13.firebaseapp.com",
		databaseURL: dbURL,
		storageBucket: "rps-multiplayer-e9d13.appspot.com"
	};

	firebase.initializeApp(config);

  // Get a reference to the database service
	var database = firebase.database();
	var myUserID;
	var userRef;


	function addPlayer(name, num) {
	  database.ref('Players/Player' + myUserID).set({
	    name: name,
	    wins: 0,
	    losses: 0
	  });
	}

	$(".nameSubmit").on("click", function(){
		var placeholderName = $(this).prev().val();
		database.ref("Chat/Message").onDisconnect().set(placeholderName + " has disconnected");
		if (placeholderName != ""){
			var pRef;
			database.ref('Players').once("value").then(function(snapshot) {
				pRef = snapshot.val();
				if (pRef == null){
					myUserID = 1;
				}

				else if (Object.keys(pRef).length === 1){
					if (Object.keys(pRef)[0] === "Player1"){
						myUserID = 2;						
					}
					else {
						myUserID = 1;
					}

				}
				addPlayer (placeholderName, myUserID);
				database.ref("Chat/Message").set(placeholderName + " has joined as Player " + myUserID);
	    		database.ref('Players/Player' + myUserID).onDisconnect().remove();
	    		$(".nameInput").hide();
			});
		}
	})

	$(".chatSubmit").on("click", function(){
		var chatText = $(this).prev().val();
		if (chatText != "" && (myUserID === 1 || myUserID === 2)){
			database.ref('Players/Player' + myUserID).once("value").then(function(snapshot){
				$(".textBox").append("<p class=p" + myUserID + "text>" + snapshot.child("name").val() + ": " + chatText + "</p>");
				database.ref("Chat").set({log: $(".textBox").html()});
				$(".textBox").scrollTop($(".textBox")[0].scrollHeight);
			});
		}
	})

	database.ref('Players/Player1').on("value", function(snapshot){
		if (snapshot.val() !== null){
			$("#p1").text(snapshot.child("name").val());
			$(".p1wins").text(snapshot.child("wins").val());
			$(".p1losses").text(snapshot.child("losses").val());
			$("#p1Score").css("display", "block");
		}

		else {
			$("#p1").text("Waiting for Player 1");
		}
	});

	database.ref('Players/Player2').on("value", function(snapshot){
		if (snapshot.val() !== null){
			$("#p2").text(snapshot.child("name").val());
			$(".p2wins").text(snapshot.child("wins").val());
			$(".p2losses").text(snapshot.child("losses").val());
			$("#p2Score").css("display", "block");
		}

		else {
			$("#p2").text("Waiting for Player 2");
		}
	});

	database.ref('Players').on("value", function(snapshot){
		if (snapshot.val() === null){
			database.ref('Chat').remove();
			database.ref("Turn").remove();

			if (myUserID !== 1 || myUserID !== 2) {
				$(".nameInput").show();
			}
		}

		else if (Object.keys(snapshot.val()).length === 1) {
			database.ref("Turn").remove();
			$(".p1buttons").hide()
			resetButtons($(".p1buttons"));
			$(".p2buttons").hide();
			resetButtons($(".p2buttons"));

			if (myUserID !== 1 || myUserID !== 2) {
				$(".nameInput").show();
			}
		}

		else if (Object.keys(snapshot.val()).length === 2) {
			if(!snapshot.child("Player1/Hand").val()){
				database.ref("Turn").set(1);
			}

			$(".nameInput").hide();
		}
	});

	database.ref('Chat').on("value", function(snapshot){
		$(".textBox").html(snapshot.child("log").val());
		$(".p" + myUserID + "text").css("color", "green");
	});

	database.ref('Turn').on("value", function(snapshot){
		if (snapshot.val() === 1){
			if (myUserID === 1){
				$(".p1buttons").show();
			}
		}

		else if (snapshot.val() === 2){
			if (myUserID === 2){
				// console.log("my turn");
				$(".p2buttons").show();
			}
		}

		else if (snapshot.val() === "end"){
			checkWinner();
		}
	});

	$(document).on("click", ".gameButtons", function(){
		var tmpText = $(this).text();
		database.ref('Players/Player' + myUserID + '/Hand').set(tmpText);

		database.ref('Turn').once("value").then(function(snapshot){
			if (snapshot.val() === 1){
				database.ref('Turn').set(2);
				$(".p1buttons").html("<h2>" + tmpText + "</h2>");
			}

			else {
				// console.log("turn1");
				$(".p2buttons").html("<h2>" + tmpText + "</h2>");
				database.ref('Turn').set("end");	
			}
		});
	});

	function resetButtons(div){
		div.empty()
		.append('<h3 class="gameButtons">Rock</h3>')
		.append('<h3 class="gameButtons">Paper</h3>')
		.append('<h3 class="gameButtons">Scissors</h3>')
	}

	function resetGame(){
		database.ref("Turn").set(1);
		$(".gameEndText").text("");
		resetButtons($(".p1buttons"));
		resetButtons($(".p2buttons"));
		$(".p2buttons").hide();
		database.ref("Players/Player1/Hand").remove();
		database.ref("Players/Player1/Hand").remove();

		if (myUserID !== 1){
			$(".p1buttons").hide()
		}
	}

	function checkWinner(){
		var winner;
		var p1hand;
		var p1name;
		var p1winslosses = [];
		var p2hand;
		var p2name;
		var p2winslosses = [];

		database.ref('Players').on("value", function(snapshot){
			p1hand = snapshot.child("Player1/Hand").val();
			p2hand = snapshot.child("Player2/Hand").val();
			p1name = snapshot.child("Player1/name").val();
			p2name = snapshot.child("Player2/name").val();
			p1winslosses[0] = snapshot.child("Player1/wins").val()
			p1winslosses[1] = snapshot.child("Player1/losses").val()
			p2winslosses[0] = snapshot.child("Player2/wins").val()
			p2winslosses[1] = snapshot.child("Player2/losses").val()
		});

		console.log(p1winslosses);
		$(".p1buttons").html("<h2>" + p1hand + "</h2>").show();
		$(".p2buttons").html("<h2>" + p2hand + "</h2>").show();

		if (p1hand === "Rock"){
			if (p2hand == "Scissors"){
				$(".gameEndText").text(p1name + " Wins!");
				database.ref("Players/Player1/wins").set(1);
				database.ref("Players/Player2/losses").set(p2winslosses[1] + 1);
			}

			else if (p2hand == "Paper"){
				$(".gameEndText").text(p2name + " Wins!");
				database.ref("Players/Player2/wins").set(p2winslosses[0] + 1);
				database.ref("Players/Player1/losses").set(p1winslosses[1] + 1);
			}

			else {
				$(".gameEndText").text("Tie!");
			}
		}

		else if (p1hand === "Scissors"){
			if (p2hand == "Paper"){
				$(".gameEndText").text(p1name + " Wins!");
				database.ref("Players/Player1/wins").set(p1winslosses[0] + 1);
				database.ref("Players/Player2/losses").set(p2winslosses[1] + 1);

			}

			else if (p2hand == "Rock"){
				$(".gameEndText").text(p2name + " Wins!");
				database.ref("Players/Player2/wins").set(p2winslosses[0] + 1);
				database.ref("Players/Player1/losses").set(p1winslosses[1] + 1);
			}

			else {
				$(".gameEndText").text("Tie!");
			}
		}

		else {
			if (p2hand == "Rock"){
				$(".gameEndText").text(p1name + " Wins!");
				database.ref("Players/Player1/wins").set(p1winslosses[0] + 1);
				database.ref("Players/Player2/losses").set(p2winslosses[1] + 1);
			}

			else if (p2hand == "Scissors"){
				$(".gameEndText").text(p2name + " Wins!");
				database.ref("Players/Player2/wins").set(p2winslosses[0] + 1);
				database.ref("Players/Player1/losses").set(p1winslosses[1] + 1);
			}

			else {
				$(".gameEndText").text("Tie!");
			}
		}

		setTimeout(resetGame, 3000);
	}

	database.ref("Chat/Message").on("value", function(snapshot){
		if (snapshot.val() !== null){
			$(".textBox").append("<p class='adminMessage'>" + snapshot.val() + "</p>");
			database.ref("Chat").set({log: $(".textBox").html()});
			$(".textBox").scrollTop($(".textBox")[0].scrollHeight);
		}
	})

})
