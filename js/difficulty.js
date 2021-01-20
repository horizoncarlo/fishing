var difficulty = {
    current: 0, // 0 = for kids, 1 = easy, 2 = medium, 3 = hard, with room to grow
    ALLOW_SOUND: true, // Have a 'ding/beep' sound play with a fish hit. Turning on is easier.
    QTE_SOFTSTART: 0, // How many QTE events to be softer/easier before the real values kick in. Set to 0 to disable. Higher will be easier.
    QTE_LUCKYCHANCE: 0, // Percent chance to get a "lucky" QTE, which is all the same button to be pressed. Set to 0 to disable. Higher will be easier.
    QTE_MIN: 1, // Minimum QTE events to pass to catch a fish
    QTE_MAX: 2, // Maximum QTE events to pass to catch a fish
    QTE_TYPES: [ 'lowNumbers' ], // Allowed types of QTE events: lowNumbers (1-5), highNumbers (6-0), letters (a-z), math (addition)
    QTE_LOWNUMBERS: 100, // Weighted percent of how likely each QTE is. The total of all allowed types should equal 100
    QTE_HIGHNUMBERS: 0,
    QTE_LETTERS: 0,
    QTE_MATH_CHANCE: 10, // Math is a bit different as it's not mixed into an existing QTE, but is a separate event. Therefore the percent chance here is for a math (addition). 100 minus this percent is the chance for a combination of any other supported types
    QTE_MATH_MIN: 1,
    QTE_MATH_MAX: 5,
    QTE_INTERVAL: 100, // How often (in milliseconds) the QTE timer should go down. Higher is easier.
    QTE_STEP: 0.01, // What percent the QTE timer should go down each interval. Higher is harder.
    CAST_INTERVAL: 1, // How often (in milliseconds) the cast should go up/down. Higher is easier.
    CAST_STEP: 0.5, // What percent the cast should move up each interval. Higher is harder.
    CAST_SPEEDUP: 0.1, // How much to speed up on each iteration of the cast bar. Set to 0 to disable speedup. Higher is harder.
    CAST_TOPWAIT: 40, // How many intervals to skip/wait once the cast reaches the top. This provides a small window to make it easier to get max cast. Put to 0 for no wait. Higher is easier.
    CAST_MAX_BONUS: 0, // Potential extra bonus if perfect accuracy is achieved. Works out to percent/100, so don't put above 1. Set to 0 to disable. Higher is easier.
    CAST_ALLOW_COLOR: true, // Change the color of the cast line on fish hit. If false the player needs to look for the message and bobber
    FISHING_INTERVAL: 800, // How often (in milliseconds)  we check if our line caught something. Higher is harder.
    FISHING_INITIAL_DELAY_MIN: 500, // An initial delay (in milliseconds) before starting our fishing interval. Higher is harder.
    FISHING_INITIAL_DELAY_MAX: 4000,
    FISHING_SUBSEQUENT_SKIP: 5, // How many intervals to skip once a fish has gotten away, before rolling to catch another. Higher is harder.
    FISHING_BASE_CHANCE: 0.05, // Percent chance (divided by 100) to catch a fish per interval. Modified by cast accuracy. Higher is easier.
    FISHING_HELP_CHANCE: 0.015, // Percent chance (divided by 100) to increase our current fishing chance per failed interval. Basically to ensure eventually a catch will happen. Higher is easier.
    FISHING_WAIT_CAP: 8000, // Cap the absolutely longest (in milliseconds) we can wait before forcing a hit. This starts after any initial delay. 0 to have no cap. Higher is harder.
    FISHING_GETAWAY_MIN: 1500, // Range of time (in milliseconds) before a caught/hit fish will get away. Higher is easier.
    FISHING_GETAWAY_MAX: 2500,
    FISHING_GETAWAY_ACCURACY_MS: 3, // How many milliseconds per 1% Accuracy of the cast we give as a bonus on the getaway time. Set to 0 to disable. Higher is easier.
}

/**
 * Use preset values for our difficulty.current
 * Of course difficulty can mean a lot of things, so there ARE some random factors in here
 * Primarily the difficulty could come from long or complex QTE, or short fishing hook time, etc.
 *
 * @param showFish set to true to update the number of fish on our shack as a visual indicator
 */
function applyDifficulty(showFish) {
    if (difficulty.current === 3) { // Hard
        difficulty.ALLOW_SOUND = false;
        difficulty.QTE_SOFTSTART = 0;
        difficulty.QTE_LUCKYCHANCE = 1;
        difficulty.QTE_MIN = getRandomInt(3, 4);
        difficulty.QTE_MAX = getRandomInt(7, 9);
        difficulty.QTE_TYPES = [ 'lowNumbers', 'highNumbers', 'letters', 'math' ];
        difficulty.QTE_LOWNUMBERS = 3;
        difficulty.QTE_HIGHNUMBERS = 3;
        difficulty.QTE_LETTERS = 5;
        difficulty.QTE_MATH_CHANCE = 30;
        difficulty.QTE_MATH_MIN = getRandomInt(5, 8);
        difficulty.QTE_MATH_MAX = getRandomInt(10, 20);
        difficulty.QTE_INTERVAL = 150;
        difficulty.QTE_STEP = getRandomInt(250, 400)/100;
        difficulty.CAST_INTERVAL = 1;
        difficulty.CAST_STEP = getRandomInt(80, 110)/100;
        difficulty.CAST_SPEEDUP = getRandomInt(40, 50)/100;
        difficulty.CAST_TOPWAIT = 0;
        difficulty.CAST_MAX_BONUS = 0;
        difficulty.CAST_ALLOW_COLOR = Math.random() <= 0.8 ? false : true;
        difficulty.FISHING_INTERVAL = 800;
        difficulty.FISHING_INITIAL_DELAY_MIN = 0;
        difficulty.FISHING_INITIAL_DELAY_MAX = 2000;
        difficulty.FISHING_SUBSEQUENT_SKIP = 8;
        difficulty.FISHING_BASE_CHANCE = 0.05;
        difficulty.FISHING_HELP_CHANCE = 0.01;
        difficulty.FISHING_WAIT_CAP = 0;
        difficulty.FISHING_GETAWAY_MIN = 300;
        difficulty.FISHING_GETAWAY_MAX = getRandomInt(800, 1000);
        difficulty.FISHING_GETAWAY_ACCURACY_MS = 1;
    }
    else if (difficulty.current === 2) { // Medium
        difficulty.ALLOW_SOUND = true;
        difficulty.QTE_SOFTSTART = 0;
        difficulty.QTE_LUCKYCHANCE = getRandomInt(5, 10);
        difficulty.QTE_MIN = getRandomInt(2, 3);
        difficulty.QTE_MAX = getRandomInt(4, 6);
        difficulty.QTE_TYPES = [ 'lowNumbers', 'highNumbers', 'letters', 'math' ];
        difficulty.QTE_LOWNUMBERS = 8;
        difficulty.QTE_HIGHNUMBERS = 8;
        difficulty.QTE_LETTERS = 5;
        difficulty.QTE_MATH_CHANCE = 20;
        difficulty.QTE_MATH_MIN = getRandomInt(2, 6);
        difficulty.QTE_MATH_MAX = getRandomInt(5, 10);
        difficulty.QTE_INTERVAL = 150;
        difficulty.QTE_STEP = getRandomInt(100, 250)/100;
        difficulty.CAST_INTERVAL = 1;
        difficulty.CAST_STEP = 0.6;
        difficulty.CAST_SPEEDUP = 0.15;
        difficulty.CAST_TOPWAIT = getRandomInt(10, 30);
        difficulty.CAST_MAX_BONUS = 0.02;
        difficulty.CAST_ALLOW_COLOR = true;
        difficulty.FISHING_INTERVAL = 800;
        difficulty.FISHING_INITIAL_DELAY_MIN = 500;
        difficulty.FISHING_INITIAL_DELAY_MAX = 3000;
        difficulty.FISHING_SUBSEQUENT_SKIP = 7;
        difficulty.FISHING_BASE_CHANCE = 0.06;
        difficulty.FISHING_HELP_CHANCE = 0.01;
        difficulty.FISHING_WAIT_CAP = 0;
        difficulty.FISHING_GETAWAY_MIN = getRandomInt(500, 1000);
        difficulty.FISHING_GETAWAY_MAX = getRandomInt(1000, 1500);
        difficulty.FISHING_GETAWAY_ACCURACY_MS = 2;
    }
    else if (difficulty.current === 1) { // Easy
        difficulty.ALLOW_SOUND = true;
        difficulty.QTE_SOFTSTART = getRandomInt(0, 1);
        difficulty.QTE_LUCKYCHANCE = 10;
        difficulty.QTE_MIN = 2;
        difficulty.QTE_MAX = 4;
        difficulty.QTE_TYPES = [ 'lowNumbers', 'highNumbers', 'math' ];
        difficulty.QTE_LOWNUMBERS = 5;
        difficulty.QTE_HIGHNUMBERS = 5;
        difficulty.QTE_LETTERS = 0;
        difficulty.QTE_MATH_CHANCE = 15;
        difficulty.QTE_MATH_MIN = getRandomInt(1, 3);
        difficulty.QTE_MATH_MAX = getRandomInt(3, 7);
        difficulty.QTE_INTERVAL = 150;
        difficulty.QTE_STEP = 0.05;
        difficulty.CAST_INTERVAL = 1;
        difficulty.CAST_STEP = 0.52;
        difficulty.CAST_SPEEDUP = 0.1;
        difficulty.CAST_TOPWAIT = 35;
        difficulty.CAST_MAX_BONUS = 0.05;
        difficulty.CAST_ALLOW_COLOR = true;
        difficulty.FISHING_INTERVAL = 800;
        difficulty.FISHING_INITIAL_DELAY_MIN = 500;
        difficulty.FISHING_INITIAL_DELAY_MAX = 3000;
        difficulty.FISHING_SUBSEQUENT_SKIP = 6;
        difficulty.FISHING_BASE_CHANCE = 0.06;
        difficulty.FISHING_HELP_CHANCE = 0.015;
        difficulty.FISHING_WAIT_CAP = 9000;
        difficulty.FISHING_GETAWAY_MIN = 1000;
        difficulty.FISHING_GETAWAY_MAX = 2000;
        difficulty.FISHING_GETAWAY_ACCURACY_MS = 3;
    }
    else { // Kids
        difficulty.ALLOW_SOUND = true;
        difficulty.QTE_SOFTSTART = 2;
        difficulty.QTE_LUCKYCHANCE = getRandomInt(10, 15);
        difficulty.QTE_MIN = 1;
        difficulty.QTE_MAX = 3;
        difficulty.QTE_TYPES = [ 'lowNumbers', 'math' ];
        difficulty.QTE_LOWNUMBERS = 1;
        difficulty.QTE_HIGHNUMBERS = 0;
        difficulty.QTE_LETTERS = 0;
        difficulty.QTE_MATH_CHANCE = 10;
        difficulty.QTE_MATH_MIN = 1;
        difficulty.QTE_MATH_MAX = getRandomInt(1, 3)+1;
        difficulty.QTE_INTERVAL = 150;
        difficulty.QTE_STEP = 0.01;
        difficulty.CAST_INTERVAL = 1;
        difficulty.CAST_STEP = 0.5;
        difficulty.CAST_SPEEDUP = 0;
        difficulty.CAST_TOPWAIT = 60;
        difficulty.CAST_MAX_BONUS = 0.1;
        difficulty.CAST_ALLOW_COLOR = true;
        difficulty.FISHING_INTERVAL = 800;
        difficulty.FISHING_INITIAL_DELAY_MIN = 500;
        difficulty.FISHING_INITIAL_DELAY_MAX = 3000;
        difficulty.FISHING_SUBSEQUENT_SKIP = 5;
        difficulty.FISHING_BASE_CHANCE = 0.07;
        difficulty.FISHING_HELP_CHANCE = 0.02;
        difficulty.FISHING_WAIT_CAP = getRandomInt(7500, 8000);
        difficulty.FISHING_GETAWAY_MIN = 2000;
        difficulty.FISHING_GETAWAY_MAX = 3000;
        difficulty.FISHING_GETAWAY_ACCURACY_MS = 3;
    }
    
    // Reset our QTE array so it will regenerate next time
    if (qteAvailable && qteAvailable.length > 0) {
        qteAvailable.splice(0, qteAvailable.length);
    }
    
    // Also reset our QTE count to re-enable soft start (if available)
    qteCount = 0;
    
    if (showFish) {
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
    
    // Log for any interested users to see
    console.log("Difficulty Settings", difficulty);
}
