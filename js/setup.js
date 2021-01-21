var helperTimeout;
var birdInterval;
var LAND_WIDTH = 300;
var PIER_WIDTH = 78; // Width (in pixels) of our pier image
var PIER_HEIGHT = 70; // Height (in pixels) of our pier image
var BOAT_WIDTH = 127;
var BOAT_HEIGHT = 61;
var ISLAND_HEIGHT = 96;
var ISLAND_WIDTH = 96;
var landColor = Math.random() <= 0.65 ? 'light' : 'dark'; // Base tileset for our land
var waterBrightness = Math.random() <= 0.75 ? 1 : getRandomFloat(0.5, 2); // Brightness filter to apply to the water and some related objects

/**
 * Primary entrypoint into the app from the onload of our body
 * This will set up the entire game through a ton of substeps
 */
function init() {
    // Bring focus to the body if possible, to help with keypress capturing
    document.body.focus();
    
    // Watch for keyup, to work well with kids who hold the Spacebar down to press it
    document.body.onkeyup = keypressListener;
    
    // Determine our land width as a percentage of the screen, up to a maximum
    LAND_WIDTH = getDocumentWidth()/2.6;
    if (LAND_WIDTH > 1000) {
        LAND_WIDTH = 1000;
    }
    
    // Determine if we're a returning player
    loadSession();
    
    // Setup our player, background, and land
    initPlayer();
    initLand();
    initWater();
    
    // Setup our audio ding for a fish hit
    initSound();
    
    // Make our scoreboard
    initScoreboard();
    
    // Put the player on their starting location
    // Do this in a timeout so the boat can initialize and so on
    setTimeout(function() {
        putPlayerOnHome();
        highlightPlayer();
    }, 10);
    
    // Apply our difficulty
    applyDifficulty(true);
    
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
    landDiv.style.backgroundImage = "url('./images/sand/" + landColor + "_base.png')";
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
    shack.style.backgroundImage = "url('./images/shack.png')"; // Set the door closed manually at first, to preload the image and prevent flicker later
    shack.addEventListener('click', toggleDifficulty);
    addChild(shack);
    
    // Now open the shack door to draw attention to it, then close it after a similar time as our red arrow over the player
    setTimeout(function() {
        shack.style.backgroundImage = "url('./images/shack-open.png')"; // Set the door open initially to draw attention to the shack
    }, 0);
    setTimeout(function() {
        shack.style.backgroundImage = null;
    }, 4000);
    
    // Border to transition into the water
    var beachDiv = document.createElement('div');
    beachDiv.id = 'beach';
    beachDiv.className = 'beach';
    beachDiv.style.backgroundImage = "url('./images/sand/" + landColor + "_edge.png')";
    beachDiv.style.left = LAND_WIDTH + 'px';
    
    // Potentially add a sun
    initSun();
    
    // Put it all together
    addChild(pierDiv);
    addChild(landDiv);
    addChild(beachDiv);
    
    // Add a bunch of terrain to the land
    initLandObjects();
    
    // Setup an interval of birds casually flying overhead
    initBirds();
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
    
    // Have some beaches without shells, which will use a lot of grass/plants instead
    // Also have a chance for tons of shells/plants
    var noShells = Math.random() < 0.2;
    var tonsLittle = Math.random() < 0.12;
    if (tonsLittle) {
        backgroundObjects *= 2;
    }
    
    // Have a max cap on wall-like objects (aka fences or dunes)
    // Normally we have a mixed version of both, but have a chance to have all of just one type, or none at all
    var wallCount = 0;
    var noWalls, allDunes, allFences;
    noWalls = Math.random() <= 0.15;
    if (!noWalls) {
        allDunes = Math.random() <= 0.2;
        if (!allDunes) {
            allFences = Math.random() <= 0.2;
        }
    }
    
    for (var backgroundLoop = 0; backgroundLoop < backgroundObjects; backgroundLoop++) {
        currentBackground = makeBackgroundObject(null, 'land');
        
        // Always put an alternative sand texture that matches our base color
        applyLandObject('./images/sand/' + landColor + '_accent' + getRandomInt(1, 2) + '.png', 0);
        applyLandObject('./images/sand/' + landColor + '_accent' + getRandomInt(1, 2) + '.png', 0);
        
        if (Math.random() >= 0.2 || (tonsLittle && Math.random() >= 0.12)) {
            if (Math.random() >= 0.15 || wallCount >= 5) {
                if (!noShells && Math.random() >= 0.42) {
                    currentBackground.src = './images/terrain/shell' + getRandomInt(1, 15) + '.png';
                    currentBackground.style.transform = 'rotate(' + getRandomInt(10, 360) + 'deg)';
                    // Shells are so small, so sometimes don't count them as an object
                    if (Math.random() >= 0.75) {
                        backgroundLoop--;
                    }
                }
                else if (Math.random() >= 0.58) {
                    currentBackground.src = './images/terrain/plant' + getRandomInt(1, 5) + '.png';
                    currentBackground.style.zIndex = 3;
                }
                else {
                    currentBackground.src = './images/terrain/grass' + getRandomInt(1, 6) + '.png';
                }
            }
            else if (!noWalls) {
                // Fence can be civilized (wooden structure) or a blown sand dune
                if (allFences || (!allDunes && Math.random() <= 0.55)) {
                    currentBackground.src = './images/terrain/fence.png';
                }
                else {
                    currentBackground.src = './images/terrain/dune.png';
                }
                currentBackground.style.zIndex = 2;
                wallCount++;
            }
        }
        // Major bigger terrain
        else {
            if (Math.random() <= 0.4 && landColor === 'light') {
                currentBackground.src = './images/terrain/blown.png';
            }
            else {
                currentBackground.src = './images/terrain/sand_patch.png';
                currentBackground.style.transform = 'rotate(' + getRandomInt(10, 360) + 'deg)';
            }
            currentBackground.style.zIndex = 1;
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
    if (Math.random() > 0.35) {
        applyLandObject('./images/terrain/bone' + getRandomInt(1, 4) + '.png', 3);
    }
    if (Math.random() > 0.8) {
        applyLandObject('./images/terrain/water_big' + getRandomInt(1, 2) + '.png', 1);
        if (Math.random() > 0.7) {
            applyLandObject('./images/terrain/water_big' + getRandomInt(1, 3) + '.png', 1);
        }
    }
    // TODO Add an animated crab
    
    // Seasonal effects
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

function initSun() {
    if (Math.random() >= 0.2) {
        var sun = applyLandObject('./images/sun.gif', 60);
        sun.id = 'sun';
        sun.className += ' sun';
        sun.style.left = 'auto';
        sun.style.right = getRandomFloat(0, 5) + '%';
        sun.style.top = getRandomFloat(0, 5) + '%';
    }
}

function initBirds() {
    // First make a bird right away, then start it on an interval
    makeBird();
    
    birdInterval = setInterval(function() {
        makeBird();
    }, 55000);
}

function makeBird() {
    /* TODO The birds are inspiring enough to make a whole separate game, especially with detailed and interesting flight patterns, maybe duck hunter style or more realistically a bird watcher trying to get a whole collection/checklist. For now keep the birds very simple. */
    
    // Sometimes have no bird
    if (Math.random() >= 0.2) {
        var bird = applyLandObject('./images/birds/' + getRandomBird(), 101);
        var flightSpeed = getRandomInt(20, 45);
        bird.style.left = '-40px';
        bird.className += ' bird';
        bird.style.animationDuration = flightSpeed + 's';
        bird.style.setProperty('--start', getDocumentWidth() + 40 + 'px');
        
        setTimeout(function() {
            deleteChild(bird);
        }, flightSpeed * 1000);
    }
}

function initWater() {
    // Note if the player hasn't passed a day keep the brightness normal so they get a traditional map
    if (player.day <= 1) {
        waterBrightness = 1;
    }
    
    // The water area is clickable to cast your line into
    var waterDiv = document.createElement('div');
    waterDiv.id = 'water';
    waterDiv.className = 'water';
    waterDiv.style.width = getDocumentWidth() - LAND_WIDTH + 'px';
    waterDiv.style.left = LAND_WIDTH + 'px';
    if (waterBrightness !== 1) {
        waterDiv.style.filter = 'brightness(' + waterBrightness + ')';
    }
    waterDiv.addEventListener('click', clickToFish, true);
    
    addChild(waterDiv);
    
    // Add some terrain to the water
    initWaterObjects();
}

function initWaterObjects() {
    var backgroundObjects = getDocumentWidth() * getDocumentHeight() / 10000; // Count of how many objects to make
    
    // Have a chance for nearly empty water, once the player has seen a normal map
    if (player.day > 1 && Math.random() >= 0.97) {
        backgroundObjects = getRandomInt(3, 10);
    }
    
    // Prep our weeds, shallows, islands, etc.
    var tonsWeeds = Math.random() < 0.2;
    var groupWeeds = Math.random() <= 0.4; // Group the weeds either out in the water or close to short, depending on weedsFar flag
    var weedsFar = getRandomBoolean();
    var noShallows = Math.random() >= 0.8;
    var islandCount = 0;
    var currentObject;
    var waterWidth = getDocumentWidth() - LAND_WIDTH; // Handy for calculations later
    
    for (var backgroundLoop = 0; backgroundLoop < backgroundObjects; backgroundLoop++) {
        if (Math.random() > 0.06) {
            if ((!tonsWeeds && Math.random() <= 0.87) || (tonsWeeds && Math.random() <= 0.2)) {
                currentObject = applyWaterObject('./images/terrain/sparkle' + getRandomInt(1, 3) + '.png', 0, true);
                
                // Note we also put the opacity way down to blend in better
                currentObject.style.opacity = getRandomFloat(0.1, 0.3);
                currentObject.style.filter = 'blur(' + getRandomFloat(0, 1.2) + 'px)';
                if (waterBrightness !== -1) {
                    currentObject.style.filter += ' brightness(' + waterBrightness + ')';
                }
            }
            else {
                currentObject = applyWaterObject('./images/terrain/weed' + getRandomInt(1, 2) + '.png', 0);
                if (getRandomBoolean()) {
                    flipObject(currentObject);
                }
                
                // A bit fancy, but we want to bring the weeds closer to the land
                if (groupWeeds &&
                    parseInt(currentObject.style.left) > (LAND_WIDTH + ((waterWidth / 2) * (weedsFar ? -1 : 1)))) {
                    currentObject.style.left = (parseInt(currentObject.style.left) - ((waterWidth / 2) * (weedsFar ? -1 : 1))) + 'px';
                }
                
                // Make the weeds appear at varying depths
                currentObject.style.opacity = getRandomFloat(0.1, 0.55);
                currentObject.style.filter = 'blur(' + ((1-currentObject.style.opacity)*1.3) + 'px)';
                if (waterBrightness !== -1) {
                    currentObject.style.filter += ' brightness(' + waterBrightness + ')';
                }
            }
            currentObject.addEventListener('click', clickToFish, true);
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
            else if (!noShallows) {
                currentObject = applyWaterObject('./images/terrain/shallow.png', 1, true);
                currentObject.addEventListener('click', clickToFish, true);
                currentObject.style.opacity = getRandomFloat(0.6, 0.9);
                currentObject.style.filter = 'blur(' + getRandomFloat(0, 2) + 'px)';
                if (waterBrightness !== -1) {
                    currentObject.style.filter += ' brightness(' + waterBrightness + ')';
                }
            }
        }
    }
    
    // Unique single objects
    if (Math.random() > 0.65) {
        // Chance for a double tree
        var treeCount = Math.random() > 0.8 ? 2 : 1;
        for (var i = 0; i < treeCount; i++) {
            currentObject = applyWaterObject('./images/terrain/submerged_tree' + getRandomInt(1, 3) +'.png', 2);
            currentObject.addEventListener('click', clickToFish, true);
            if (getRandomBoolean()) {
                flipObject(currentObject);
            }
        }
    }
    if (Math.random() > 0.8 && backgroundObjects > 10) {
        var lilyClumpTop = getRandomBoolean();
        var horizontalModifier = getRandomFloat(2.5, 6);
        var lilyCount = getRandomInt(2, backgroundObjects/15);
        for (var i = 0; i < lilyCount; i++) {
            currentObject = applyWaterObject('./images/terrain/lilypad' + getRandomInt(1, 4) + '.png', 4);
            currentObject.addEventListener('click', clickToFish, true);
            currentObject.style.opacity = 0.9;
            if (getRandomBoolean()) {
                flipObject(currentObject);
            }
            
            // Bring the lilypads closer to the shore
            if (parseInt(currentObject.style.left) > (LAND_WIDTH + (waterWidth / horizontalModifier))) {
                currentObject.style.left = LAND_WIDTH + getRandomInt(10, (waterWidth / horizontalModifier)) + 'px';
            }
            
            // Also clump the lilypads on the top
            if (lilyClumpTop) {
                if (parseInt(currentObject.style.top) > (getDocumentHeight()/4)) {
                    currentObject.style.top = getRandomInt(0, getDocumentHeight()/4) + 'px';
                }
            }
            // Or clump bottom
            else {
                if (parseInt(currentObject.style.top) < (getDocumentHeight()/1.5)) {
                    currentObject.style.top = getRandomInt(getDocumentHeight()/1.5, getDocumentHeight()) + 'px';
                }
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

function initScoreboard() {
    var scoreboard = document.createElement('div');
    scoreboard.id = 'scoreboard';
    scoreboard.className = 'scoreboard';
    addChild(scoreboard);
    
    updateScoreboard();
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

/**
 * Horizontally flip the passed background object
 */
function flipObject(obj) {
    if (obj) {
        obj.style.transform = 'scaleX(-1)';
    }
}

/**
 * A base64 encoded 'ding/beep' to play on fish hits
 */
function initSound() {
    try {
        window.beep = new Audio('data:audio/ogg;base64,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');
    } catch(e) { }
}
