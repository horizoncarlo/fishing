function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomBoolean() {
    return Math.random() > 0.5;
}

/**
 * Returns a random lower case letter
 */
function getRandomLetter() {
    var alphabet = "abcdefghijklmnopqrstuvwxyz"
    return alphabet[Math.floor(Math.random() * alphabet.length)];
}

var docHeight = -1;
function getDocumentHeight() {
    if (docHeight === -1) {
        docHeight = document.body.getBoundingClientRect().height;
    }
    return docHeight;
}

var docWidth = -1;
function getDocumentWidth() {
    if (docWidth === -1) {
        docWidth = document.body.getBoundingClientRect().width;
    }
    return docWidth;
}

/**
 * Add the passed 'text' to the 'toReturn' array 'repeat' number of times and return the result
 */
function addToArray(toReturn, text, repeat) {
    if (!toReturn) {
        toReturn = [];
    }
    
    for (var i = 0; i < repeat; i++) {
        toReturn.push(text);
    }
    
    return toReturn;
}

function addChild(child) {
    document.getElementById('game').appendChild(child);
}

function deleteChild(child) {
    document.getElementById('game').removeChild(child);
}

function showMessage(text) {
    console.log(text);
    
    var message = document.createElement('div');
    message.innerHTML = text;
    message.className = 'message';
    message.style.top = parseInt(player.div.getBoundingClientRect().top) - 20 + 'px';
    message.style.left = player.div.getBoundingClientRect().left + 'px';
    message.style.opacity = 1;
    addChild(message);
    
    setTimeout(function() {
        message.style.top = '0px';
        message.style.opacity = 0;
    }, 50);
    
    setTimeout(function() {
        if (message) {
            deleteChild(message);
        }
    }, 4000);
}

/**
 * Return what the player earns for their current caught count
 */
function calculateEarned() {
    var toReturn = 0;
    for (var i = 0; i < player.caught; i++) {
        toReturn += getRandomInt(9, 14);
    }
    return toReturn;
}

function trimFileName(fileName) {
    if (fileName) {
        fileName = fileName.split('-').join(' ');
        if (fileName.toLowerCase().endsWith('.png') ||
            fileName.toLowerCase().endsWith('.jpg') ||
            fileName.toLowerCase().endsWith('.gif')) {
            fileName = fileName.substring(0, fileName.length-4);
        }
    }
    return fileName;
}

function saveSession() {
    setStorage('difficulty', difficulty.current);
    setStorage('day', player.day);
    setStorage('bait', player.bait);
    setStorage('caught', player.caught);
    setStorage('totalCaught', player.totalCaught);
    setStorage('money', player.money);
}

function loadSession() {
    difficulty.current = parseInt(getStorage('difficulty', 0));
    player.day = parseInt(getStorage('day', 1));
    player.bait = parseInt(getStorage('bait', DEFAULT_BAIT));
    player.caught = parseInt(getStorage('caught', 0));
    player.totalCaught = parseInt(getStorage('totalCaught', 0));
    player.money = parseInt(getStorage('money', 0));
}

function setStorage(name, value) {
    try {
        if (window.localStorage) {
            window.localStorage.setItem(btoa(name), btoa(value));
        }
    } catch(e) { }
}

function getStorage(name, fallback) {
    try {
        if (window.localStorage) {
            var toReturn = window.localStorage.getItem(btoa(name));
            if (typeof toReturn !== 'undefined' && toReturn !== null) {
                return atob(toReturn);
            }
        }
    } catch(e) { }
    return fallback;
}

function getRandomBird() {
    var birds = [
        'cardinal.gif',
        'blackbird.gif',
        'bluejay.gif'
    ];
    return birds[Math.floor(Math.random() * birds.length)];
}

function getRandomFishFolder() {
    var folders = [
        'florida',
    ];
    return folders[Math.floor(Math.random() * folders.length)];
}

/**
 * Return a random fish from our various folders and images
 *
 *@return JSON object containing user friendly 'name' and full 'path' to the image
 */
var lastCatch;
function getRandomFish(recursion) {
    // TODO Eventually we could do specific bait for specific environments/fish. For now keep it simple, but somewhat future proofed by having the fish in folders
    
    // First determine which folder to use
    var fishes = [];
    var folder = getRandomFishFolder();
    if (folder === 'florida') {
        fishes = [
			'Atlantic-Trumpetfish.png',
			'Balloonfish.png',
			'Banded-Butterflyfish.png',
			'Bar-Jack.png',
			'Bermuda-Chub.png',
			'Bigeye.png',
			'Black-Grouper.png',
			'Blacktip-Shark.png',
			'Blue-Angelfish.png',
			'Blue-Chromis.png',
			'Blue-Parrotfish.png',
			'Blue-Tang.png',
			'Candy-Basslet.png',
			'Cottonwick.png',
			'Flamefish.png',
			'Foureye-Butterflyfish.png',
			'Goliath-Grouper.png',
			'Gray-Angelfish.png',
			'Great-Barracuda.png',
			'Green-Moray.png',
			'Hogfish.png',
			'Midnight-Parrotfish.png',
			'Nassau-Grouper.png',
			'Neon-Goby.png',
			'Nurse-Shark.png',
			'Ocellated-Frogfish.png',
			'Orangespotted-Filefish.png',
			'Peacock-Flounder.png',
			'Porkfish.png',
			'Queen-Triggerfish.png',
			'Rainbow-Parrotfish.png',
			'Red-Lionfish.png',
			'Red-Lizardfish.png',
			'Reef-Butterflyfish.png',
			'Reef-Shark.png',
			'Reef-Silverside.png',
			'Reef-Squirrelfish.png',
			'Rock-Beauty.png',
			'Scrawled-Filefish.png',
			'Sergeant-Major.png',
			'Sharpnose-Puffer.png',
			'Southern-Stingray.png',
			'Spanish-Grunt.png',
			'Spotfin-Hogfish.png',
			'Spotted-Drum.png',
			'Spotted-Eagle-Ray.png',
			'Spotted-Moray-Eel.png',
			'Spotted-Scorpionfish.png',
			'Tarpon.png',
			'Tiger-Grouper.png',
			'Tobaccofish.png',
			'Yellowtail-Snapper.png',
        ];
    }
    else {
        folder = '';
        fishes = [
           'Unknown-Fish.jpg'
        ];
    }
    
    // Get our random fish
    // Try to stop grabbing the same fish twice in a row, but only try once
    var chosenOne = fishes[Math.floor(Math.random() * fishes.length)];
    if (!recursion && lastCatch && lastCatch === chosenOne) {
        return getRandomFish(true);
    }
    lastCatch = chosenOne;
    
    return {
        name: trimFileName(chosenOne),
        path: './images/fish/' + (folder ? (folder + '/') : '') + chosenOne
    }
}