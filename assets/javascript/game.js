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
	var myName;
	var userRef;

	function addPlayer(name, num) {
	  database.ref('Players/Player' + myUserID).set({
	    name: name,
	    wins: 0,
	    losses: 0
	  });
	}

	function removePlayer(num){
		database.ref('Players/Player' + num).remove();
	}

	$(".nameSubmit").on("click", function(){
		var placeholderName = $(this).prev().val();
		database.ref("Chat/Message").onDisconnect().set(placeholderName + " has disconnected");
		if (placeholderName != ""){
			myName = placeholderName;
			$(".greetingH1").text("Hello, " + myName);
			database.ref("Chat/Message").set(placeholderName + " has connected");
			database.ref("Lobby/" + myName).set(true);
			database.ref("Lobby/" + myName).onDisconnect().remove();

			setTimeout(function(){
				$(".contNameInput").hide();
				$(".contMain").fadeIn();
			}, 2500);
		}
	})

	$(".square").on("click", function(){
		if ($(this).attr("data-occupied") === "empty"){
			// database.ref('Players/Buffer').set(true);
			if (myUserID !== undefined){
				removePlayer(myUserID);

			}
			myUserID = parseInt($(this).attr("data-player"));
			addPlayer (myName, myUserID);
			database.ref("Chat/Message").set(myName + " is now Player " + myUserID);
			database.ref('Players/Player' + myUserID).onDisconnect().remove();
			database.ref('Lobby/' + myName).remove();
		}
	})

	$(".chatSubmit").on("click", function(){
		var chatText = $(".chatInput").val();
		$(".chatInput").val("");
		if (chatText != ""){
			database.ref('Players/Player' + myUserID).once("value").then(function(snapshot){
				var newText = $("<p><b>" + myName + "</b>: " + chatText + "</p>").appendTo(".textBox");
				database.ref("Chat").set({log: $(".textBox").html()});
				newText.css("color", "green");
			});
		}
	})

	database.ref('Players/Player1').on("value", function(snapshot){
		if (snapshot.val() !== null){
			$("#p1").text(snapshot.child("name").val());
			$(".p1wins").text(snapshot.child("wins").val());
			$(".p1losses").text(snapshot.child("losses").val());
			$("#p1Score").css("display", "block");
			$(".p1Spot").attr("data-occupied", "filled");
		}

		else {
			$("#p1").text("???");
			$(".p1Spot").attr("data-occupied", "empty");
		}
	});

	database.ref('Players/Player2').on("value", function(snapshot){
		if (snapshot.val() !== null){
			$("#p2").text(snapshot.child("name").val());
			$(".p2wins").text(snapshot.child("wins").val());
			$(".p2losses").text(snapshot.child("losses").val());
			$("#p2Score").css("display", "block");
			$(".p2Spot").attr("data-occupied", "filled");
		}

		else {
			$("#p2").text("???");
			$(".p2Spot").attr("data-occupied", "empty");
		}
	});

	database.ref('Players').on("value", function(snapshot){
		if (snapshot.val() === null){
			database.ref("Turn").remove();
			database.ref('Lobby').once("value").then(function(snapshot){
				if(snapshot.val() === null){
					database.ref('Chat').remove();
				}
			})
		}

		else if (Object.keys(snapshot.val()).length === 1) {
			database.ref("Turn").remove();
			$(".buttonDrawer").slideUp("normal", function(){
				$(".gameSquare").css("border-radius", "15px");
			});
			database.ref("Players/Player1/Hand").remove();
		}

		else if (Object.keys(snapshot.val()).length === 2) {
			if(!snapshot.child("Player1/Hand").val()){
				database.ref("Turn").set(1);
			}
		}
	});

	database.ref('Chat').on("value", function(snapshot){
		$(".textBox").html(snapshot.child("log").val());
		$(".textBox").scrollTop($(".textBox")[0].scrollHeight);
	});

	database.ref('Turn').on("value", function(snapshot){
		var p1name;
		var p2name; 
		database.ref('Players').on("value", function(snapshot){
			p1name = snapshot.child("Player1/name").val();
			p2name = snapshot.child("Player2/name").val();
		});

		if (snapshot.val() === 1){
			$(".gameEndText").text(p1name + "'s turn");
			if (myUserID === 1){
				$(".gameSquare").css("border-radius", "15px 15px 0 0");
				$(".buttonDrawer").slideDown();
			}
		}

		else if (snapshot.val() === 2){
			$(".gameEndText").text(p2name + "'s turn");
			if (myUserID === 2){
				$(".gameSquare").css("border-radius", "15px 15px 0 0");
				$(".buttonDrawer").slideDown();
			}
		}

		else if (snapshot.val() === "end"){
			checkWinner();
		}
	});

	$(document).on("click", ".gameButtons", function(){
		var tmpText = $(this).attr("data-hand");
		$(".buttonDrawer").slideUp("normal", function(){
				$(".gameSquare").css("border-radius", "15px");
			});
		database.ref('Players/Player' + myUserID + '/Hand').set(tmpText);
		database.ref('Turn').once("value").then(function(snapshot){
			if (snapshot.val() === 1){
				database.ref('Turn').set(2);
				$(".p1buttons").html("<h2>" + tmpText + "</h2>");
			}

			else {
				$(".p2buttons").html("<h2>" + tmpText + "</h2>");
				database.ref('Turn').set("end");	
			}
		});
	});


	function resetGame(){
		database.ref("Turn").set(1);
		// $(".gameEndText").text("Player 1's turn");
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
		}
	})

})
