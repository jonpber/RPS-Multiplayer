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

	//Listens for changes in Players path of database and handles lobby users  joining game or dropping
	database.ref('Players').on("value", function(snapshot){
		if (snapshot.val() === null){
			//stops the switching hand animation if players drop
			clearInterval(spinningIconTimer);

			//removes turn if players leave
			database.ref("Turn").remove();
			database.ref('Lobby').once("value").then(function(snapshot){
				//if lobby is also totally empty, will erase chat history
				if(snapshot.val() === null){
					database.ref('Chat').set({log: []});
				}
			})
		}

		//if only player remains or has joined
		else if (Object.keys(snapshot.val()).length === 1) {
			//again the animation is stop and turn is removed
			clearInterval(spinningIconTimer);
			database.ref("Turn").remove();

			//The button drawer is closed to prevent the game from being played
			$(".buttonDrawer").slideUp("normal", function(){
				$(".gameSquare").css("border-radius", "15px");
			});

			//P1's hand is deleted to prevent weird behavior on game resume
			database.ref("Players/Player1/Hand").remove();
			$(".gameEndText").text("Waiting for Players");

			//If p2 is not around, p1's box displays that they are waiting for player 2 and vice versa
			if ($(".p2Spot").attr("data-occupied") !== "filled"){
				$(".p1Spot").children().html("<h5>Waiting for Player 2</h5>");
			}

			if ($(".p1Spot").attr("data-occupied") !== "filled"){
				$(".p2Spot").children().html("<h5>Waiting for Player 1</h5>");
			}
		}

		//If there are two players, the game begins
		else if (Object.keys(snapshot.val()).length === 2) {
			//This line of code is used to ensure that the game does not accidentally reset every time a change to player is done
			if(!snapshot.child("Player1/Hand").val()){
				database.ref("Turn").set(1);
			}
		}
	});

	//Listens to changes in Player 1, such as wins, losses, dropping out from game and other.
	database.ref('Players/Player1').on("value", function(snapshot){
		if (snapshot.val() !== null){
			$("#p1").text(snapshot.child("name").val());
			$(".p1wins").text(snapshot.child("wins").val());
			$(".p1losses").text(snapshot.child("losses").val());
			$(".p1Spot").attr("data-occupied", "filled");
			$(".p1Spot").css("border", "2px double white");
			
		}

		else {
			$("#p1").text("???");
			$(".p1Spot").attr("data-occupied", "empty");
			$(".p1Spot").children().html("<h5>P1</h5><h5>Click to Join</h5>");
			$(".p1Spot").css("border", "2px dashed white");
		}
	});

	//Listens to changes in Player 2, such as wins, losses, dropping out from game and other.
	database.ref('Players/Player2').on("value", function(snapshot){
		if (snapshot.val() !== null){
			$("#p2").text(snapshot.child("name").val());
			$(".p2wins").text(snapshot.child("wins").val());
			$(".p2losses").text(snapshot.child("losses").val());
			$(".p2Spot").attr("data-occupied", "filled");
			$(".p2Spot").css("border", "2px double white");
		}

		else {
			$("#p2").text("???");
			$(".p2Spot").attr("data-occupied", "empty");
			$(".p2Spot").children().html("<h5>P2</h5><h5>Click to Join</h5>");
			$(".p2Spot").css("border", "2px dashed white");
		}
	});

	//Listens to changes in the Chat history and updates the chat log accordingly
	database.ref('Chat').on("value", function(snapshot){
		var arrayHolder = snapshot.child("log").val();
		if (!Array.isArray(arrayHolder)){
			arrayHolder = [];
		}
		updateChat(arrayHolder);
	});

	//Listens to changes in the Turn and behaves accordingly on each change
	database.ref('Turn').on("value", function(snapshot){
		var p1name;
		var p2name; 
		//References the database value for Player1 and 2's names
		database.ref('Players').on("value", function(snapshot){
			p1name = snapshot.child("Player1/name").val();
			p2name = snapshot.child("Player2/name").val();
		});

		//If turn is 1...
		if (snapshot.val() === 1){
			$(".gameEndText").text(p1name + "'s turn");

			//If the player is Player 1
			if (myUserID === 1){
				$(".gameSquare").css("border-radius", "15px 15px 0 0");
				$(".buttonDrawer").slideDown();
				$(".p1Spot").children().html("");
			}

			//If the player is player 2 or a spectator
			else {
				//They see the random hand animation cycling through different possible hands
				spinningIconTimer = setInterval(function(){
					$(".p1Spot").children().html(iconsArray[spinnerCounter]);
					spinnerCounter += 1;
					spinnerCounter = spinnerCounter % 3;
				}, 200)
			}
			
			//The "waiting for player 1" text is cleared from player 2's box
			$(".p2Spot").children().html("");
		}	

		//If it's Turn number 2
		else if (snapshot.val() === 2){
			//The animation is stopped from running in P1's box
			clearInterval(spinningIconTimer);
			$(".gameEndText").text(p2name + "'s turn");

			//If the player is player 2
			if (myUserID === 2){
				$(".gameSquare").css("border-radius", "15px 15px 0 0");
				$(".buttonDrawer").slideDown();
				$(".p1Spot").children().html("<h2 class='unknownChoice'>?</h2>");
			}

			//If the user is Player 1 or a spectator
			else {
				spinningIconTimer = setInterval(function(){
					$(".p2Spot").children().html(iconsArray[spinnerCounter]);
					spinnerCounter += 1;
					spinnerCounter = spinnerCounter % 3;
				}, 200)
			}
		}

		//If it is the end of the round
		else if (snapshot.val() === "end"){
			clearInterval(spinningIconTimer);
			database.ref("Players").once("value").then(function(snapshot){
				$(".p1Spot").children().html("<img src='assets/images/" + snapshot.child("Player1/Hand").val() + "1.png' class='selectIcon'>");
				$(".p2Spot").children().html("<img src='assets/images/" + snapshot.child("Player2/Hand").val() + "1.png' class='selectIcon'>");
			})
			checkWinner();
		}
	});

	//Listens for changes in Admin chat messages, such as if a player connects or disconnects
	database.ref("Chat/Message").on("value", function(snapshot){
		//If there is a value of a message
		if (snapshot.val() !== null){
			var tempAdminMessage = snapshot.val();
			//That value is appended to an array and then set.
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

	//Handles the hover effect on the drawers
	$(document).on("mouseover", ".drawerSection", function(){
		$(this).children().attr("src", 'assets/images/' + $(this).children().attr("data-hand") + '.png');
	});

	$(document).on("mouseleave", ".drawerSection", function(){
		$(this).children().attr("src", 'assets/images/' + $(this).children().attr("data-hand") + '1.png');
	});

	//Handles the clicking on drawer buttons to select your hand
	$(document).on("click", ".drawerSection", function(){
		var tmpText = $(this).children().attr("data-hand");
		$(".buttonDrawer").slideUp("normal", function(){
				$(".gameSquare").css("border-radius", "15px");
			});
		database.ref('Players/Player' + myUserID + '/Hand').set(tmpText);

		//Behaves according to which turn it is
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

	//Handles the option to submit a name at the beginning
	$(".nameSubmit").on("click", function(event){
		event.preventDefault();
		var placeholderName = $(this).prev().val().trim();
		//If you aren't entering blank text
		if (placeholderName != ""){

			//Pulls down the object Names from the DB to compare your name to existing CURRENT players/lobby users
			database.ref("Names").once("value").then(function(snapshot){
				if (snapshot.val() !== null){
					var tempNamesArray = Object.keys(snapshot.val());
					var isFound = false;
					for (var i = 0; i < tempNamesArray.length; i++){
						if (placeholderName.toLowerCase() === tempNamesArray[i].toLowerCase()){
							isFound = true;
						}
					}

					//If your name is not currently in use
					if (!isFound){
						myName = placeholderName;
						// var arrayIndexVal = tempNamesArray.length
						tempNamesArray[myName] = placeholderName;
						database.ref("Names/" + myName).set(true);
						database.ref("Names/" + myName).onDisconnect().remove();
						
						database.ref("Chat/Message").onDisconnect().set("~" + myName + " has disconnected~");
						$(".greetingH1").text("Hello, " + myName);
						database.ref("Chat/Message").set("~" + placeholderName + " has connected~");
						database.ref("Lobby/" + myName).set(true);
						database.ref("Lobby/" + myName).onDisconnect().remove();
						$(".nameInputBox").attr('disabled','disabled');
						$(".nameSubmit").attr('disabled','disabled');

						//The game is started after a small delay
						setTimeout(function(){
							$(".contNameInput").hide();
							$(".contMain").fadeIn();
						}, 2500);

					}

					//If your name is currently used
					else {
						$(".enterName").text("Sorry, that name is taken");
					}
				}

				//If there is no currenty list of names, one is created
				else {
					myName = placeholderName;
					database.ref("Names/" + myName).set(true);
					database.ref("Names/" + myName).onDisconnect().remove();
					$(".greetingH1").text("Hello, " + myName);
					database.ref("Chat/Message").onDisconnect().set("~" + myName + " has disconnected~");
					database.ref("Chat/Message").set("~" + myName + " has connected~");
					database.ref("Lobby/" + myName).set(true);
					database.ref("Lobby/" + myName).onDisconnect().remove();
					$(".nameInputBox").attr('disabled','disabled');
					$(".nameSubmit").attr('disabled','disabled');

					setTimeout(function(){
						$(".contNameInput").hide();
						$(".contMain").fadeIn();
					}, 2500);
				}
			});
			
		}
	})

	//Event Handler to click on the player 1 or 2 spaces .square
	$(".square").on("click", function(){
		if ($(this).attr("data-occupied") === "empty"){
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

	//Handler to submit chat text
	$(".chatSubmit").on("click", function(event){
		event.preventDefault();
		var chatText = $(".chatInput").val();
		$(".chatInput").val("");
		if (chatText != ""){
			database.ref('Chat/log').once("value").then(function(snapshot){
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

	//Resets the game
	function resetGame(){
		database.ref("Turn").set(1);
		database.ref("Players/Player1/Hand").remove();
		$(".p2Spot").children().html("");
	}

	//Checks the winner, updates scores, and updates the GameState text to display who won
	function checkWinner(){
		var winner;
		var p1hand;
		var p1name;
		var p1winslosses = [];
		var p2hand;
		var p2name;
		var p2winslosses = [];

		//Pulls down all the necessary info to update standings
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
				database.ref("Players/Player1/wins").set(p1winslosses[0] + 1);
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
})
