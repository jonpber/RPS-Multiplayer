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
	var myName = "";
	var userRef;
	var spinningIconTimer;
	var spinnerCounter = 0;
	var iconsArray = ["<img src='assets/images/Rock1.png' class='selectIcon'>", 
	"<img src='assets/images/Scissors1.png' class='selectIcon'>",
	"<img src='assets/images/Paper1.png' class='selectIcon'>", 
	];

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
		database.ref("Chat/Message").onDisconnect().set("~" + placeholderName + " has disconnected~");
		if (placeholderName != ""){
			myName = placeholderName;
			$(".greetingH1").text("Hello, " + myName);
			database.ref("Chat/Message").set("~" + placeholderName + " has connected~");
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
				return;
			}
			myUserID = parseInt($(this).attr("data-player"));
			addPlayer (myName, myUserID);
			database.ref("Chat/Message").set("~" + myName + " is now Player " + myUserID + "~");
			database.ref('Players/Player' + myUserID).onDisconnect().remove();
			database.ref('Lobby/' + myName).remove();
		}
	})

	$(".chatSubmit").on("click", function(){
		var chatText = $(".chatInput").val();
		$(".chatInput").val("");
		if (chatText != ""){
			database.ref('Chat/log').once("value").then(function(snapshot){
				// 	var newText = $("<p><b>" + myName + "</b>: " + chatText + "</p>").appendTo(".textBox");
				
				// 	newText.css("color", "green");
				var arrayHolder = snapshot.val();
				if (!Array.isArray(arrayHolder)){
					arrayHolder = [];
				}

				arrayHolder[arrayHolder.length] = myName + ": " + chatText;
				database.ref("Chat").set({log: arrayHolder});
				updateChat(arrayHolder);
			});
		}
	})

	database.ref('Players/Player1').on("value", function(snapshot){
		if (snapshot.val() !== null){
			$("#p1").text(snapshot.child("name").val());
			$(".p1wins").text(snapshot.child("wins").val());
			$(".p1losses").text(snapshot.child("losses").val());
			// $("#p1Score").css("display", "block");
			$(".p1Spot").attr("data-occupied", "filled");
			
		}

		else {
			$("#p1").text("???");
			$(".p1Spot").attr("data-occupied", "empty");
			$(".p1Spot").children().html("<h5>P1</h5><h5>Click to Join</h5>");
		}
	});

	database.ref('Players/Player2').on("value", function(snapshot){
		if (snapshot.val() !== null){
			$("#p2").text(snapshot.child("name").val());
			$(".p2wins").text(snapshot.child("wins").val());
			$(".p2losses").text(snapshot.child("losses").val());
			// $("#p2Score").css("display", "block");
			$(".p2Spot").attr("data-occupied", "filled");
		}

		else {
			$("#p2").text("???");
			$(".p2Spot").attr("data-occupied", "empty");
			$(".p2Spot").children().html("<h5>P2</h5><h5>Click to Join</h5>");
		}
	});

	database.ref('Players').on("value", function(snapshot){
		if (snapshot.val() === null){
			clearInterval(spinningIconTimer);
			database.ref("Turn").remove();
			database.ref('Lobby').once("value").then(function(snapshot){
				if(snapshot.val() === null){
					database.ref('Chat').set({log: []});
				}
			})
		}

		else if (Object.keys(snapshot.val()).length === 1) {
			clearInterval(spinningIconTimer);
			database.ref("Turn").remove();
			$(".buttonDrawer").slideUp("normal", function(){
				$(".gameSquare").css("border-radius", "15px");
			});
			database.ref("Players/Player1/Hand").remove();
			$(".gameEndText").text("Waiting for Players");

			if ($(".p2Spot").attr("data-occupied") !== "filled"){
				$(".p1Spot").children().html("<h5>Waiting for Player 2</h5>");
			}

			if ($(".p1Spot").attr("data-occupied") !== "filled"){
				$(".p2Spot").children().html("<h5>Waiting for Player 1</h5>");
			}
		}

		else if (Object.keys(snapshot.val()).length === 2) {
			if(!snapshot.child("Player1/Hand").val()){
				database.ref("Turn").set(1);
			}
		}
	});

	database.ref('Chat').on("value", function(snapshot){
		var arrayHolder = snapshot.child("log").val();
		if (!Array.isArray(arrayHolder)){
			arrayHolder = [];
		}
		updateChat(arrayHolder);
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
				$(".p1Spot").children().html("");
			}

			else {
				spinningIconTimer = setInterval(function(){
					$(".p1Spot").children().html(iconsArray[spinnerCounter]);
					spinnerCounter += 1;
					spinnerCounter = spinnerCounter % 3;
				}, 200)
			}
			
			$(".p2Spot").children().html("");
		}	

		else if (snapshot.val() === 2){
			clearInterval(spinningIconTimer);
			$(".gameEndText").text(p2name + "'s turn");
			if (myUserID === 2){
				$(".gameSquare").css("border-radius", "15px 15px 0 0");
				$(".buttonDrawer").slideDown();
				$(".p1Spot").children().html("<h2 class='unknownChoice'>?</h2>");
			}

			else {
				spinningIconTimer = setInterval(function(){
					$(".p2Spot").children().html(iconsArray[spinnerCounter]);
					spinnerCounter += 1;
					spinnerCounter = spinnerCounter % 3;
				}, 200)
			}
		}

		else if (snapshot.val() === "end"){
			clearInterval(spinningIconTimer);
			database.ref("Players").once("value").then(function(snapshot){
				$(".p1Spot").children().html("<img src='assets/images/" + snapshot.child("Player1/Hand").val() + "1.png' class='selectIcon'>");
				$(".p2Spot").children().html("<img src='assets/images/" + snapshot.child("Player2/Hand").val() + "1.png' class='selectIcon'>");
			})
			checkWinner();
		}
	});

	$(document).on("click", ".drawerSection", function(){
		var tmpText = $(this).children().attr("data-hand");
		$(".buttonDrawer").slideUp("normal", function(){
				$(".gameSquare").css("border-radius", "15px");
			});
		database.ref('Players/Player' + myUserID + '/Hand').set(tmpText);
		database.ref('Turn').once("value").then(function(snapshot){
			if (snapshot.val() === 1){
				database.ref('Turn').set(2);
				if (myUserID === 1 ){
					$(".p1Spot").children().html("<img src='assets/images/" + tmpText + "1.png' class='selectIcon'>");
				}

			}

			else {
				$(".p2buttons").html("<h2>" + tmpText + "</h2>");
				database.ref('Turn').set("end");
			}
		});
	});

	$(document).on("mouseover", ".drawerSection", function(){
		$(this).children().attr("src", 'assets/images/' + $(this).children().attr("data-hand") + '.png');
	});

	$(document).on("mouseleave", ".drawerSection", function(){
		$(this).children().attr("src", 'assets/images/' + $(this).children().attr("data-hand") + '1.png');
	});


	function resetGame(){
		database.ref("Turn").set(1);
		database.ref("Players/Player1/Hand").remove();
		
		database.ref("Players").once("value").then(function(snapshot){
			$(".p2Spot").children().html("");
		})
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
			var tempAdminMessage = snapshot.val();
			database.ref('Chat/log').once("value").then(function(snapshot1){
				var arrayHolder = snapshot1.val();
				if (!Array.isArray(arrayHolder)){
					arrayHolder = [];
				}
				arrayHolder[arrayHolder.length] = tempAdminMessage;
				updateChat(arrayHolder);
				database.ref('Chat/log').set(arrayHolder);
			});
			database.ref("Chat/Message").remove();
		}
	})

	function updateChat(array){
		$(".textBox").empty();
		if (Array.isArray(array)){
			for (var i =0; i < array.length; i++){
				var pTemp = $("<p>").text(array[i]);
				if(array[i].substring(0, myName.length) === myName){
					pTemp.css("color", "green");
				}

				else if (array[i].substring(0, 1) === "~") {
					pTemp.css("color", "white")
					.css("background-color", "#607f80");
				}
				$(".textBox").append(pTemp);
			}
			$(".textBox").scrollTop($(".textBox")[0].scrollHeight);
		}
	}
})
