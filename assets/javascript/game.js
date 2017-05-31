$(function(){
	var currentPlayers = 0;

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
	    		database.ref('Players/Player' + myUserID).onDisconnect().remove();
	    		$(".nameInput").hide();
			});
		}
	})

	$(".chatSubmit").on("click", function(){
		var chatText = $(this).prev().val();
		if (chatText != "" && (myUserID === 1 || myUserID === 2)){
			database.ref('Players/Player' + myUserID).once("value").then(function(snapshot){
				$(".textBox").prepend("<p class=p" + myUserID + "text>" + snapshot.child("name").val() + ": " + chatText + "</p>");
				database.ref("Chat").set({log: $(".textBox").html()});

			});
			// $("textarea").prepend()
		}
	})

	database.ref('Players/Player1').on("value", function(snapshot){
		if (snapshot.val() !== null){
			$("#p1").text(snapshot.child("name").val());
			currentPlayers += 1;
		}

		else {
			$("#p1").text("");
			currentPlayers -= 1;
		}
	});

	database.ref('Players/Player2').on("value", function(snapshot){
		if (snapshot.val() !== null){
			$("#p2").text(snapshot.child("name").val());
			currentPlayers += 1;
		}

		else {
			$("#p2").text("");
			currentPlayers -= 1;
		}
	});

	database.ref('Players').on("value", function(snapshot){
		if (snapshot.val() === null){
			database.ref('Chat').remove();
			database.ref("Turn").remove();
		}

		else if (Object.keys(snapshot.val()).length === 2) {
			database.ref("Turn").set(1);
		}

		

	});

	database.ref('Chat').on("value", function(snapshot){
		$(".textBox").html(snapshot.child("log").val());
		$(".p" + myUserID + "text").css("color", "green");
	});



})
