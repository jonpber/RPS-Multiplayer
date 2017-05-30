$(function(){

  var config = {
    apiKey: "AIzaSyBfHzgSuQIsvGGusmlFAJziSECE7O4mbg4",
    authDomain: "rps-multiplayer-e9d13.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-e9d13.firebaseio.com",
    storageBucket: "rps-multiplayer-e9d13.appspot.com"
  };

  firebase.initializeApp(config);

  // Get a reference to the database service
	var database = firebase.database();

	function addPlayer(num, name) {
	  database.ref('Players/Player' + num).set({
	    playerName: name,
	  });
	}

	$(".nameSubmit").on("click", function(){
		if ($(this).prev().val() != ""){
			var dbref;
			database.ref('Players').on("value", function(snapshot) {
			   dbref = snapshot.val();
			});
			var placeholderName = $(this).prev().val();

			if (dbref == null){
				addPlayer (1, placeholderName);
			}
			else {
				addPlayer (2, placeholderName);
			}


			// addPlayer (1, placeholderName);
			// addPlayer (2, placeholderName);
			
		}
	})

	$(".clearButton").on("click", function(){
		firebase.database().ref('Players/Player1/').remove();
			
	})


})
