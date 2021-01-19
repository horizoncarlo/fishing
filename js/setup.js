var helperTimeout;
var LAND_WIDTH = 300;
var PIER_WIDTH = 78; // Width (in pixels) of our pier image
var PIER_HEIGHT = 70; // Height (in pixels) of our pier image
var BOAT_WIDTH = 127;
var BOAT_HEIGHT = 61;
var ISLAND_HEIGHT = 96;
var ISLAND_WIDTH = 96;

function init() {
    // Bring focus to the body if possible, to help with keypress capturing
    document.body.focus();
    
    // Watch for keyup
    document.body.onkeyup = keypressListener;
    
    // Determine our land width as a percentage of the screen, up to a maximum
    LAND_WIDTH = getDocumentWidth()/2.6;
    if (LAND_WIDTH > 1000) {
        LAND_WIDTH = 1000;
    }
    
    // Setup our player, background, and land
    initPlayer();
    initLand();
    initWater();
    
    // Put the player on their starting location
    // Do this in a timeout so the boat can initialize and so on
    setTimeout(function() {
        putPlayerOnHome();
        highlightPlayer();
    },10);
    
    // Apply our difficulty
    applyDifficulty();
    
    // Have a helper timer that fires off if the player hasn't cast in a certain amount of time
    helperTimeout = setTimeout(function() {
        showMessage('Press "Spacebar" to start');
    }, 11000);
}

function initLand() {
    // The left land area has terrain features and a pier
    var landDiv = document.createElement('div');
    landDiv.id = 'land';
    landDiv.className = 'land';
    landDiv.style.width = LAND_WIDTH + 'px';
    
    // Add the pier
    var pierDiv = document.createElement('div');
    pierDiv.id = 'pier';
    pierDiv.className = 'pier';
    pierDiv.style.left = LAND_WIDTH + 'px';
    pierDiv.style.top = getRandomInt(PIER_HEIGHT*1.3, getDocumentHeight()-PIER_HEIGHT*1.3) + 'px'; // Assuming
    pierDiv.style.cursor = 'not-allowed';
    var pierImg = document.createElement('img');
    pierImg.src = './images/pier.png';
    pierDiv.appendChild(pierImg);
    
    // Store our pier as part of the player
    player.pier = pierDiv;
    
    // Our home shack (which also serves as Settings)
    var shack = document.createElement('div');
    shack.id = 'shack';
    shack.title = 'Change Difficulty';
    shack.className = 'bo shack';
    shack.style.top = 0;
    shack.style.left = 0;
    shack.style.width = '85px';
    shack.style.height = '85px';
    shack.style.cursor = 'help';
    shack.style.zIndex = 10;
    shack.style.backgroundImage = "url('./images/fishing_shack.png')"; // Set the door closed manually at first, to preload the image and prevent flicker later
    shack.addEventListener('click', toggleDifficulty);
    addChild(shack);
    
    // Now open the shack door to draw attention to it, then close it after a similar time as our red arrow over the player
    setTimeout(function() {
        shack.style.backgroundImage = "url('./images/fishing_shack-open.png')"; // Set the door open initially to draw attention to the shack
    }, 0);
    setTimeout(function() {
        shack.style.backgroundImage = null;
    }, 4000);
    
    // Border to transition into the water
    var beachDiv = document.createElement('div');
    beachDiv.id = 'beach';
    beachDiv.className = 'beach';
    beachDiv.style.left = LAND_WIDTH + 'px';
    
    // Put it all together
    addChild(pierDiv);
    addChild(landDiv);
    addChild(beachDiv);
    
    // Add a bunch of terrain to the land
    initLandObjects();
}

function initLandObjects() {
    var backgroundObjects = getDocumentWidth() * getDocumentHeight() / 30000; // Count of how many objects to make
    
    // Have a chance for a less or more populated map
    if (Math.random() >= 0.65) {
        if (Math.random() > 0.5) {
            backgroundObjects = backgroundObjects - (backgroundObjects / 3);
        }
        else {
            backgroundObjects = backgroundObjects + (backgroundObjects / 4.5);
        }
    }
    
    var fenceCount = 0;
    for (var backgroundLoop = 0; backgroundLoop < backgroundObjects; backgroundLoop++) {
        currentBackground = makeBackgroundObject(null, 'land');
        
        if (Math.random() >= 0.2) {
            if (Math.random() >= 0.15 || fenceCount >= 5) {
                if (Math.random() >= 0.45) {
                    currentBackground.src = './images/terrain/shell' + getRandomInt(1, 7) + '.png';
                    currentBackground.style.transform = 'rotate(' + getRandomInt(10, 360) + 'deg)';
                }
                else if (Math.random() >= 0.6) {
                    currentBackground.src = './images/terrain/plant' + getRandomInt(1, 3) + '.png';
                }
                else {
                    currentBackground.src = './images/terrain/grass' + getRandomInt(1, 2) + '.png';
                }
            }
            else {
                currentBackground.src = './images/terrain/fence.png';
                currentBackground.style.zIndex = 2;
                fenceCount++;
            }
        }
        // Major bigger terrain
        else {
            currentBackground.src = './images/terrain/sand_patch.png';
            currentBackground.style.zIndex = 1;
            currentBackground.style.transform = 'rotate(' + getRandomInt(10, 360) + 'deg)';
        }
        
        addChild(currentBackground);
    }
    
    // Palm trees
    var numTrees = getRandomInt(1, backgroundObjects/7);
    
    // Most of the time bump up the trees to avoid a lone palm tree
    if (Math.random() >= 0.2) {
        numTrees++;
    }
    // Also have a rare chance for a more dense forest
    if (Math.random() >= 0.95) {
        numTrees *= 2;
    }
    
    for (var i = 0; i < numTrees; i++) {
        applyLandObject('./images/terrain/palm' + getRandomInt(1,6) + '.png', 5);
    }
    
    // Unique single objects
    if (Math.random() > 0.85) {
        applyLandObject('./images/terrain/anvil.png', 3);
    }
    if (Math.random() > 0.8) {
        applyLandObject('./images/terrain/crater.png', 1, true);
    }
    if (Math.random() > 0.3) {
        applyLandObject('./images/terrain/bone' + getRandomInt(1, 2) + '.png', 3);
    }
    if (Math.random() > 0.8) {
        applyLandObject('./images/terrain/water_big' + getRandomInt(1, 2) + '.png', 1);
        if (Math.random() > 0.7) {
            applyLandObject('./images/terrain/water_big' + getRandomInt(1, 3) + '.png', 1);
        }
    }
    
    // Season effects
    var isHalloween = (new Date().getMonth() === 9);
    var isChristmas = (new Date().getMonth() === 11);
    if (isChristmas) {
        applyLandObject('./images/terrain/christmas_tree.png', 5);
    }
    if (isHalloween) {
        for (var i = 0; i < getRandomInt(15, 50); i++) {
            applyLandObject('./images/terrain/pumpkin' + getRandomInt(1, 3) + '.png', 4);
        }
    }
    
    // Weather effects
    if (isChristmas || (Math.random() > 0.89)) {
        var snowflakes = document.createElement('div');
        snowflakes.id = 'snowflakes';
        for (var i = 0; i < getRandomInt(10, 15); i++) {
            var type = Math.random();
            var currentSnowflake = document.createElement('div');
            currentSnowflake.className = 'snowflake';
            
            if (type <= 0.33) {
                currentSnowflake.innerHTML = '&#10052;';
            }
            else if (type <= 0.66) {
                currentSnowflake.innerHTML = '&#10053;';
            }
            else {
                currentSnowflake.innerHTML = '&#10054;';
            }
            snowflakes.appendChild(currentSnowflake);
        }
        document.body.appendChild(snowflakes);
    }
}

function initWater() {
    // The water area is clickable to cast your line into
    var waterDiv = document.createElement('div');
    waterDiv.id = 'water';
    waterDiv.className = 'water';
    waterDiv.style.width = getDocumentWidth() - LAND_WIDTH + 'px';
    waterDiv.style.left = LAND_WIDTH + 'px';
    waterDiv.addEventListener('click', clickToFish, true);
    
    addChild(waterDiv);
    
    // Add some terrain to the water
    initWaterObjects();
}

function initWaterObjects() {
    var backgroundObjects = getDocumentWidth() * getDocumentHeight() / 10000; // Count of how many objects to make
    
    // Background objects, a bit sparse in the water
    var islandCount = 0;
    var currentObject;
    for (var backgroundLoop = 0; backgroundLoop < backgroundObjects; backgroundLoop++) {
        if (Math.random() > 0.06) {
            currentObject = applyWaterObject('./images/terrain/sparkle' + getRandomInt(1, 3) + '.png', 1, true);
            currentObject.addEventListener('click', clickToFish, true);
            
            // Note we also put the opacity way down to blend in better
            currentObject.style.opacity = 0.2;
        }
        else {
            if (Math.random() > 0.7 && islandCount < 3) { // Cap at 3 islands
                islandCount++;
                
                currentObject = applyWaterObject('./images/terrain/island.png', 3);
                currentObject.style.cursor = 'not-allowed';
                if (Math.random() > 0.6) {
                    flipObject(currentObject);
                }
                
                // Rarely we can fish from an island, in which case we add a campfire to it
                if (!player.island && Math.random() > 0.9) {
                    player.island = currentObject;
                    
                    // Ensure the player island is well within the visible water
                    // Do this after a timeout so that the position is available
                    setTimeout(function() {
                        // Check that the boat isn't too close to the top
                        if (player.island.getBoundingClientRect().top <= ISLAND_HEIGHT) {
                            player.island.style.top = ISLAND_HEIGHT + 10 + 'px';
                        }
                        // Or to the bottom
                        else if (player.island.getBoundingClientRect().top >= getDocumentHeight()-ISLAND_HEIGHT) {
                            player.island.style.top = getDocumentHeight()-ISLAND_HEIGHT + 'px';
                        }
                        // Or to the far right edge
                        if (player.island.getBoundingClientRect().left >= getDocumentWidth()-(ISLAND_WIDTH*1.4)) {
                            player.island.style.left = getDocumentWidth()-(ISLAND_WIDTH*1.4) + 'px';
                        }
                        // Or too close to the shore/pier
                        if (player.island.getBoundingClientRect().left < (LAND_WIDTH + PIER_WIDTH)) {
                            player.island.style.left = LAND_WIDTH + PIER_WIDTH + 'px';
                        }
                        
                        // Now add our homely campfire
                        var campfire = document.createElement('img');
                        campfire.id = 'campfire';
                        campfire.className = 'wo';
                        campfire.src = './images/terrain/campfire.gif';
                        campfire.style.left = parseInt(player.island.style.left) + 15 + 'px';
                        campfire.style.top = player.island.style.top;
                        campfire.style.zIndex = 4;
                        addChild(campfire);
                    },0);
                }
            }
            else {
                currentObject = applyWaterObject('./images/terrain/shallow.png', 1, true);
                currentObject.addEventListener('click', clickToFish, true);
                currentObject.style.opacity = 0.8;
            }
        }
    }
    
    // Unique single objects
    if (Math.random() > 0.65) {
        // Chance for a double tree
        var treeCount = Math.random() > 0.8 ? 2 : 1;
        for (var i = 0; i < treeCount; i++) {
            currentObject = applyWaterObject('./images/terrain/submerged_tree.png', 2);
            currentObject.addEventListener('click', clickToFish, true);
            // Flip the second tree for some variety, most of the time
            if (i % 2 === 0 && Math.random() > 0.1) {
                flipObject(currentObject);
            }
        }
    }
    
    // Boat (most of the time)
    if (Math.random() > 0.3) {
        initBoat();
    }
}

function initBoat() {
    var boat = makeBackgroundObject('./images/boat.png', 'water');
    
    // Ensure the boat is within the visible water, in case we put our player on it
    // Do this after a timeout so that the position is available
    setTimeout(function() {
        // Check that the boat isn't too close to the top
        if (boat.getBoundingClientRect().top <= BOAT_HEIGHT) {
            boat.style.top = BOAT_HEIGHT + 10 + 'px';
        }
        // Or to the bottom
        else if (boat.getBoundingClientRect().top >= getDocumentHeight()-BOAT_HEIGHT) {
            boat.style.top = getDocumentHeight()-BOAT_HEIGHT + 'px';
        }
        // Or to the far right edge
        if (boat.getBoundingClientRect().left >= getDocumentWidth()-(BOAT_WIDTH*1.4)) {
            boat.style.left = getDocumentWidth()-(BOAT_WIDTH*1.4) + 'px';
        }
        // Or too close to the shore/pier
        if (boat.getBoundingClientRect().left < (LAND_WIDTH + PIER_WIDTH)) {
            boat.style.left = LAND_WIDTH + PIER_WIDTH + 'px';
        }
    },0);
    
    // Finalize our boat styling, including sometimes flipping the image
    boat.style.cursor = 'not-allowed';
    boat.style.zIndex = 5;
    if (Math.random() > 0.75) {
        flipObject(boat);
    }
    
    addChild(boat);
    player.boat = boat;
}

/**
 * Horizontally flip the passed background object
 */
function flipObject(obj) {
    if (obj) {
        obj.style.transform = 'scaleX(-1)';
    }
}

function makeBackgroundObject(src, type) {
    var obj = document.createElement('img');
    obj.style.top = getRandomInt(0, getDocumentHeight()-10) + 'px';
    if (!type || type === 'water') {
        obj.style.left = getRandomInt(LAND_WIDTH+32, getDocumentWidth()-10) + 'px';
        obj.className = 'wo';
    }
    else if (type === 'land') {
        obj.style.left = getRandomInt(0, LAND_WIDTH-40) + 'px';
        obj.className = 'bo';
    }
    if (src) {
        obj.src = src;
    }
    return obj;
}

function applyLandObject(src, zIndex, rotate) {
    return applyBackgroundObject(src, zIndex, rotate, 'land');
}

function applyWaterObject(src, zIndex, rotate) {
    return applyBackgroundObject(src, zIndex, rotate, 'water');
}

function applyBackgroundObject(src, zIndex, rotate, type) {
    var obj = makeBackgroundObject(src, type);
    if (typeof zIndex !== 'undefined') {
        obj.style.zIndex = zIndex;
    }
    if (rotate) {
        obj.style.transform = 'rotate(' + getRandomInt(10, 360) + 'deg)';
    }
    addChild(obj);
    return obj;
}
