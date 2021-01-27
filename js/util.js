function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, allDecimalPlaces) {
    if (!allDecimalPlaces) {
        return parseFloat(((Math.random() * (max - min)) + min).toFixed(3));
    }
    else {
        return (Math.random() * (max - min)) + min;
    }
}

function getRandomBoolean() {
    return Math.random() > 0.5;
}

function getRandomName() {
    var NAME_LIST = [
        'Rusty',
        'James',
        'John',
        'Robert',
        'Michael',
        'William',
        'Richard',
        'Joseph',
        'Thomas',
        'Charles',
        'Mary',
        'Patricia',
        'Jennifer',
        'Nancy',
        'Barbara',
        'Susan',
        'Lisa',
        'Ashley',
        'Evelyn',
        'Elizabeth',
    ];
    return NAME_LIST[Math.floor(Math.random() * NAME_LIST.length)];
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

function showLongMessage(text, object) {
    showMessage(text, true, object);
}

/**
 * Show a floating message above the player's head
 * Pass 'longer' as true to have the message be a bit slower
 */
function showMessage(text, longer, object) {
    console.log(text);
    
    var longerMod = 0;
    var message = document.createElement('div');
    message.innerHTML = text;
    message.className = 'message';
    
    if (!object) {
        object = player.image;
    }
    
    message.style.setProperty('--start', parseInt(object.getBoundingClientRect().top) - 12 + 'px');
    message.style.left = object.getBoundingClientRect().left - (text.length * 2) + 'px';
    message.style.opacity = 1;
    addChild(message);
    
    // If we want a longer message add some bonus time, and also slow down the animation
    if (longer) {
        message.style.animationDuration = '10s';
        longerMod = 2000;
    }
    
    setTimeout(function() {
        message.style.opacity = 0;
    }, (50 + longerMod));
    
    setTimeout(function() {
        deleteChild(message);
    }, (4000 + longerMod));
}

/**
 * Return what the player earns for their current caught count
 */
function calculateEarned() {
    var toReturn = 0;
    for (var i = 0; i < player.caught; i++) {
        toReturn += getRandomInt(9, 14);
    }
    
    // Add a net bonus for what day it is
    if (toReturn > 0) {
        toReturn += player.day;
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
    setStorage('name', player.name);
    setStorage('day', player.day);
    setStorage('bait', player.bait);
    setStorage('caught', player.caught);
    setStorage('totalCaught', player.totalCaught);
    setStorage('money', player.money);
    setStorage('soundOn', player.soundOn);
}

function loadSession() {
    difficulty.current = parseInt(getStorage('difficulty', 0));
    player.name = getStorage('name', getRandomName());
    player.day = parseInt(getStorage('day', 1));
    player.bait = parseInt(getStorage('bait', DEFAULT_BAIT));
    player.caught = parseInt(getStorage('caught', 0));
    player.totalCaught = parseInt(getStorage('totalCaught', 0));
    player.money = parseInt(getStorage('money', 0));
    player.soundOn = (getStorage('soundOn', 'true') === 'true');
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
        'outer-banks',
        'virginia',
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
    // First determine which folder to use
    var fishes = [];
    var folder = getRandomFishFolder();
    if (folder === 'florida') {
        fishes = [
			'Angelfish.png',
			'Atlantic-Trumpetfish.png',
			'Balloonfish.png',
			'Banded-Butterflyfish.png',
			'Bar-Jack.png',
			'Bermuda-Chub.png',
			'Bigeye.png',
			'Black-Grouper.png',
			'Blacktip-Shark.png',
			'Candy-Basslet.png',
			'Chromis.png',
			'Cottonwick.png',
			'Flamefish.png',
			'Foureye-Butterflyfish.png',
			'Goliath-Grouper.png',
			'Great-Barracuda.png',
			'Hogfish.png',
			'Lionfish.png',
			'Lizardfish.png',
			'Lizzy-Snake.png',
			'Midnight-Parrotfish.png',
			'Moray-Eel.png',
			'Nassau-Grouper.png',
			'Neon-Goby.png',
			'Nurse-Shark.png',
			'Ocellated-Frogfish.png',
			'Peacock-Flounder.png',
			'Porkfish.png',
			'Queen-Triggerfish.png',
			'Rainbow-Parrotfish.png',
			'Reef-Butterflyfish.png',
			'Reef-Shark.png',
			'Reef-Silverside.png',
			'Reef-Squirrelfish.png',
			'Rock-Beauty.png',
			'Scrawled-Filefish.png',
			'Sergeant-Major.png',
			'Sharpnose-Puffer.png',
			'Slamnose-Parrotfish.png',
			'Southern-Stingray.png',
			'Spanish-Grunt.png',
			'Spotfin-Hogfish.png',
			'Spotted-Angelfish.png',
			'Spotted-Drum.png',
			'Spotted-Eagle-Ray.png',
			'Spotted-Filefish.png',
			'Spotted-Moray-Eel.png',
			'Spotted-Scorpionfish.png',
			'Tang.png',
			'Tarpon.png',
			'Tiger-Grouper.png',
			'Tobaccofish.png',
			'Yellowtail-Snapper.png',
        ];
    }
    else if (folder === 'outer-banks') {
        fishes = [
			'Atlantic-Bluefin-Tuna.png',
			'Atlantic-Spadefish.png',
			'Atlantic-Tripletail.png',
			'Bigeye-Tuna.png',
			'Cobia.png',
			'Dolphinfish.png',
			'Dull-Snapper.png',
			'Gag.png',
			'Greater-Amberjack.png',
			'King-Mackerel.png',
			'Little-Tunny.png',
			'Mackerel.png',
			'Marlin.png',
			'Pompano.png',
			'Porgy.png',
			'Prairie-Fish.png',
			'Red-Snapper.png',
			'Sailfish.png',
			'Sheepshead.png',
			'Shining-Triggerfish.png',
			'Silver-Runner.png',
			'Snowy-Grouper.png',
			'Southern-Flounder.png',
			'Southern-Kingfish.png',
			'Spotted-Seatrout.png',
			'Striped-Bass.png',
			'Swordfish.png',
			'Tailspot-Drum.png',
			'Tallfin-Drum.png',
			'Tilefish.png',
			'Vermilion-Snapper.png',
			'Wahoo.png',
			'Weakfish.png',
			'Yellowfin-Tuna.png',
        ];
    }
    else if (folder === 'virginia') {
        fishes = [
			'Atlantic-Menhaden.png',
			'Atlantic-Sturgeon.png',
			'Black-Crappie.png',
			'Bowfin.png',
			'Brook-Trout.png',
			'Chain-Pickerel.png',
			'Channel-Catfish.png',
			'Charlesbane.png',
			'Common-Carp.png',
			'Creek-Chubsucker.png',
			'Day-Bass.png',
			'Deepgill.png',
			'Dotted-Trout.png',
			'Evelyns-Spotted-Cheetah-Fish.png',
			'Finned-Pickerel.png',
			'Flat-Bullhead.png',
			'Flathead-Catfish.png',
			'Flier.png',
			'Ghost-Perch.png',
			'Glowbreast-Sunfish.png',
			'Gold-Perch.png',
			'Grass-Carp.png',
			'Hearty-Catfish.png',
			'Heavy-Catfish.png',
			'Hybrid-Striped-Bass.png',
			'Largemouth-Bass.png',
			'Lined-Sunfish.png',
			'Longear-Sunfish.png',
			'Mottled-Bullhead.png',
			'Mud-Sunfish.png',
			'Mustard-Bullhead.png',
			'Northern-Pike.png',
			'Pumpkinseed.png',
			'Quillback.png',
			'Rainbow-Trout.png',
			'Redear-Sunfish.png',
			'Shineback-Herring.png',
			'Shortnose-Sturgeon.png',
			'Smallmouth-Bass.png',
			'Snakehead.png',
			'Snow-Crappie.png',
			'Striped-Bass.png',
			'Walleye.png',
			'Warmouth.png',
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
