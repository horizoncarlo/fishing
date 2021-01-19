// TODO:
/*
- Add rain effect (https://codepen.io/arickle/pen/XKjMZY) instead of current snowflakes
- Can eventually add a money/points system
- Scoreboard of casts/bait used vs fish caught?
- Buy fishing rod upgrades? Like more power, slow charge (so easier to hit), etc. Or buy different baits?
- Expand fishing shack settings to a full menu
- Add a basic help system of an animated bird who you can click and will give you tips and explain game mechanics (like "re-cast after you miss a fish")?
- Fantastical fish to catch, not just basic stuff
- Fish splashes in the water every so often, with a bonus to rarity/ease of catch if you cast right on the spot
- Sometimes get a fast QTE round with only a single item, but barely any time to react?
- Local storage for some persistence?
*/

var hasHit = false;
var currentChance = 0;
var fishingInterval, fishingTimeout, guaranteedTimeout, getawayTimeout, qteInterval;
var fishingSkipInterval = 0;
var qteCount = 0;
var qteAvailable = []; // Weighted array of QTE options
var currentQte = null;
var mathSolution;

function keypressListener(e) {
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
    else if (e.code === 'Escape' && typeof currentQte === 'string') {
        failedQTE();
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
                mathSolution = null;
                currentQte = null;
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
 * @return true if a fish was caught
 */
function stopFishing() {
    var toReturn = hasHit;
    
    cancelFishingTimers();
    
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
    stopFishing();
    hideQTE();
    showMessage('Caught Fish');
    
    // TODO Caught fish dialog
}

function failedQTE() {
    hasHit = false;
    stopFishing();
    hideQTE();
    showMessage('Got Away');
}

function showQTE() {
    // TODO Change to random water/ocean background for each QTE
    
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
        qteInterval = setInterval(function() {
            updateQTEProgress();
        }, difficulty.QTE_INTERVAL);
    },0);
}

function hideQTE() {
    if (document.getElementById('qte')) {
        document.getElementById('qte').style.visibility = 'hidden';
    }
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

function toggleDifficulty() {
    // Stop fishing to get a clean slate for difficulty change
    hideQTE();
    stopFishing();
    
    // Change the difficulty
    difficulty.current++;
    
    // Loop around back to easiest
    if (difficulty.current > 3) {
        difficulty.current = 0;
    }
    
    // Apply our difficulty
    applyDifficulty();
    
    // Notify, in case the fishy visual indicator isn't clear enough
    showMessage('Difficulty ' + difficulty.current);
    
    // Add more fish to show our difficulty
    var shack = document.getElementById('shack');
    if (shack) {
        var currentFish = document.getElementsByClassName('hangingFish');
        if (currentFish && currentFish.length > 0) {
            while (currentFish.length) {
                deleteChild(currentFish[0]);
            }
        }
        
        if (difficulty.current > 0) {
            for (var j = 0; j < difficulty.current; j++) {
                var fish = applyLandObject('./images/hanging_fish.png', 11);
                fish.className += ' hangingFish';
                
                // Unfortunately have to hardcode our position to line up with the shack
                fish.style.top = 70 - (j * 10) + 'px';
                fish.style.left = 70 - (j * 1) + 'px';
            }
        }
    }
}