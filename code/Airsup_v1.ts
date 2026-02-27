/**
 * Airsup_v1
 * Core Air Sup game mode with capture-point scoring and custom player scoreboard stats.
 *
 * Scope:
 * - Implements baseline match loop, capture-point ownership scoring, and custom scoreboard columns.
 * - Uses per-team timers to translate objective control into ticket gain intervals.
 *
 * Runtime Model:
 * 1. Configure objectives + scoreboard in OnGameModeStarted.
 * 2. Tick every second and recalculate held objectives for both teams.
 * 3. Apply score increments when each team timer reaches its ownership-defined interval.
 * 4. Mirror team totals in header and maintain per-player row stats from event callbacks.
 *
 * Notes:
 * - This file is the mechanical foundation for all later HUD-heavy versions.
 * - Gameplay rules here are intentionally straightforward for stability.
 * Copyright (c) 2026 Ethan Mills. All rights reserved.
 */

// -----------------------------------------------------------------------------
// GAME MODE VARIABLES
// -----------------------------------------------------------------------------
// Object variable indexes for player stats on the custom scoreboard.
const playerKills = 0; // object variable slot index for per-player kill count
const playerDeaths = 1; // object variable slot index for per-player death count
const playerScore = 2; // object variable slot index for per-player custom score
const playerCaptures = 3; // object variable slot index for per-player capture count


// Per-team timers used to apply score gain at interval rates.
let team1ScoreTimer = 0; // tracks elapsed seconds for Team 1 scoring interval
let team2ScoreTimer = 0; // tracks elapsed seconds for Team 2 scoring interval


// -----------------------------------------------------------------------------
// INITIALIZE GAME MODE
// -----------------------------------------------------------------------------
// Main entry point for match setup and the 1-second game loop.
export async function OnGameModeStarted() { // main entry point when the custom game mode starts
    
    // Initialize and configure each capture point used by Air Sup.
    let capturePointA = mod.GetCapturePoint(100); //first capture point
    let capturePointB = mod.GetCapturePoint(101); //second capture point
    let capturePointC = mod.GetCapturePoint(102); //third capture point

    mod.EnableGameModeObjective(capturePointA, true);          //make it count for gamemodes objs
    mod.SetCapturePointCapturingTime(capturePointA,2.5);       //2.5 capture time(air sup)
    mod.SetCapturePointNeutralizationTime(capturePointA,2.5);  //2.5 neutralize time(air sup)
    mod.SetMaxCaptureMultiplier(capturePointA, 1);             //standard capture rate(want faster in future)

    mod.EnableGameModeObjective(capturePointB, true);          //make it count for gamemodes objs
    mod.SetCapturePointCapturingTime(capturePointB,2.5);       //2.5 capture time(air sup)
    mod.SetCapturePointNeutralizationTime(capturePointB,2.5);  //2.5 neutralize time(air sup)
    mod.SetMaxCaptureMultiplier(capturePointB, 1);             //standard capture rate(want faster in future)
    
    mod.EnableGameModeObjective(capturePointC, true);          //make it count for gamemodes objs
    mod.SetCapturePointCapturingTime(capturePointC,2.5);       //2.5 capture time(air sup)
    mod.SetCapturePointNeutralizationTime(capturePointC,2.5);  //2.5 neutralize time(air sup)
    mod.SetMaxCaptureMultiplier(capturePointC, 1);             //standard capture rate(want faster in future)
    
    // Initialize both team scores at match start.
    mod.SetGameModeScore(mod.GetTeam(1),0); // sets Team 1 starting score to 0
    mod.SetGameModeScore(mod.GetTeam(2),0); // sets Team 2 starting score to 0

    // Initialize scoreboard layout and column labels.
    setUpScoreBoard(); // configures scoreboard layout, headers, and column widths

    // Main tick loop: update tickets and scoreboard once per second.
    while(mod.GetMatchTimeRemaining() > 0) { // runs loop while match still has time remaining
        await mod.Wait(1); // waits 1 second between each update cycle
        updateTeamScores(); // updates score logic based on capture point ownership
        updateScoreBoardTotal(); // updates scoreboard UI with new totals
        //update players scores
    }
}


// -----------------------------------------------------------------------------
// SCOREBOARD
// -----------------------------------------------------------------------------
function updateScoreBoardTotal(){ // updates scoreboard header display values
    // Pull current game-mode scores and mirror them into scoreboard header text.
    const score1 = mod.GetGameModeScore(mod.GetTeam(1)); // retrieves current Team 1 score
    const score2 = mod.GetGameModeScore(mod.GetTeam(2)); // retrieves current Team 2 score
    mod.SetScoreboardHeader(mod.Message(mod.stringkeys.score, score1),mod.Message(mod.stringkeys.score, score2)); 
}


function setUpScoreBoard(){
        // Configure custom two-team scoreboard and player stat columns.
        mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams); // sets scoreboard layout to custom 2-team mode
        mod.SetScoreboardHeader( mod.Message(mod.stringkeys.score, 0), mod.Message(mod.stringkeys.score, 0)); // sets both team header values to 0 at match start
        mod.SetScoreboardColumnNames(
        mod.Message(mod.stringkeys.SBHead1), //score
        mod.Message(mod.stringkeys.SBHead2), //kills
        mod.Message(mod.stringkeys.SBHead3), //deaths
        mod.Message(mod.stringkeys.SBHead4), //captures
    )
    let columeWidth = 10 // uses equal width for all custom scoreboard columns

    mod.SetScoreboardColumnWidths(columeWidth, columeWidth, columeWidth, columeWidth); // applies width for Score/Kills/Deaths/Captures columns


}


// -----------------------------------------------------------------------------
// TEAM SCORING
// -----------------------------------------------------------------------------
//create helper function to get seconds per point
function getSecondsPerPoint(pointsHeld: number): number{ // determines scoring interval based on number of zones held
    if (pointsHeld === 3){ // if team controls all 3 zones
        return 1; // score every 1 second
    } else if(pointsHeld == 2){ // if team controls 2 zones
        return 5; // score every 5 seconds
    } else if(pointsHeld == 1){ // if team controls 1 zone
        return 10; // score every 10 seconds
    }
    return 0; // no scoring if no zones controlled
}


//main event update teams scores in gameplay loop
function updateTeamScores(){ // calculates capture ownership and applies scoring logic
    // Count objective ownership for Team 1 and Team 2.
    let team1PointsHeld = 0; // tracks how many zones Team 1 controls
    let team2PointsHeld = 0; // tracks how many zones Team 2 controls

    let capturePointOwnerA = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(100)); // gets owner of capture point A
    let capturePointOwnerB = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(101)); // gets owner of capture point B
    let capturePointOwnerC = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(102)); // gets owner of capture point C

    if (mod.Equals(capturePointOwnerA, mod.GetTeam(1))){ // checks if Team 1 owns A
        team1PointsHeld++; // increments Team 1 zone count
   }else if (mod.Equals(capturePointOwnerA, mod.GetTeam(2))){ // checks if Team 2 owns A
        team2PointsHeld++; // increments Team 2 zone count
   }

    if (mod.Equals(capturePointOwnerB, mod.GetTeam(1))){ // checks if Team 1 owns B
        team1PointsHeld++; // increments Team 1 zone count
   }else if (mod.Equals(capturePointOwnerB, mod.GetTeam(2))){ // checks if Team 2 owns B
        team2PointsHeld++; // increments Team 2 zone count
   }

    if (mod.Equals(capturePointOwnerC, mod.GetTeam(1))){ // checks if Team 1 owns C
        team1PointsHeld++; // increments Team 1 zone count
   }else if (mod.Equals(capturePointOwnerC, mod.GetTeam(2))){ // checks if Team 2 owns C
        team2PointsHeld++; // increments Team 2 zone count
   }

   team1ScoreTimer++; // increments Team 1 internal scoring timer
   team2ScoreTimer++; // increments Team 2 internal scoring timer

   // Convert ownership totals into score interval rates.
   const team1Rate = getSecondsPerPoint(team1PointsHeld); // determines Team 1 scoring interval
   const team2Rate = getSecondsPerPoint(team2PointsHeld); // determines Team 2 scoring interval

   if (team1ScoreTimer >= team1Rate && team1Rate > 0){ // checks if Team 1 reached scoring interval
        team1ScoreTimer = 0; // resets Team 1 timer
        const currentScore = mod.GetGameModeScore(mod.GetTeam(1)); // retrieves current Team 1 score
        const newScore = currentScore + 1; // increments Team 1 score by 1
        mod.SetGameModeScore(mod.GetTeam(1), newScore); // updates Team 1 score in game mode
   }
    
   if (team2ScoreTimer >= team2Rate && team2Rate > 0){ // checks if Team 2 reached scoring interval
        team2ScoreTimer = 0; // resets Team 2 timer
        const currentScore = mod.GetGameModeScore(mod.GetTeam(2)); // retrieves current Team 2 score
        const newScore = currentScore + 1; // increments Team 2 score by 1
        mod.SetGameModeScore(mod.GetTeam(2), newScore); // updates Team 2 score in game mode
   }
}


// -----------------------------------------------------------------------------
// PLAYER EVENTS
// -----------------------------------------------------------------------------
export function OnPlayerJoinGame(
    eventPlayer: mod.Player // player object for the user who just joined

){
    // Initialize player stat variables for this match.
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerKills), 0); // initializes player kill counter
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerDeaths),0 ); // initializes player death counter
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerCaptures), 0); // initializes player capture counter
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerScore), 0); // initializes player custom score
    updatePlayerScoreBoard(eventPlayer); // pushes initialized values to scoreboard UI
}



function updatePlayerScoreBoard(player: mod.Player){ // refreshes one player's scoreboard row values
    // Push the latest stat values into the player's scoreboard row.
    mod.SetScoreboardPlayerValues(
        player, // target player row to update
        mod.GetVariable(mod.ObjectVariable(player, playerScore)), // displayed Score column value
        mod.GetVariable(mod.ObjectVariable(player, playerKills)), // displayed Kills column value
        mod.GetVariable(mod.ObjectVariable(player, playerDeaths)), // displayed Deaths column value
        mod.GetVariable(mod.ObjectVariable(player, playerCaptures)), // displayed Captures column value
    )
}



export function OnPlayerEarnKill(
    eventPlayer: mod.Player // player credited with a kill
){
    // Award kill and score, then refresh the player's row.
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerKills), mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerKills)),1)); // adds +1 to killer's kill counter
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerScore), mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerScore)),100)); // awards +100 score for a kill
    
    updatePlayerScoreBoard(eventPlayer); // updates killer row after score and kill increment


}


export function OnPlayerDied(
    eventPlayer: mod.Player // player who died
){
    // Track death count and refresh the player's row.
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerDeaths), mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerDeaths)),1)); // adds +1 to death counter
    
    updatePlayerScoreBoard(eventPlayer); // updates dead player's row after death increment

}

export function OnCapturePointCaptured(
    eventCapturePoint: mod.CapturePoint // capture point that finished capturing
) {
    // Reward players on the captured point that belong to the new owner.
    const playersOnPoint = mod.GetPlayersOnPoint(eventCapturePoint); // gets players currently inside this capture area
    const currentOwner = mod.GetCurrentOwnerTeam(eventCapturePoint); // reads team that now owns the objective
    const totalPlayersOnPoint = mod.CountOf(playersOnPoint); // number of players to iterate through

    for (let i = 0; i < totalPlayersOnPoint; i++){
        const player = mod.ValueInArray(playersOnPoint, i); // gets player at current index

        if (mod.Equals(mod.GetTeam(player), currentOwner)){
             mod.SetVariable(mod.ObjectVariable(player, playerCaptures), mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerCaptures)),1)); // awards +1 capture to eligible player
            mod.SetVariable(mod.ObjectVariable(player, playerScore), mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerScore)),200)); // awards +200 score for capture participation


             updatePlayerScoreBoard(player); // refreshes scoreboard row for the rewarded player
        }
    }
}

