function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomBoolean() {
    return Math.random() >= 0.5;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    
    return color;
}

/**
 * Returns a random lower case letter
 */
function getRandomLetter() {
    var alphabet = "abcdefghijklmnopqrstuvwxyz"
    return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function getRandomName() {
    var NAME_LIST = [
        'Roshan',
        'Sly',
        'Rainbow',
        'Happy',
        'Buttons',
        'Snowflake',
        'Jigglehat',
        'Sugar',
        'Rusty'
    ];
    return NAME_LIST[Math.floor(Math.random() * NAME_LIST.length)];
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

function isCollide(a, b) {
    var aRect = a.getBoundingClientRect();
    var bRect = b.getBoundingClientRect();

    return !(
        ((aRect.top + aRect.height) < (bRect.top)) ||
        (aRect.top > (bRect.top + bRect.height)) ||
        ((aRect.left + aRect.width) < bRect.left) ||
        (aRect.left > (bRect.left + bRect.width))
    );
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