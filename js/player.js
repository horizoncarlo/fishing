var DEFAULT_BAIT = 10;
var currentCast = {
    castFrame: null,
    castIteration: 0,
    castMultiplicator: 1,
    x: 0,
    y: 0,
    accuracy: 0,
};
var player = {
    day: 1,
    bait: DEFAULT_BAIT,
    caught: 0,
    money: 0,
    totalCaught: 0,
    soundOn: true,
    avatar: {},
    // div, img, bobber, castBar, boat, pier, island
};

function initPlayer() {
    player.avatar = {
        idle: './images/player/idle.gif',
        move: './images/player/move.gif',
        wait: './images/player/wait.gif',
        hook: './images/player/hook.gif',
        width: '48px',
        height: '48px'
    };
    if (!player.name) {
        player.name = getRandomName();
    }
    
    player.div = document.createElement('div');
    player.div.id = 'player';
    player.div.title = 'Click to cancel your current line';
    // We hardcode the styling here because we manipulate the player class later for hovering
    player.div.style.position = 'absolute';
    player.div.style.left = '30px'; // Start outside the hut, but we'll quickly move to our starting location
    player.div.style.top = '60px';
    player.div.style.zIndex = 300;
    player.div.style.width = player.avatar.width;
    player.div.style.height = player.avatar.height;
    
    // Reel in any line if we have one out when we click on our player
    player.div.addEventListener('click', function(e) {
        stopFishing(true);
    });
    
    var image = document.createElement('img');
    player.image = image;
    setIdleAnimation();
    player.div.appendChild(player.image);
    
    addChild(player.div);
    
    // Setup some other elements for future use
    initBarrel();
    initBobber();
    initCastBar();
    updateScoreboard();
    
    // Initial help message
    if (player.day <= 1) {
        setTimeout(function() {
            showLongMessage('For options left/right click your shack');
        }, 1000);
    }
}

function retirePlayer(button) {
    // If we already have a night up ignore this, as they could be spamming Spacebar on the Retire button
    if (document.getElementById('night')) {
        return;
    }
    
    // If the player has never caught anything just retire them instantly
    if (player.totalCaught <= 0 && player.caught <= 0) {
        stopFishing(true);
        resetAndReload();
        return;
    }
    
    // Confirm with the player
    // This will change the text of the button and abort the process
    // If the user clicks again then the process will continue
    // Otherwise if they do something else (like fish) the button will reset automatically as part of the scoreboard updating
    if (button && button.innerHTML === 'Retire') {
        button.innerHTML = 'Confirm!';
        return;
    }
    
    // Cancel any fishing
    stopFishing(true);
    
    // Calculate any extra current earnings for retirement
    // No need to update the scoreboard as we just display on the final screen then clear
    player.money += calculateEarned();
    
    // Show the twilight of their years
    var night = document.createElement('div');
    night.id = 'night';
    night.className = 'nightOverlay nightRetire';
    night.style.opacity = 0;
    var closeText = document.createElement('div');
    closeText.className = 'retireMessage';
    closeText.innerHTML = player.name + ' retires with <b style="color: goldenrod;">$' + Number(player.money).toLocaleString() + '</b> from <b>' + Number(player.totalCaught).toLocaleString() + '</b> fish after <b>' + Number(player.day).toLocaleString() + '</b> day' + (player.day !== 1 ? 's' : '') + '...';
    var retireImg = document.createElement('img');
    retireImg.className = 'retireImage';
    retireImg.src = './images/retirement.jpg';
    night.appendChild(closeText);
    night.appendChild(retireImg);
    addChild(night);
    
    // Fade in the night sky
    setTimeout(function() {
        night.style.opacity = 1;
    }, 10);
    
    // Reset our values, store them, and refresh the page
    setTimeout(function() {
        resetAndReload();
    }, 7000);
}

function resetAndReload() {
    player.name = getRandomName();
    player.day = 1;
    player.bait = DEFAULT_BAIT;
    player.caught = 0;
    player.money = 0;
    player.totalCaught = 0;
    updateScoreboard();
        
    location.reload();
}

function initBarrel() {
    var barrel = document.createElement('img');
    barrel.id = 'barrel';
    barrel.className = 'barrel';
    barrel.style.display = 'none';
    addChild(barrel);
}

function updateBarrelImage() {
    var barrel = document.getElementById('barrel');
    if (barrel) {
        if (player.caught > 0) {
            barrel.src = './images/barrel-fish.png';
        }
        else {
            barrel.src = './images/barrel-empty.png';
        }
        
        // Place the barrel slightly behind the player
        barrel.style.top = parseInt(player.div.style.top) + (parseInt(player.avatar.height)/2) + 'px';
        barrel.style.left = parseInt(player.div.style.left) - (parseInt(player.avatar.width)/2) + 'px';
        barrel.style.display = 'block';
    }
}

function initBobber() {
    var bobber = document.createElement('img');
    bobber.className = 'bobber';
    bobber.addEventListener('click', clickToFish, true);
    
    // Store our bobber for future reference
    player.bobber = bobber;
    
    // Add the bobber, then hide it until we need it
    addChild(player.bobber);
    hideBobber();
}

function initCastBar() {
    var castBarWrap = document.createElement('div');
    castBarWrap.className = 'castBarWrap';
    castBarWrap.addEventListener('click', clickToFish, true);
    
    var castRod = document.createElement('img');
    castRod.className = 'castRod';
    castRod.src = './images/rods/rod' + getRandomInt(1, 5) + '.png';
    
    var castBarFill = document.createElement('div');
    castBarFill.id = 'fill';
    castBarFill.className = 'castBar';
    
    // Store our cast bar for future reference
    player.castBar = castBarWrap;
    
    // Add the cast bar, then hide it until we need it
    castBarFill.appendChild(castRod);
    castBarWrap.appendChild(castBarFill);
    addChild(castBarWrap);
    hideCastBar();
}

/**
 * After we have clicked to fish we need to charge up our line, then cast it
 */
function clickToFish(e) {
    // If we have our trophy dialog open just close it
    if (isTrophyVisible()) {
        hideTrophy();
        return;
    }
    
    // Determine if we have a hit, if so reel it in
    // Otherwise clean up any old line and progress
    if (!hasHit) {
        stopFishing();
        
        // If we have an existing cast bar the click should lock in our current cast accuracy
        if (player.castBar && player.castBar.style.visibility === 'visible') {
            stopCastBar();
            
            // Round our cast accuracy
            currentCast.accuracy = Math.ceil(currentCast.accuracy);
            var msg = currentCast.accuracy + '% Accuracy';
            if (currentCast.accuracy >= 100) {
                msg += ' (Great!)';
            }
            showMessage(msg);
            
            // Unfortunately really hardcoded location for our line start point, due to
            //  the fisherman image we use and how we want to have the rod match
            drawFishingLine(player.div.getBoundingClientRect().left+43, player.div.getBoundingClientRect().top+48,
                            currentCast.x, currentCast.y);
            showBobber(currentCast.x, currentCast.y);
            setWaitAnimation();
            
            // Allow a gold highlight to cancel our line
            player.div.className = 'player';
            
            // Now start the fishing timer
            startFishing();
        }
        // Otherwise show a cast bar
        else {
            // If we came from a key press instead of a mouse click, we want to show the bar over our head
            if (e.fromKey) {
                startCastBar(player.div.getBoundingClientRect().left,
                             parseInt(player.div.getBoundingClientRect().top) - 30);
                
                // Also reset our x/y to the value we got from the key event
                currentCast.x = e.clientX;
                currentCast.y = e.clientY;
            }
            else {
                startCastBar(e.clientX, e.clientY);
            }
            setMoveAnimation();
        }
    }
    else {
        // Caught something, reel it in
        cancelFishingTimers();
        setHookAnimation();
        showQTE();
    }
    
    // Hide our menu if we can
    closeShackMenu();
    
    // Clear any helper timer once we've fished once
    if (helperTimeout) {
        clearTimeout(helperTimeout);
        helperTimeout = null;
    }
}

function startCastBar(x, y) {
    if (player.castBar) {
        // Check if we have bait left to use
        // If not we start a new day and reload
        if (player.bait-1 < 0) {
            newDay();
            return;
        }
        
        // Use a bait
        incrementScoreboard(-1);
        
        // Reset various state variables
        currentCast.x = x;
        currentCast.y = y;
        currentCast.castMultiplicator = 1; // Filling up
        currentCast.castIteration = 0;
        currentCast.accuracy = 0;
        
        // Stop any existing instance, then show a fresh one
        stopCastBar();
        showCastBar();
        
        // Start animating the cast bar
        currentCast.castFrame = requestAnimationFrame(performCastBar);
    }
}

function performCastBar() {
    // Increase/decrease our cast by the desired step
    var currentStep = difficulty.CAST_STEP;
    if (difficulty.CAST_SPEEDUP > 0) {
        currentStep += (currentCast.castIteration * difficulty.CAST_SPEEDUP);
    }
    // Hard cap the step at 3x the original, to ensure we don't go to an unusable speed
    if (currentStep/3 > difficulty.CAST_STEP) {
        currentStep = difficulty.CAST_STEP * 3;
    }
    currentCast.accuracy += currentStep * currentCast.castMultiplicator;
    
    // If we're over 100% Accuracy then start the bar going the other way
    if (currentCast.accuracy >= 100) {
        currentCast.castMultiplicator *= -1;
        currentCast.accuracy = 100;
        currentCast.castIteration++;
    }
    // Same for 0 or below, start climbing back up
    else if (currentCast.accuracy <= 0) {
        currentCast.castMultiplicator *= -1;
        currentCast.accuracy = 0;
    }
    
    var fill = document.getElementById('fill');
    if (fill) {
        fill.style.width = currentCast.accuracy + '%';
        
        // Change our color based on cast accuracy
        if (currentCast.accuracy >= 95) {
            fill.style.backgroundColor = '#FFFFFF';
        }
        else if (currentCast.accuracy >= 65) {
            fill.style.backgroundColor = '#00FF00';
        }
        else if (currentCast.accuracy <= 55 && currentCast.accuracy > 25) {
            fill.style.backgroundColor = '#00BF00';
        }
        else if (currentCast.accuracy <= 25) {
            fill.style.backgroundColor = '#008000';
        }
    }
    
    // Stall the cast at the top for a bit to provide a forgiving window
    if (difficulty.CAST_TOPWAIT_MS > 0 && currentCast.accuracy === 100) {
        setTimeout(function() {
            // Just in case we cancelled our cast while waiting in this timeout
            if (currentCast.castFrame) {
                currentCast.castFrame = requestAnimationFrame(performCastBar);
            }
        }, difficulty.CAST_TOPWAIT_MS);
    }
    // Otherwise continue casting
    else {
        currentCast.castFrame = requestAnimationFrame(performCastBar);
    }
}

function stopCastBar() {
    if (currentCast.castFrame) {
        cancelAnimationFrame(currentCast.castFrame);
        currentCast.castFrame = null;
        
        setIdleAnimation();
    }
    
    hideCastBar();
    
    if (document.getElementById('fill')) {
        document.getElementById('fill').style.width = 0;
    }
}

function showCastBar() {
    if (player.castBar) {
        // Set our initial position based on where the cast is
        player.castBar.style.top = currentCast.y - (player.castBar.getBoundingClientRect().height/2) + 'px';
        player.castBar.style.left = currentCast.x - (player.castBar.getBoundingClientRect().width/2) + 'px';
        
        // Need to account for the cast bar being off the right/top/bottom of the screen
        var heightPad = player.castBar.getBoundingClientRect().height;
        var widthPad = player.castBar.getBoundingClientRect().width;
        heightPad += heightPad * 0.2;
        widthPad += widthPad * 0.1;
        if (parseInt(player.castBar.style.top) < 5) {
            player.castBar.style.top = '5px';
        }
        else if (parseInt(player.castBar.style.top) > (getDocumentHeight()-heightPad)) {
            player.castBar.style.top = getDocumentHeight()-heightPad + 'px';
        }
        if (parseInt(player.castBar.style.left) > (getDocumentWidth()-widthPad)) {
            player.castBar.style.left = getDocumentWidth()-widthPad + 'px';
        }
        
        // Then show our bar
        player.castBar.style.visibility = 'visible';
    }
}

function hideCastBar() {
    if (player.castBar) {
        player.castBar.style.visibility = 'hidden';
    }
}

function clearFishingLine() {
    // Clean up our old line
    var existingLine = document.getElementsByClassName('fl');
    if (existingLine && existingLine.length > 0) {
        var parent = document.getElementById('game');
        while (existingLine.length) {
            parent.removeChild(existingLine[0]);
        }
    }
}

function highlightFishingLine() {
    if (difficulty.CAST_ALLOW_COLOR) {
        colorFishingLine('red');
    }
}

function unhighlightFishingLine() {
    if (difficulty.CAST_ALLOW_COLOR) {
        colorFishingLine('#DDDDDD');
    }
}

function colorFishingLine(color) {
    // Clean up our old line
    var existingLine = document.getElementsByClassName('fl');
    if (existingLine && existingLine.length > 0) {
        for (var i = 0; i < existingLine.length; i++) {
            existingLine[i].style.backgroundColor = color;
        }
    }
}

/**
 * Thanks to https://jstutorial.medium.com/coding-your-first-algorithm-bc0fc2a4e862
 *  for a canvas-free way to draw a line
 */
function drawFishingLine(x1, y1, x2, y2) {
    // Iterators, counters required by algorithm
    let x, y, dx, dy, dx1, dy1, px, py, xe, ye, i;
    // Calculate line deltas
    dx = x2 - x1;
    dy = y2 - y1;
    // Create a positive copy of deltas (makes iterating easier)
    dx1 = Math.abs(dx);
    dy1 = Math.abs(dy);
    // Calculate error intervals for both axis
    px = 2 * dy1 - dx1;
    py = 2 * dx1 - dy1;
    // The line is X-axis dominant
    if (dy1 <= dx1) {
        // Line is drawn left to right
        if (dx >= 0) {
            x = x1;
            y = y1;
            xe = x2;
        } else { // Line is drawn right to left (swap ends)
            x = x2;
            y = y2;
            xe = x1;
        }
        pixel(x, y); // Draw first pixel
        // Rasterize the line
        for (i = 0; x < xe; i++) {
            x = x + 1;
            // Deal with octants...
            if (px < 0) {
                px = px + 2 * dy1;
            } else {
                if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
                    y = y + 1;
                } else {
                    y = y - 1;
                }
                px = px + 2 * (dy1 - dx1);
            }
            // Draw pixel from line span at
            // currently rasterized position
            pixel(x, y);
        }
    } else { // The line is Y-axis dominant
        // Line is drawn bottom to top
        if (dy >= 0) {
            x = x1;
            y = y1;
            ye = y2;
        } else { // Line is drawn top to bottom
            x = x2;
            y = y2;
            ye = y1;
        }
        pixel(x, y); // Draw first pixel
        // Rasterize the line
        for (i = 0; y < ye; i++) {
            y = y + 1;
            // Deal with octants...
            if (py <= 0) {
                py = py + 2 * dx1;
            } else {
                if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
                    x = x + 1;
                } else {
                    x = x - 1;
                }
                py = py + 2 * (dx1 - dy1);
            }
            // Draw pixel from line span at
            // currently rasterized position
            pixel(x, y);
        }
    }
}

function pixel(x, y) {
    var pixel = document.createElement('span');
    pixel.className = 'fl';
    pixel.style.left = x + 'px';
    pixel.style.top = y + 'px';
    addChild(pixel);
}

function showBobber(x, y) {
    // Hide any old bobber
    hideBobber();
    
    if (player.bobber) {
        player.bobber.src = './images/bobber_wait.gif';
        player.bobber.style.left = x-5 + 'px';
        player.bobber.style.top = y-5 + 'px';
        player.bobber.style.display = 'block';
    }
}

function hideBobber() {
    if (player.bobber) {
        player.bobber.style.display = 'none';
    }
}

function hidePlayer() {
    player.div.style.display = 'none';
}

function showPlayer() {
    player.div.style.display = 'block';
}

/**
 * Put the player on their fishing location
 * Normally this is on the pier
 * But there is a chance to also be in the boat or just on the shore or even rarely on an island
 */
function putPlayerOnHome() {
    // Pier
    if (!player.island && player.pier && Math.random() > 0.4) {
        player.div.style.top = player.pier.getBoundingClientRect().top + 'px';
        player.div.style.left = player.pier.getBoundingClientRect().left + PIER_WIDTH-PIER_WIDTH/2.8 + 'px';
    }
    // Boat or Shore or Island
    else {
        var removeBarrel = false;
        var removePier = false;
        var removeBoat = false;
        // Island
        if (player.island) { // Set randomly in setup.js, so not always what we do
            removeBoat = true;
            removeBarrel = true;
            player.div.style.top = player.island.getBoundingClientRect().top + (ISLAND_HEIGHT/4) + 'px';
            player.div.style.left = player.island.getBoundingClientRect().left + (ISLAND_WIDTH/2) + 'px';
        }
        // Boat
        else if (player.boat && Math.random() > 0.3) {
            player.div.style.top = player.boat.getBoundingClientRect().top - (BOAT_HEIGHT/3) + 'px';
            player.div.style.left = player.boat.getBoundingClientRect().left + (BOAT_WIDTH/3) + 'px';
        }
        // Shore
        else {
            removePier = true;
            removeBoat = true;
            removeBarrel = true;
            player.div.style.top = getRandomInt(50, getDocumentHeight()-50) + 'px';
            player.div.style.left = LAND_WIDTH - 10 + 'px';
        }
        
        // Remove our pier and boat if necessary, such as being on the shore or island
        if (removePier && player.pier) {
            deleteChild(player.pier);
        }
        if (removeBarrel && document.getElementById('barrel')) {
            deleteChild(document.getElementById('barrel'));
        }
        if (removeBoat && player.boat) {
            deleteChild(player.boat);
            
            // Add a beached boat
            var beachedBoat = applyLandObject('./images/boat_land.png', 3);
            if (Math.random() > 0.75) {
                flipObject(beachedBoat);
            }
        }
    }
}

/**
 * Draw a big (temporary) arrow over the player image
 */
function highlightPlayer() {
    var arrow = document.createElement('img');
    arrow.src = './images/arrow.gif';
    arrow.className = 'arrow';
    arrow.style.top = player.div.getBoundingClientRect().top - (parseInt(player.avatar.height, 10)/1.1) + 'px';
    arrow.style.left = player.div.getBoundingClientRect().left + 'px';
    addChild(arrow);
    
    // Fade out then remove the arrow after a bit
    setTimeout(function() {
        arrow.style.opacity = 0;
        setTimeout(function() {
            deleteChild(arrow);
        }, 3100);
    }, 3000);
}

function setMoveAnimation() {
    player.image.src = player.avatar.move;
}

function setWaitAnimation() {
    player.image.src = player.avatar.wait;
}

function setHookAnimation() {
    player.image.src = player.avatar.hook;
}

function setIdleAnimation() {
    player.image.src = player.avatar.idle;
}

function changeName() {
    var newName = window.prompt('Enter Your Name:', player.name);
    if (newName && typeof newName === 'string' && newName.trim().length > 0) {
        player.name = newName;
        updateScoreboard(); // Update our displayed name, and this will also store the name in local storage
    }
}
