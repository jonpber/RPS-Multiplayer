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
	var amOnline = database.ref(".info/connected");
	var userRef;


	amOnline.on('value', function(snapshot) {
  		if (snapshot.val()) {
    		database.ref('Players/Player' + myUserID).onDisconnect().remove();
    		// userRef.set(true);
  		} 
  		else {
    		// database.ref('Players/Player' + myUserID).remove();
    		// database.ref('presence/' + myUserID).remove();
  		}
	});


	function addPlayer(name, num) {
	  database.ref('Players/Player' + myUserID).set({
	    playerName: name,
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
					console.log("no one here");
				}
				else {
					myUserID = 2;
					console.log("someone one here");
				}

				addPlayer (placeholderName, myUserID);
			});





		}
	})

})
