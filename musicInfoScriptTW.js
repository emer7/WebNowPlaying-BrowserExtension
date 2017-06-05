var oldTitle = "";
var oldArtist = "";
var oldAlbum = "";
var oldAlbumArt = "";
var oldPos = "";
var oldDur = "";
var oldVolume = "";
var oldLiked = "";
var oldRepeat = "";
var oldShuffle = "";
var oldState = "";

var ws;
var connected = false;
var reconnect;
var sendData;

function open() {
	try {
		var url = "ws://127.0.0.1:8974/";
		ws = new WebSocket(url);
		ws.onopen = onOpen;
		ws.onclose = onClose;
		ws.onmessage = onMessage;
		ws.onerror = onError;

		console.log("Opening websocket");
	}
	catch (error) {
		console.log("Error:" + error);
	}
}

var onOpen = function() {
	console.log("Opened websocket");
	connected = true;
	ws.send("PLAYER:Twitch");
	//@TODO Possibly send all know data right away on open
	sendData = setInterval(function() {
		dataCheck();
	}, 50);
};

var onClose = function() {
	console.log("Closed websocket");
	connected = false;
	clearInterval(sendData);
	reconnect = setTimeout(function() {
		open();
	}, 5000);
};

var onMessage = function(event) {
	if (event.data.toLowerCase() == "playpause") {
		var a = document.getElementsByClassName("js-control-playpause-button")[0];
		var e = document.createEvent('MouseEvents');
		e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		a.dispatchEvent(e);
	}
};

var onError = function(event) {
	if (typeof event.data != 'undefined') {
		console.log("Websocket Error:" + event.data);
	}
};

function dataCheck() {
	try {
		if (document.getElementsByClassName("js-card__title").length > 0) {
			var newTitle = document.getElementsByClassName("js-card__title")[0].innerText;
			if (newTitle != oldTitle) {
				oldTitle = newTitle;

				if (newTitle.indexOf(" • ") > 0) {
					ws.send("TITLE:" + newTitle.substring(0, newTitle.indexOf(" • ")));
				}
				else {
					ws.send("TITLE:" + newTitle);
				}
			}


			var newArtist = document.getElementsByClassName("cn-bar__displayname")[0].innerText;
			if (newArtist != oldArtist) {
				oldArtist = newArtist;
				ws.send("ARTIST:" + newArtist);
			}

			var newAlbum = document.getElementsByClassName("js-card__info")[0].children[0].innerText;
			if (newAlbum != oldAlbum) {
				oldAlbum = newAlbum;
				ws.send("ALBUM:" + newAlbum);
			}

			var newAlbumArt = document.getElementsByClassName("cn-metabar__boxart")[0].children[0].src;
			if (newAlbumArt != oldAlbumArt) {
				oldAlbumArt = newAlbumArt;
				ws.send("ALBUMART:" + newAlbumArt.replace("-138x190", ""));
			}

			//If not live
			if (document.getElementById("js-player-seek").children.length > 0) {
				var newDur = document.getElementsByClassName("player-seek__time--total")[0].innerText;
				if (newDur != oldDur) {
					oldDur = newDur;
					ws.send("DURATION:" + newDur);
				}

				var newPos = document.getElementsByClassName("player-seek__time")[0].innerText;
				if (newPos != oldPos) {
					oldPos = newPos;
					ws.send("POSITION:" + newPos);
				}
			}
			else {
				//@TODO Look at twitch api integration to current stream durration
				var newDur = "0:00";
        //If stream is playing keep sending 0 to indicate it is still playing
				if (document.getElementsByClassName("js-pause-button")[0].getBoundingClientRect().top > 0) {
					oldDur = newDur;
					ws.send("DURATION:" + newDur);
				}

				var newPos = "0:00";
				if (newPos != oldPos) {
					oldPos = newPos;
					ws.send("POSITION:" + newPos);
				}
			}

      var newVolume = document.getElementsByClassName("player-volume__slider")[0].getAttribute("aria-valuenow");
      if (newVolume != oldVolume) {
        oldVolume = newVolume;
        ws.send("VOLUME:" + parseFloat(newVolume) * 100);
      }


			var newLiked = document.getElementsByClassName("follow-button")[0].innerText;
			if (newLiked != oldLiked) {
				oldLiked = newLiked;

				var following = 0;
				if (newLiked != "Follow") {
					following = 5;
				}
				ws.send("RATING:" + following);
			}

      //Twitch does not have a way to tell which button is showing so just check position of pause button
			var stateCheck = document.getElementsByClassName("js-pause-button")[0].getBoundingClientRect().top;
      var newState = 2;
      if (stateCheck > 0) {
        newState = 1;
      }
			if (newState != oldState) {
				oldState = newState;

				ws.send("STATE:" + newState);
			}
		}
		else {
			//@TODO Decide on if/how to tell it to reset data/ignore this one
			//Send playback as stopped
			var newState = 0;
			if (newState != oldState) {
				oldState = newState;
				ws.send("STATE:" + newState);
			}
		}
	}
	catch (e) {
		ws.send("Error:" + e);
	}
}
open();
