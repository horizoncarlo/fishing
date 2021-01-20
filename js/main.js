/*
TODO:
- Get some more movement on the screen. Little crabs or lizards scurrying on land, a gentle bob/rock to the boat/pier, etc.
- Add more/different QTE events? Spamming the mouse scroll wheel could be interesting as it'd feel like reeling a fish in
-- Basically 'qte.onwheel = func' in 'showQTE'
- Add rain effect (https://codepen.io/arickle/pen/XKjMZY) instead of current snowflakes
- Expand fishing shack settings to a full menu?
-- Buy fishing rod upgrades? Like more power, slow charge (so easier to get perfect), etc.
-- Could choose/buy your bait for a certain subset of fishes (basically 1 poster each) at the start of the day?
- Add a basic help system of an animated bird (somewhere on land) who you can click and will give you tips and explain game mechanics (like "re-cast after you miss a fish")?
-- Speaking of birds should the flying ones we have just be the tip system? Simple and elegant...or they could give bait
- Have difficulty (and money reward) increase by a factor of what day it is?

UNLIKELY:
- Fish splashes in the water every so often, with a bonus to rarity/ease of catch if you cast right on the spot
-- Added stress, breaks flow of just casting when you want, always awkward to give a substantial bonus for without fish rarity
- Could consider having powerups in the water you hook, like old boots or tackle boxes or whatever, that give +bait or easier QTE for the next X times or whatever
-- Takes away from the purity of the game and has the same downsides as splashes
- Possibly have a "Barter" (or similar) button the night screen to re-roll your earnings?
-- Better for pacing to have night be a time to chill instead of mash a button
*/

var hasHit = false; // If we have a fish hit or not
var currentChance = 0; // Current chance for a fish hit on the line we have out
var fishingInterval, fishingTimeout, guaranteedTimeout, getawayTimeout, qteInterval; // Bunch of timers and intervals for async countdowns and so on
var fishingSkipInterval = 0; // How many intervals to skip at the moment
var qteCount = 0; // How many QTE we've done (pass or fail), used for softstart provided by difficulty
var qteAvailable = []; // Weighted array of QTE options
var currentQte = null; // Current state of the QTE puzzle
var mathSolution; // Current solution to a QTE math problem
var lightningRound = false; // Rarely have a super fast, super low count QTE

function keypressListener(e) {
    // Ignore if we're at a night
    if (document.getElementById('night')) {
        return;
    }
    
    if (e.code === 'Space') {
        if (typeof currentQte !== 'string') {
            // If we don't have a line out yet, randomly cast one
            // Alternatively if we have a cast bar going, this will lock in the accuracy
            // And finally if we're fishing already, this will reel in anything we have
            // This will all be done in the clickToFish handler
            var margin = 50;
            clickToFish({
                clientX: getRandomInt(LAND_WIDTH+margin, getDocumentWidth()-margin),
                clientY: getRandomInt(margin, getDocumentHeight()-margin),
                fromKey: true
            });
        }
    }
    else if (e.code === 'Escape' && (typeof currentQte === 'string' || isTrophyVisible())) {
        if (isTrophyVisible()) {
            hideTrophy();
        }
        else if (typeof currentQte === 'string') {
            failedQTE();
        }
    }
    else if (typeof currentQte === 'string') {
        var typed = String.fromCharCode(e.which);
        if (typed) {
            typed = typed.toLowerCase();
            
            // If this is a math problem (evident from having a + sign) we
            //  need to handle it a bit differently
            if (currentQte.indexOf('+') !== -1 && typeof mathSolution === 'string') {
                if (typed === mathSolution[0]) {
                    // Remove a trailing dash before we put our next character in
                    if (currentQte.indexOf('_') !== -1) {
                        currentQte = currentQte.substring(0, currentQte.indexOf('_'));
                    }
                    // If this is the first number we typed, put a space first
                    if (currentQte.indexOf('=') === currentQte.length-1) {
                        currentQte += ' ';
                    }
                    currentQte += typed + '_';
                    mathSolution = mathSolution.substring(1, mathSolution.length);
                    updateQTEText();
                }
            }
            else {
                if (typed === currentQte[0]) {
                    currentQte = currentQte.substring(1, currentQte.length);
                    updateQTEText();
                }
            }
            
            // QTE has been solved
            if (currentQte.length === 0 ||
                (typeof mathSolution === 'string' && mathSolution.length === 0)) {
                handleCaughtFish();
            }
        }
    }
}

function startFishing() {
    cancelFishingTimers();
    
    // Start with our default base chance
    // Modify by base chance * a factor of accuracy. So 100% Accuracy will double our initial chances
    // Getting exactly 100% Accuracy can also provide an additional bonus depending on difficulty
    currentChance = difficulty.FISHING_BASE_CHANCE;
    currentChance += (difficulty.FISHING_BASE_CHANCE * (currentCast.accuracy/100));
    if (difficulty.CAST_MAX_BONUS > 0) {
        currentChance += difficulty.CAST_MAX_BONUS;
    }
    
    // Apply our initial delay
    fishingTimeout = setTimeout(function() {
        // Start our guaranteed timeout
        if (difficulty.FISHING_WAIT_CAP > 0) {
            guaranteedTimeout = setTimeout(function() {
                gotHit();
            }, difficulty.FISHING_WAIT_CAP);
        }
        
        // Start the interval and check for hits
        fishingInterval = setInterval(function() {
            // Skip a few intervals if requested, such as after a fish got away
            if (fishingSkipInterval > 0) {
                fishingSkipInterval--;
                return;
            }
            
            // Only check if we don't have an existing fish hit on the line
            if (!hasHit) {
                if (Math.random() <= currentChance) {
                    // Mark that we have a hit
                    gotHit();
                }
                // On a failed hit, increase our chance of future hits
                else {
                    currentChance += difficulty.FISHING_HELP_CHANCE;
                }
            }
        }, difficulty.FISHING_INTERVAL);
    }, getRandomInt(difficulty.FISHING_INITIAL_DELAY_MIN, difficulty.FISHING_INITIAL_DELAY_MAX));
}

/**
 * Stop fishing, which means cancelling all timers,
 *  as well as reeling in our line, hiding the bobber, and resetting our animation
 * This also counts as reeling in the fish depending on our hasHit flag
 *
 * @param true to also hide/cancel the QTE dialog
 * @return true if a fish was caught
 */
function stopFishing(alsoHideQTE) {
    var toReturn = hasHit;
    
    cancelFishingTimers();
    
    if (alsoHideQTE) {
        hideQTE();
    }
    
    hasHit = false;
    clearFishingLine();
    hideBobber();
    setIdleAnimation();
    
    // Clear our hover effect
    player.div.className = '';
    
    return toReturn;
}

/**
 * Cancel our fishing interval, delay timeout, and guaranteed hit timeout
 */
function cancelFishingTimers() {
    if (fishingInterval) {
        clearInterval(fishingInterval);
        fishingInterval = null;
    }
    if (fishingTimeout) {
        clearTimeout(fishingTimeout);
        fishingTimeout = null;
    }
    if (guaranteedTimeout) {
        clearTimeout(guaranteedTimeout);
        guaranteedTimeout = null;
    }
    if (getawayTimeout) {
        clearTimeout(getawayTimeout);
        getawayTimeout = null;
    }
    if (qteInterval) {
        clearInterval(qteInterval);
        qteInterval = null;
    }
}

function gotHit() {
    // Once we get a hit, revert to our base chance
    // This DOESN'T factor in Accuracy, because if the player misses their hit they should recast
    // This only really matters if they don't try to reel the fish in, and just let it pass
    currentChance = difficulty.FISHING_BASE_CHANCE;
    
    // Stop our guaranteed timer as it's just for one hit
    if (guaranteedTimeout) {
        clearTimeout(guaranteedTimeout);
        guaranteedTimeout = null;
    }
    
    // Flag our hit
    hasHit = true;
    
    // Notify the player visually
    if (player.bobber) {
        player.bobber.src = './images/bobber_caught.gif';
    }
    highlightFishingLine();
    if (beep && difficulty.ALLOW_SOUND) {
        beep.play();
    }
    showMessage('Hit!');
    
    // Determine how long until the fish gets away
    // Accuracy is a factor here, giving us a flat bonus milliseconds per 1% Accuracy
    var getawayDelay = getRandomInt(difficulty.FISHING_GETAWAY_MIN, difficulty.FISHING_GETAWAY_MAX);
    if (difficulty.FISHING_GETAWAY_ACCURACY_MS > 0) {
        getawayDelay += (currentCast.accuracy * difficulty.FISHING_GETAWAY_ACCURACY_MS);
    }
    
    getawayTimeout = setTimeout(function() {
        gotAway();
    }, getawayDelay);
}

function gotAway() {
    hasHit = false;
    
    // Reset the visual indicators
    if (player.bobber) {
        player.bobber.src = './images/bobber_wait.gif';
    }
    unhighlightFishingLine();
    
    // Have a bit of a delay before we go back to checking
    if (difficulty.FISHING_SUBSEQUENT_SKIP > 0) {
        fishingSkipInterval = difficulty.FISHING_SUBSEQUENT_SKIP;
    }
    else {
        fishingSkipInterval = 0;
    }
    
    showMessage('Got Away');
}

function handleCaughtFish() {
    // Increment our catch
    incrementScoreboard(null, 1);
    
    // Stop fishing and show the catch
    stopFishing(true);
    showMessage('Caught Fish');
    
    // Setup our trophy dialog
    var trophy = document.getElementById('trophy');
    if (!trophy) {
        trophy = document.createElement('div');
        trophy.id = 'trophy';
        trophy.className = 'trophy';
        addChild(trophy);
    }
    
    // Hide until we're ready
    trophy.style.visibility = 'hidden';
    
    // Update our trophy content
    var caughtFish = getRandomFish();
    var filterHue = Math.random() <= 0.35 ? 0 : getRandomInt(1, 360);
    trophy.innerHTML = 'You caught a <b>' + caughtFish.name + '</b><br/>' +
                       '<img onload="resizeTrophy()"' + 
                       '     src="' + caughtFish.path + '" class="trophyImg"' +
                       '     style="filter: hue-rotate(' + filterHue + 'deg); max-width: ' + Math.floor(getDocumentWidth()-100) + 'px; max-height: ' + Math.floor(getDocumentHeight()-300) + 'px;"/>' +
                       '<br/>' +
                       '<button onclick="hideTrophy()" class="takeButton"><img src="./images/hook.png" class="trophyHook shake"/>&nbsp;Take</button>';
}

function resizeTrophy() {
    var trophy = document.getElementById('trophy');
    if (trophy) {
        trophy.style.top = (getDocumentHeight() - trophy.getBoundingClientRect().height)/2 + 'px';
        trophy.style.left = (getDocumentWidth() - trophy.getBoundingClientRect().width)/2 + 'px';
        
        setTimeout(function() {
            trophy.style.visibility = 'visible';
        }, 0);
    }
}

function hideTrophy() {
    if (document.getElementById('trophy')) {
        document.getElementById('trophy').style.visibility = 'hidden';
    }
}

function isTrophyVisible() {
    return document.getElementById('trophy') &&
           document.getElementById('trophy').style.visibility !== 'hidden';
}

function failedQTE() {
    hasHit = false;
    stopFishing(true);
    showMessage('Got Away');
}

function showQTE() {
    var qte = document.getElementById('qte');
    if (!qte) {
        qte = document.createElement('div');
        qte.id = 'qte';
        qte.className = 'qte';
        
        var qteTip = document.createElement('span');
        qteTip.className = 'qteTip';
        qteTip.innerHTML = 'Reel in the Catch...';
        
        var qteText = document.createElement('span');
        qteText.id = 'text';
        qteText.className = 'qteText';
        
        var qteProgress = document.createElement('div');
        qteProgress.id = 'progress';
        qteProgress.className = 'qteProgress';
        
        qte.appendChild(qteTip);
        qte.appendChild(qteText);
        qte.appendChild(qteProgress);
        
        addChild(qte);
    }
    
    // Restore any timer color and progress
    var progress = qte.querySelector('#progress');
    if (progress) {
        progress.style.backgroundColor = 'white';
        progress.style.width = null;
    }
    
    // Set our QTE contents
    currentQte = makeQTEPuzzle();
    updateQTEText();
    qte.focus();
    
    setTimeout(function() {
        qte.style.top = (getDocumentHeight() - qte.getBoundingClientRect().height)/2 + 'px';
        qte.style.visibility = 'visible';
        
        // Start the reel timer
        if (qteInterval) {
            clearInterval(qteInterval);
            qteInterval = null;
        }
        
        var intervalMs = difficulty.QTE_INTERVAL;
        if (lightningRound) {
            intervalMs /= 10;
        }
        
        qteInterval = setInterval(function() {
            updateQTEProgress();
        }, intervalMs);
    }, 0);
}

function hideQTE() {
    if (document.getElementById('qte')) {
        document.getElementById('qte').style.visibility = 'hidden';
    }
    
    // Reset our data too
    mathSolution = null;
    currentQte = null;
    lightningRound = false;
}

/**
 * Update the HTML of the QTE text shown on the dialog
 */
function updateQTEText(text) {
    var qte = document.getElementById('qte');
    if (qte) {
        var textEle = qte.querySelector('#text');
        text = text ? text : currentQte;
        textEle.innerHTML = text;
        
        // Also a bit of a hack, but change the font if it's a math formula
        if (text.indexOf('+') !== -1) {
            textEle.style.fontFamily = 'monospace';
            textEle.style.letterSpacing = 'normal';
        }
        else {
            textEle.style.fontFamily = 'CarpalTunnel';
            textEle.style.letterSpacing = '40px';
        }
    }
}

function updateQTEProgress() {
    var qte = document.getElementById('qte');
    if (qte) {
        var progress = qte.querySelector('#progress');
        if (progress) {
            if (!progress.style.width) {
                progress.style.width = '100%';
            }
            var currentWidth = parseInt(progress.style.width);
            currentWidth -= difficulty.QTE_STEP;
            
            if (currentWidth <= 20) {
                progress.style.backgroundColor = 'red';
            }
            
            if (currentWidth <= 0) {
                currentWidth = 0;
                failedQTE();
            }
            progress.style.width = currentWidth + '%';
        }
    }
}

/**
 * Leverage our difficulty settings to make a proper QTE
 */
function makeQTEPuzzle() {
    qteCount++;
    mathSolution = null;
    
    // If we haven't setup our array of options, do so now
    if (qteAvailable || qteAvailable.length === 0) {
        qteAvailable = makeQTEArray();
    }
    
    var toReturn = '';
    var minlength = difficulty.QTE_MIN;
    var maxlength = difficulty.QTE_MAX;
    
    // If we have a soft start buffer remaining, just use the minimum count as the max
    if (qteCount <= difficulty.QTE_SOFTSTART) {
        maxlength = minlength;
    }
    
    // Determine if we lucked out and get the same answer for all prompts
    var isLucky = false;
    if (difficulty.QTE_LUCKYCHANCE > 0) {
        isLucky = Math.random() < (difficulty.QTE_LUCKYCHANCE/100);
    }
    
    // First determine if we're doing a math type (or even if it's allowed)
    // Also we never have a Lucky math, as it defeats the same value concept
    if (!isLucky &&
        difficulty.QTE_TYPES.indexOf('math') !== -1 &&
        Math.random() <= (difficulty.QTE_MATH_CHANCE/100)) {
        var num1 = getRandomInt(difficulty.QTE_MATH_MIN, difficulty.QTE_MATH_MAX);
        var num2 = getRandomInt(difficulty.QTE_MATH_MIN, difficulty.QTE_MATH_MAX);
        mathSolution = num1 + num2 + ''; // Store as a string for easier matching
        return num1 + ' + ' +
               num2 + ' = ';
    }
    else {
        var count = getRandomInt(minlength, maxlength);
        
        // Determine if we're doing a lightning round
        // This can only happen on existing difficulties with a minimum QTE length of more than 1
        // Then we use the minimum QTE - 1, but have much less time to solve
        if (difficulty.QTE_MIN > 1 && Math.random() > 0.95) {
            lightningRound = true;
            count = difficulty.QTE_MIN-1;
        }
        
        for (var i = 0; i < count; i++) {
            var type = qteAvailable[getRandomInt(0, qteAvailable.length-1)];
            if (type === 'lowNumbers') {
                toReturn += getRandomInt(1, 5);
            }
            else if (type === 'highNumbers') {
                toReturn += getRandomInt(6, 9);
            }
            else if (type === 'letters') {
                toReturn += getRandomLetter();
            }
            
            // If we're lucky then replicate the value we just generated to our desired length
            // Then return that value
            if (isLucky && toReturn[0]) {
                var replicate = toReturn[0];
                for (var lucky = i+1; lucky < count; lucky++) {
                    toReturn += replicate;
                }
                return toReturn;
            }
        }
    }
    
    return toReturn;
}

/**
 * Create an array for weighted randomness
 * Basically distribute different QTE types based on how often they should appear
 */
function makeQTEArray() {
    var toReturn = [];
    
    if (difficulty.QTE_TYPES.indexOf('lowNumbers') !== -1 &&
        difficulty.QTE_LOWNUMBERS > 0) {
        toReturn = addToArray(toReturn, 'lowNumbers', difficulty.QTE_LOWNUMBERS);
    }
    if (difficulty.QTE_TYPES.indexOf('highNumbers') !== -1 &&
        difficulty.QTE_HIGHNUMBERS > 0) {
        toReturn = addToArray(toReturn, 'highNumbers', difficulty.QTE_HIGHNUMBERS);
    }
    if (difficulty.QTE_TYPES.indexOf('letters') !== -1 &&
        difficulty.QTE_LETTERS > 0) {
        toReturn = addToArray(toReturn, 'letters', difficulty.QTE_LETTERS);
    }
    
    return toReturn;
}

/**
 * Convenience function to update the scoreboard with an incremental change
 * So you could pass -1 to reduce the player's bait, for example
 */
function incrementScoreboard(baitChange, caughtChange) {
    if (typeof baitChange === 'number') {
        player.bait += baitChange;
        
        // Notify if we're down to our last bait
        if (player.bait === 0) {
            showMessage('Last cast today');
        }
    }
    if (typeof caughtChange === 'number') {
        player.caught += caughtChange;
        player.totalCaught += caughtChange;
        if (player.caught <= 0) {
            player.caught = 0;
        }
        if (player.totalCaught <= 0) {
            player.totalCaught = 0;
        }
    }
    updateScoreboard();
}

function updateScoreboard() {
    // Store our update
    saveSession();
    
    var scoreboard = document.getElementById('scoreboard');
    if (scoreboard) {
        scoreboard.innerHTML = '<table width="100%">' +
                               '<tr><th colspan="2">Day ' + player.day + '</th></tr>' +
                               '<tr><td width="80%">Bait Left:</td>' +
                               '<td class="scoreNum" width="20%" style="color: ' + (player.bait <= 1 ? 'red' : 'black') + ';">' + player.bait + '</td></tr>' +
                               '<tr><td>Fish Caught:</td>' +
                               '<td class="scoreNum">' + player.caught + '</td></tr>' +
                               '<tr><td>Money:</td>' +
                               '<td class="scoreNum">$' + Number(player.money).toLocaleString() + '</td></tr>' +
                               '<tr><td colspan="2" align="center"><button onclick="retirePlayer(this)" title="Retire to clear your statistics and start over">Retire</button></td></tr>' +
                               '</table>';
    }
}

function toggleDifficulty() {
    // Stop fishing to get a clean slate for difficulty change
    stopFishing(true);
    
    // Change the difficulty
    difficulty.current++;
    if (difficulty.current > 3) {
        difficulty.current = 0;
    }
    
    // Store our update
    saveSession();
    
    // Apply our difficulty
    applyDifficulty(true);
    
    // Notify, in case the fishy visual indicator isn't clear enough
    showMessage('Difficulty ' + difficulty.current);
}

function newDay() {
    // Get our earnings
    var earned = calculateEarned();
    
    var night = document.createElement('div');
    night.id = 'night';
    night.className = 'nightOverlay';
    night.style.opacity = 0;
    
    // Note if we got a perfect day (used all bait) and also show our earnings
    var closeText = document.createElement('div');
    closeText.innerHTML = (player.caught >= DEFAULT_BAIT ? 'Perfect day ' : 'Day ') + player.day + ' draws to a close...';
    var earnText = document.createElement('div');
    earnText.className = 'nightEarn';
    earnText.innerHTML = 'You earned $' + Number(earned).toLocaleString();
    
    night.appendChild(closeText);
    night.appendChild(earnText);
    addChild(night);
    
    // Fade in the night sky
    setTimeout(function() {
        night.style.opacity = 1;
    }, 10);
    
    // Store fresh bait and the new day value, etc.
    // Refresh after a few seconds, which will put the player in a new location
    setTimeout(function() {
        player.day++;
        player.bait = DEFAULT_BAIT;
        player.caught = 0;
        player.money += earned;
        updateScoreboard();
            
        location.reload();
    }, 4000);
}
