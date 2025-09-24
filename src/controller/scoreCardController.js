const Admin = require("../models/admin");
const League = require("../models/league");
const Match = require("../models/match");
const MatchScore = require("../models/MatchScore");
const PointSystem = require("../models/PointSystem");
const ScoreBoard = require("../models/ScoreBoard");
const ScoreCard = require("../models/ScoreCard");
const PlayerPoints = require("../models/PlayerPoints");
const { io } = require("../socket/socket");
const mongoose = require("mongoose");
const match = require("../models/match");
const SuperOver = require("../models/superOverSchema");
const SecoundSuperOver = require("../models/secound_super_over");

async function getPointSystemsForMatch(matchId) {
    try {
        // Step 1: Find the match by its ID
        const match = await Match.findById(matchId);
        if (!match) {
            throw new Error("Match not found");
        }

        // Step 2: Get the league_id from the match
        const leagueId = match.league_id;

        // console.log("leagueId: ",leagueId);
        // Step 3: Find the league by its ID
        const league = await League.findById(leagueId);
        if (!league) {
            throw new Error("League not found");
        }

        // Step 4: Get the matchType from the league
        const matchType = league.matchType;

        // Step 5: Find all point systems related to the matchType
        const pointSystems = await PointSystem.aggregate([
            {
                $lookup: {
                    from: "point_types", // collection name in the database
                    localField: "pointType",
                    foreignField: "_id",
                    as: "pointTypeDetails",
                },
            },
            {
                $lookup: {
                    from: "point_fors", // collection name in the database
                    localField: "pointFor",
                    foreignField: "_id",
                    as: "pointForDetails",
                },
            },
            {
                $match: { matchType: new mongoose.Types.ObjectId(matchType) },
            },
            {
                $unwind: "$pointTypeDetails",
            },
            {
                $unwind: "$pointForDetails",
            },
            {
                $project: {
                    _id: 1,
                    points: 1,
                    pointType: "$pointTypeDetails.point_type_name",
                    pointFor: "$pointForDetails.point_for_name",
                    "status": "$pointForDetails.status"
                },
            },
        ]);
        // console.log(matchType);
        return { pointSystems, leagueId };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const getPlayerPoints = async (playerId, matchId, leagueId) => {
    try {
        let batsmanPoints = await PlayerPoints.findOne({
            playerId: playerId,
            matchId: matchId,
        });
        if (!batsmanPoints) {
            batsmanPoints = await PlayerPoints.create({
                matchId: matchId,
                playerId: playerId,
                points: 0,
                leagueId: leagueId,
            });
        }

        return batsmanPoints;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const getPointsFromStatus = (pointSystems, status) => {
    try {
        const index = pointSystems.findIndex((data) => data.status == status);
        // console.log("pointSystems: " +pointSystems);
        if (index == -1) {
            return -1;
        }
        const points = pointSystems[index].points;

        return points;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const updateBatsmanPoints = (batsmanPoints, score, pointSystems) => {
    try {

        if (score.status == "run" || score.status == "four" || score.status == "six") {
            batsmanPoints += (score.run * getPointsFromStatus(pointSystems, "run"));
            if (score.status == "four" || score.status == "six") {
                batsmanPoints += (getPointsFromStatus(pointSystems, "boundary"));
                if (score.status == "six") {
                    batsmanPoints += (getPointsFromStatus(pointSystems, "six"));
                }
            }
        }
        return batsmanPoints;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const updateBallerPoints = (ballerPoints, score, pointSystems) => {
    try {
        ballerPoints += getPointsFromStatus(pointSystems, "wicket");

        if (score.status == "bowled" || score.status == "lbw") {
            ballerPoints += getPointsFromStatus(pointSystems, score.status);
        }

        return ballerPoints;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const updateSecondaryPlayerPoints = (secondaryPlayerPoints, score, pointSystems) => {
    try {
        if (score.status == "catch") {
            secondaryPlayerPoints += getPointsFromStatus(pointSystems, "catch");
        }
        if (score.status == "stumping") {
            secondaryPlayerPoints += getPointsFromStatus(pointSystems, "stumping");
        }
        if (score.status == "runout" || score.status == "nbout") {
            secondaryPlayerPoints += getPointsFromStatus(pointSystems, "runout");
        }

        return secondaryPlayerPoints
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const updatePointsInDb = async (matchId, playerId, updatedPoints) => {
    try {
        const updatedPlayerPoints = await PlayerPoints.findOneAndUpdate({ matchId: matchId, playerId: playerId }, { $set: { points: updatedPoints } }, { new: true });

        return updatedPlayerPoints;
    } catch (error) {
        console.error(error);
        throw error;
    }
}



// exports.addScore = async (req, res) => {
//     try {
//         let adminId = req.user;

//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Admin not found",
//             });
//         }
//         // const match = await Match.findById(score.matchId);
//         // if (!match.isStarted) {
//         //     return res
//         //         .status(400)
//         //         .json({ success: false, message: "Match has not yet started" });
//         // }

//         const {
//             matchId,
//             inning,
//             battingTeam,
//             ballingTeam,
//             batsman1Id,
//             batsman2Id,
//             ballerId,
//             secondaryPlayerId,
//             assistingPlayerId,
//             currBall,
//             run,
//             status,
//             runOutType
//         } = req.body;

//         const score = await ScoreCard.create({
//             matchId,
//             inning,
//             battingTeam,
//             ballingTeam,
//             batsman1Id,
//             batsman2Id,
//             ballerId,
//             secondaryPlayerId,
//             assistingPlayerId,
//             currBall,
//             run,
//             status,
//             runOutType
//         });

//         if (req.body.outId.trim().length > 0) {
//             score.outId = req.body.outId;
//             await score.save();
//         }
//         // GET MatchScore by matchId given in score
//         let matchScore = await MatchScore.findOne({ matchId: score.matchId });

//         let newMatchScore = {
//             team1: {
//                 teamId: matchScore.team1.teamId,
//                 runs: matchScore.team1.runs,
//                 wicket: matchScore.team1.wicket,
//                 overs: matchScore.team1.overs,
//             },
//             team2: {
//                 teamId: matchScore.team2.teamId,
//                 runs: matchScore.team2.runs,
//                 wicket: matchScore.team2.wicket,
//                 overs: matchScore.team2.overs,
//             },
//         };

//         // Now we will check what team is batting whether team1 or team2
//         if (score.battingTeam.equals(matchScore.team1.teamId)) {
//             // if there is a run/four/six we will increment balls and runs of the batting team
//             if (
//                 score.status == "run" ||
//                 score.status == "four" ||
//                 score.status == "six"
//             ) {
//                 newMatchScore.team1.runs += score.run;
//                 newMatchScore.team1.overs = score.currBall;
//             }
//             // if there is a wicket we will increment the ball and wickets of that team
//             else if (
//                 score.status == "wicket" ||
//                 score.status == "stumping" ||
//                 score.status == "catch" ||
//                 score.status == "lbw" ||
//                 score.status == "bowled"
//             ) {
//                 newMatchScore.team1.wicket += 1;
//                 newMatchScore.team1.overs = score.currBall;
//             }
//             // if there is a run/four/six we will increment balls and runs of the batting teams and we will update wikets on runout
//             else if (score.status == "runout") {
//                 newMatchScore.team1.runs += score.run;
//                 newMatchScore.team1.wicket += 1;
//                 newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "nbout") {
//                 newMatchScore.team1.runs += score.run + 1;
//                 newMatchScore.team1.wicket += 1;
//                 // newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "nb" || score.status == "wide") {
//                 newMatchScore.team1.runs += score.run + 1
//             } else if (score.status == "lb" || score.status == "byes") {
//                 newMatchScore.team1.runs += score.run
//                 newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "penalty") {
//                 newMatchScore.team1.runs += score.run
//             } else if (score.status == "overthrow") {
//                 score.overthrowBoundary = req.body.overthrowBoundary;
//                 await score.save();
//                 newMatchScore.team1.runs +=
//                     score.run + req.body.overthrowBoundary;
//                 newMatchScore.team1.overs = score.currBall;
//             }
//             else if (score.status == "retired_hurt") {
//                 console.log("player retired hurt")
//             }
//             else {
//                 return res
//                     .status(400)
//                     .json({ success: false, message: "Status is invalid" });
//             }
//         } else {
//             if (
//                 score.status == "run" ||
//                 score.status == "four" ||
//                 score.status == "six"
//             ) {
//                 newMatchScore.team2.runs += score.run;
//                 newMatchScore.team2.overs = score.currBall;

//             } else if (
//                 score.status == "wicket" ||
//                 score.status == "stumping" ||
//                 score.status == "catch" ||
//                 score.status == "lbw" ||
//                 score.status == "bowled"
//             ) {
//                 newMatchScore.team2.wicket += 1;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "runout") {
//                 newMatchScore.team2.runs += score.run + 1;
//                 newMatchScore.team2.wicket += 1;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "nbout") {
//                 newMatchScore.team2.runs += score.run + 1;
//                 newMatchScore.team2.wicket += 1;
//                 // newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "nb" || score.status == "wide") {
//                 newMatchScore.team2.runs += score.run + 1;
//             } else if (score.status == "penalty") {
//                 newMatchScore.team2.runs += score.run
//             } else if (score.status == "lb" || score.status == "byes") {
//                 newMatchScore.team2.runs += score.run
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "overthrow") {
//                 score.overthrowBoundary = req.body.overthrowBoundary;
//                 await score.save();
//                 newMatchScore.team2.runs +=
//                     score.run + req.body.overthrowBoundary;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "retired_hurt") {
//                 console.log("player retired hurt")
//             } else {
//                 return res
//                     .status(400)
//                     .json({ success: false, message: "Status is invalid" });
//             }
//         }

//         matchScore = await MatchScore.findOneAndUpdate(
//             { matchId: score.matchId },
//             { $set: newMatchScore },
//             { new: true }
//         );

//         let scoreboard = await ScoreBoard.findOne({
//             matchId: score.matchId,
//             inning: score.inning,
//         });

//         let newScoreBoard = {
//             extras: scoreboard.extras,
//             batting: scoreboard.batting,
//             balling: scoreboard.balling,
//         };

//         // Check if the batsman already exists
//         let batIndex = newScoreBoard.batting.findIndex((b) =>
//             b.playerId.equals(score.batsman1Id)
//         );
//         let bat2Index = newScoreBoard.batting.findIndex((b) =>
//             b.playerId.equals(score.batsman2Id)
//         );
//         if (batIndex === -1) {
//             newScoreBoard.batting.push({
//                 playerId: score.batsman1Id,
//                 runs: 0,
//                 balls: 0,
//                 fours: 0,
//                 sixs: 0,
//                 strikeRate: 0,
//                 isOut: false,
//             });
//             batIndex = newScoreBoard.batting.length - 1;
//         }
//         if (bat2Index === -1) {
//             newScoreBoard.batting.push({
//                 playerId: score.batsman2Id,
//                 runs: 0,
//                 balls: 0,
//                 fours: 0,
//                 sixs: 0,
//                 strikeRate: 0,
//                 isOut: false,
//             });
//             bat2Index = newScoreBoard.batting.length - 1;
//         }

//         // Check if the bowler already exists
//         let ballIndex = newScoreBoard.balling.findIndex((b) =>
//             b.playerId.equals(score.ballerId)
//         );
//         if (ballIndex === -1) {
//             newScoreBoard.balling.push({
//                 playerId: score.ballerId,
//                 runs: 0,
//                 wickets: 0,
//                 overs: 0,
//                 balls: 0,
//                 economy: 0,
//                 maidenOvers: 0,
//                 previousRuns: 0
//             });
//             ballIndex = newScoreBoard.balling.length - 1;
//         }
//         if (score.status == "run") {
//             newScoreBoard.batting[batIndex].runs += score.run;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += score.run;
//             newScoreBoard.balling[ballIndex].balls += 1;
//         } else if (score.status == "four") {
//             newScoreBoard.batting[batIndex].runs += 4;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += 4; // Correct the value to 4
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].fours += 1;
//         } else if (score.status == "six") {
//             newScoreBoard.batting[batIndex].runs += 6;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += 6; // Correct the value to 6
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].sixes += 1;
//         } else if (score.status == "lbw" || score.status == "bowled") {

//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].isOut = true;
//             newScoreBoard.batting[batIndex].outBy = {
//                 status: score.status,
//                 ballerId: score.ballerId,
//                 secondaryPlayerId: score.secondaryPlayerId,
//             };
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].wickets += 1;
//         } else if (
//             score.status == "stumping" ||
//             score.status == "catch"
//         ) {
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].isOut = true;
//             newScoreBoard.batting[batIndex].outBy = {
//                 status: score.status,
//                 ballerId: score.ballerId,
//                 secondaryPlayerId: score.secondaryPlayerId,
//             };
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].wickets += 1;
//         } else if (score.status === "runout") {
//             // Increment balls faced by the batsman who is not out
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].runs += score.run;

//             const isBatsman1Out = score.outId.equals(score.batsman1Id);
//             const isBatsman2Out = score.outId.equals(score.batsman2Id);

//             if (isBatsman1Out || isBatsman2Out) {
//                 const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

//                 newScoreBoard.batting[outBatsmanIndex].isOut = true;
//                 newScoreBoard.batting[outBatsmanIndex].outBy = {
//                     status: score.status,
//                     ballerId: score.ballerId,
//                     secondaryPlayerId: score.secondaryPlayerId,
//                     runOutType: score.runOutType // Set the runOutType
//                 };

//                 if (score.runOutType === 'not_direct') {
//                     newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
//                 }
//             }
//             // Increment balls bowled
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//             // Increment wickets if needed
//             // newScoreBoard.balling[ballIndex].wickets += 1; 
//         } else if (score.status == "nb") {
//             newScoreBoard.extras.nb += 1;
//             if (score.run == 4) {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//                 newScoreBoard.batting[batIndex].fours += 1;
//             } else if (score.run == 6) {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//                 newScoreBoard.batting[batIndex].sixes += 1;
//             } else {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//             }
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//         } else if (score.status == "wide") {
//             // newScoreBoard.extras.wide += 1;
//             // newScoreBoard.balling[ballIndex].runs += 1;
//             newScoreBoard.extras.wide += score.run + 1;
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//         } else if (score.status == "lb") {
//             newScoreBoard.extras.legByes += score.run;
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].balls += 1;
//         } else if (score.status == "byes") {
//             newScoreBoard.extras.byes += score.run;
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].balls += 1;
//         } else if (score.status == "penalty") {
//             newScoreBoard.extras.penalty += score.run;
//         } else if (score.status == "nbout") {
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].runs += score.run;
//             newScoreBoard.batting[batIndex].isOut = true;
//             newScoreBoard.extras.nb += 1;

//             newScoreBoard.balling[ballIndex].runs += score.run + 1;

//             const isBatsman1Out = score.outId.equals(score.batsman1Id);
//             const isBatsman2Out = score.outId.equals(score.batsman2Id);

//             if (isBatsman1Out || isBatsman2Out) {
//                 const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

//                 newScoreBoard.batting[outBatsmanIndex].isOut = true;
//                 newScoreBoard.batting[outBatsmanIndex].outBy = {
//                     status: score.status,
//                     ballerId: score.ballerId,
//                     secondaryPlayerId: score.secondaryPlayerId,
//                     runOutType: score.runOutType // Set the runOutType
//                 };

//                 if (score.runOutType === 'not_direct') {
//                     newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
//                 }
//             }
//             // newScoreBoard.batting[batIndex].outBy = {
//             //     status: score.status,
//             //     ballerId: score.ballerId,
//             //     secondaryPlayerId: score.secondaryPlayerId,
//             // };
//             // newScoreBoard.balling[ballIndex].wickets += 1;
//         } else if (score.status == "retired_hurt") {
//             // Determine which batsman is retiring hurt
//             const isBatsman1Retired = score.outId.equals(score.batsman1Id);
//             const isBatsman2Retired = score.outId.equals(score.batsman2Id);

//             // Update the scoreboard for the retired batsman
//             if (isBatsman1Retired) {
//                 newScoreBoard.batting[batIndex].isOut = false; // Mark as out
//                 newScoreBoard.batting[batIndex].outBy = {
//                     status: "retired_hurt",
//                     ballerId: score.ballerId,
//                 };
//             } else if (isBatsman2Retired) {
//                 newScoreBoard.batting[bat2Index].isOut = false; // Mark as out
//                 newScoreBoard.batting[bat2Index].outBy = {
//                     status: "retired_hurt",
//                     ballerId: score.ballerId,
//                 };
//             }
//         } else if (score.status == "overthrow") {
//             if (req.body.overthrowBoundary == 4) {
//                 newScoreBoard.batting[batIndex].runs += score.run + 4;
//                 newScoreBoard.batting[batIndex].fours += 1;
//             } else if (req.body.overthrowBoundary == 6) {
//                 newScoreBoard.batting[batIndex].runs += score.run + 6;
//                 newScoreBoard.batting[batIndex].sixes += 1;
//             } else {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//             }
//             newScoreBoard.batting[batIndex].runs +=
//                 score.run + req.body.overthrowBoundary;
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//         } else {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "Status is invalid" });
//         }

//         const ballsInCurrentOver = newScoreBoard.balling[ballIndex].balls % 6;

//         // Check if the over is complete
//         if (ballsInCurrentOver === 0) {
//             const oversCompleted = newScoreBoard.balling[ballIndex].balls / 6;

//             // Calculate runs in the current over
//             const runsInCurrentOver = oversCompleted > 1
//                 ? newScoreBoard.balling[ballIndex].runs - newScoreBoard.balling[ballIndex].previousRuns
//                 : newScoreBoard.balling[ballIndex].runs;

//             // Update the previousRuns to track runs till the end of this over
//             newScoreBoard.balling[ballIndex].previousRuns = newScoreBoard.balling[ballIndex].runs;

//             // Increment maidenOvers if no runs were conceded in this over
//             if (runsInCurrentOver === 0) {
//                 newScoreBoard.balling[ballIndex].maidenOvers =
//                     (newScoreBoard.balling[ballIndex].maidenOvers || 0) + 1;
//             }
//         }

//         newScoreBoard.balling[ballIndex].overs = Math.floor(
//             newScoreBoard.balling[ballIndex].balls / 6
//         ) + "." + (newScoreBoard.balling[ballIndex].balls % 6);

//         newScoreBoard.batting[batIndex].balls =
//             newScoreBoard.batting[batIndex].balls || 0;
//         newScoreBoard.balling[ballIndex].balls =
//             newScoreBoard.balling[ballIndex].balls || 0;

//         newScoreBoard.batting[batIndex].strikeRate = parseFloat(
//             ((newScoreBoard.batting[batIndex].runs /
//                 newScoreBoard.batting[batIndex].balls) *
//                 100).toFixed(2)
//         );

//         const bowlerOvers =
//             Math.floor(newScoreBoard.balling[ballIndex].balls / 6) +
//             (newScoreBoard.balling[ballIndex].balls % 6) * 0.1;
//         newScoreBoard.balling[ballIndex].economy = parseFloat(
//             (newScoreBoard.balling[ballIndex].runs / bowlerOvers).toFixed(2)
//         );

//         scoreboard = await ScoreBoard.findOneAndUpdate(
//             { matchId: score.matchId, inning: score.inning },
//             { $set: newScoreBoard },
//             { new: true }
//         );

//         const { pointSystems, leagueId } = await getPointSystemsForMatch(
//             matchId
//         );

//         // console.log("final: ",pointSystems);

//         const batsmanPoints = await getPlayerPoints(batsman1Id, matchId, leagueId);
//         const ballerPoints = await getPlayerPoints(ballerId, matchId, leagueId);
//         const secondaryPlayerPoints = await getPlayerPoints(secondaryPlayerId, matchId, leagueId);

//         let updatedBatsmanPoints = batsmanPoints.points;
//         let updatedBallerPoints = ballerPoints.points;
//         let updatedSecondaryPlayerPoints = secondaryPlayerPoints.points;
//         // Batsman
//         if ((score.status == "run" || score.status == "four" || score.status == "six" || score.status == "overthrow") && score.run != 0) {
//             updatedBatsmanPoints = updateBatsmanPoints(batsmanPoints.points, score, pointSystems);
//             if (getPointsFromStatus(pointSystems, "thirty_run") != -1) {
//                 if ((newScoreBoard.batting[batIndex].runs > 30) && (newScoreBoard.batting[batIndex].runs - score.run < 30)) {
//                     updateBatsmanPoints += getPointsFromStatus(pointSystems, "thirty_run")
//                 }
//             }

//             if (getPointsFromStatus(pointSystems, "half_century") != -1) {
//                 if ((newScoreBoard.batting[batIndex].runs > 50) && (newScoreBoard.batting[batIndex].runs - score.run < 50)) {
//                     updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
//                 }
//             }

//             if (getPointsFromStatus(pointSystems, "century") != -1) {
//                 if ((newScoreBoard.batting[batIndex].runs > 100) && (newScoreBoard.batting[batIndex].runs - score.run < 100)) {
//                     updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
//                 }
//             }

//         } //Others
//         else if (score.status == "bowled" || score.status == "catch" || score.status == "lbw" || score.status == "stumping") {
//             // Baller
//             updatedBallerPoints = updateBallerPoints(ballerPoints.points, score, pointSystems);

//             if (getPointsFromStatus(pointSystems, "three_wicket") != -1) {
//                 if ((newScoreBoard.balling[ballIndex].wickets > 3) && (newScoreBoard.balling[ballIndex].wickets - 1 < 3)) {
//                     updatedBallerPoints += getPointsFromStatus(pointSystems, "three_wicket")
//                 }
//             }
//             if (getPointsFromStatus(pointSystems, "four_wicket") != -1) {
//                 if ((newScoreBoard.balling[ballIndex].wickets > 4) && (newScoreBoard.balling[ballIndex].wickets - 1 < 4)) {
//                     updatedBallerPoints += getPointsFromStatus(pointSystems, "four_wicket")
//                 }
//             }
//             if (getPointsFromStatus(pointSystems, "five_wicket") != -1) {
//                 if ((newScoreBoard.balling[ballIndex].wickets > 5) && (newScoreBoard.balling[ballIndex].wickets - 1 < 5)) {
//                     updatedBallerPoints += getPointsFromStatus(pointSystems, "five_wicket")
//                 }
//             }

//             // secondaryplayer
//             updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);

//             if (newScoreBoard.batting[batIndex].balls == 0) {
//                 updateBatsmanPoints += getPointsFromStatus(pointSystems, "duck");
//             }
//         }
//         else if (score.status == "nbout" || score.status == "runout") {
//             updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);
//         }

//         updatedBatsmanPoints = await updatePointsInDb(matchId, batsman1Id, updatedBatsmanPoints);
//         updatedBallerPoints = await updatePointsInDb(matchId, ballerId, updatedBallerPoints);
//         updatedSecondaryPlayerPoints = await updatePointsInDb(matchId, secondaryPlayerId, updatedSecondaryPlayerPoints);


//         io.emit("livescore", { matchScore, scoreboard });

//         return res.status(200).json({
//             success: true,
//             message: "Score added successfully",
//             data: { score, matchScore, scoreboard },
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message,
//         });
//     }
// };

exports.addScore = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        // const match = await Match.findById(score.matchId);
        // if (!match.isStarted) {
        //     return res
        //         .status(400)
        //         .json({ success: false, message: "Match has not yet started" });
        // }

        const {
            matchId,
            inning,
            battingTeam,
            ballingTeam,
            batsman1Id,
            batsman2Id,
            ballerId,
            secondaryPlayerId,
            assistingPlayerId,
            currBall,
            run,
            status,
            runOutType
        } = req.body;

        const score = await ScoreCard.create({
            matchId,
            inning,
            battingTeam,
            ballingTeam,
            batsman1Id,
            batsman2Id,
            ballerId,
            secondaryPlayerId,
            assistingPlayerId,
            currBall,
            run,
            status,
            runOutType
        });

        if (req.body.outId.trim().length > 0) {
            score.outId = req.body.outId;
            await score.save();
        }
        // GET MatchScore by matchId given in score
        let matchScore = await MatchScore.findOne({ matchId: score.matchId });

        let newMatchScore = {
            team1: {
                teamId: matchScore.team1.teamId,
                runs: matchScore.team1.runs,
                wicket: matchScore.team1.wicket,
                overs: matchScore.team1.overs,
            },
            team2: {
                teamId: matchScore.team2.teamId,
                runs: matchScore.team2.runs,
                wicket: matchScore.team2.wicket,
                overs: matchScore.team2.overs,
            },
        };

        // Now we will check what team is batting whether team1 or team2
        if (score.battingTeam.equals(matchScore.team1.teamId)) {
            // if there is a run/four/six we will increment balls and runs of the batting team
            if (
                score.status == "run" ||
                score.status == "four" ||
                score.status == "six"
            ) {
                newMatchScore.team1.runs += score.run;
                newMatchScore.team1.overs = score.currBall;
            }
            // if there is a wicket we will increment the ball and wickets of that team
            else if (
                score.status == "wicket" ||
                score.status == "stumping" ||
                score.status == "catch" ||
                score.status == "lbw" ||
                score.status == "bowled"
            ) {
                newMatchScore.team1.wicket += 1;
                newMatchScore.team1.overs = score.currBall;
            }
            // if there is a run/four/six we will increment balls and runs of the batting teams and we will update wikets on runout
            else if (score.status == "runout") {
                newMatchScore.team1.runs += score.run;
                newMatchScore.team1.wicket += 1;
                newMatchScore.team1.overs = score.currBall;
            } else if (score.status == "nbout") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
                // newMatchScore.team1.overs = score.currBall;
            } else if (score.status == "nb" || score.status == "wide") {
                newMatchScore.team1.runs += score.run + 1
            } else if (score.status == "lb" || score.status == "byes") {
                newMatchScore.team1.runs += score.run
                newMatchScore.team1.overs = score.currBall;
            } else if (score.status == "penalty") {
                newMatchScore.team1.runs += score.run
            } else if (score.status == "overthrow") {
                score.overthrowBoundary = req.body.overthrowBoundary;
                await score.save();
                newMatchScore.team1.runs +=
                    score.run + req.body.overthrowBoundary;
                newMatchScore.team1.overs = score.currBall;
            }
            else if (score.status == "retired_hurt") {
                console.log("player retired hurt")
            } else if (score.status == "wide_stumping_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            }
            else if (score.status == "wide_run_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            }
            else {
                return res
                    .status(400)
                    .json({ success: false, message: "Status is invalid" });
            }
        } else {
            if (
                score.status == "run" ||
                score.status == "four" ||
                score.status == "six"
            ) {
                newMatchScore.team2.runs += score.run;
                newMatchScore.team2.overs = score.currBall;

            } else if (
                score.status == "wicket" ||
                score.status == "stumping" ||
                score.status == "catch" ||
                score.status == "lbw" ||
                score.status == "bowled"
            ) {
                newMatchScore.team2.wicket += 1;
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "runout") {
                newMatchScore.team2.runs += score.run + 1;
                newMatchScore.team2.wicket += 1;
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "nbout") {
                newMatchScore.team2.runs += score.run + 1;
                newMatchScore.team2.wicket += 1;
                // newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "nb" || score.status == "wide") {
                newMatchScore.team2.runs += score.run + 1;
            } else if (score.status == "penalty") {
                newMatchScore.team2.runs += score.run
            } else if (score.status == "lb" || score.status == "byes") {
                newMatchScore.team2.runs += score.run
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "overthrow") {
                score.overthrowBoundary = req.body.overthrowBoundary;
                await score.save();
                newMatchScore.team2.runs +=
                    score.run + req.body.overthrowBoundary;
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "retired_hurt") {
                console.log("player retired hurt")
            } else if (score.status == "wide_stumping_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            } else if (score.status == "wide_run_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            } else {
                return res
                    .status(400)
                    .json({ success: false, message: "Status is invalid" });
            }
        }

        matchScore = await MatchScore.findOneAndUpdate(
            { matchId: score.matchId },
            { $set: newMatchScore },
            { new: true }
        );

        let scoreboard = await ScoreBoard.findOne({
            matchId: score.matchId,
            inning: score.inning,
        });

        let newScoreBoard = {
            extras: scoreboard.extras,
            batting: scoreboard.batting,
            balling: scoreboard.balling,
        };

        // Check if the batsman already exists
        let batIndex = newScoreBoard.batting.findIndex((b) =>
            b.playerId.equals(score.batsman1Id)
        );
        let bat2Index = newScoreBoard.batting.findIndex((b) =>
            b.playerId.equals(score.batsman2Id)
        );
        if (batIndex === -1) {
            newScoreBoard.batting.push({
                playerId: score.batsman1Id,
                runs: 0,
                balls: 0,
                fours: 0,
                sixs: 0,
                strikeRate: 0,
                isOut: false,
            });
            batIndex = newScoreBoard.batting.length - 1;
        }
        if (bat2Index === -1) {
            newScoreBoard.batting.push({
                playerId: score.batsman2Id,
                runs: 0,
                balls: 0,
                fours: 0,
                sixs: 0,
                strikeRate: 0,
                isOut: false,
            });
            bat2Index = newScoreBoard.batting.length - 1;
        }

        // Check if the bowler already exists
        let ballIndex = newScoreBoard.balling.findIndex((b) =>
            b.playerId.equals(score.ballerId)
        );
        if (ballIndex === -1) {
            newScoreBoard.balling.push({
                playerId: score.ballerId,
                runs: 0,
                wickets: 0,
                overs: 0,
                balls: 0,
                economy: 0,
                maidenOvers: 0,
                previousRuns: 0
            });
            ballIndex = newScoreBoard.balling.length - 1;
        }
        if (score.status == "run") {
            newScoreBoard.batting[batIndex].runs += score.run;
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += score.run;
            newScoreBoard.balling[ballIndex].balls += 1;
        } else if (score.status == "four") {
            newScoreBoard.batting[batIndex].runs += 4;
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += 4; // Correct the value to 4
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].fours += 1;
        } else if (score.status == "six") {
            newScoreBoard.batting[batIndex].runs += 6;
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += 6; // Correct the value to 6
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].sixes += 1;
        } else if (score.status == "lbw" || score.status == "bowled") {

            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.batting[batIndex].isOut = true;
            newScoreBoard.batting[batIndex].outBy = {
                status: score.status,
                ballerId: score.ballerId,
                secondaryPlayerId: score.secondaryPlayerId,
            };
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.balling[ballIndex].wickets += 1;
        } else if (
            score.status == "stumping" ||
            score.status == "catch"
        ) {
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.batting[batIndex].isOut = true;
            newScoreBoard.batting[batIndex].outBy = {
                status: score.status,
                ballerId: score.ballerId,
                secondaryPlayerId: score.secondaryPlayerId,
            };
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.balling[ballIndex].wickets += 1;
        } else if (score.status == "wide_stumping_out") {
            newScoreBoard.batting[batIndex].isOut = true;
            newScoreBoard.batting[batIndex].outBy = {
                status: score.status,
                ballerId: score.ballerId,
                secondaryPlayerId: score.secondaryPlayerId,
            };
            newScoreBoard.extras.wide += score.run + 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
            newScoreBoard.balling[ballIndex].wickets += 1;
        } else if (score.status === "runout") {
            // Increment balls faced by the batsman who is not out
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.batting[batIndex].runs += score.run;

            const isBatsman1Out = score.outId.equals(score.batsman1Id);
            const isBatsman2Out = score.outId.equals(score.batsman2Id);

            if (isBatsman1Out || isBatsman2Out) {
                const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

                newScoreBoard.batting[outBatsmanIndex].isOut = true;
                newScoreBoard.batting[outBatsmanIndex].outBy = {
                    status: score.status,
                    ballerId: score.ballerId,
                    secondaryPlayerId: score.secondaryPlayerId,
                    runOutType: score.runOutType // Set the runOutType
                };

                if (score.runOutType === 'not_direct') {
                    newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
                }
            }
            // Increment balls bowled
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
            // Increment wickets if needed
            // newScoreBoard.balling[ballIndex].wickets += 1; 
        } else if (score.status == "wide_run_out") {
            // newScoreBoard.batting[batIndex].balls += 1;
            // newScoreBoard.batting[batIndex].runs += score.run;

            const isBatsman1Out = score.outId.equals(score.batsman1Id);
            const isBatsman2Out = score.outId.equals(score.batsman2Id);

            if (isBatsman1Out || isBatsman2Out) {
                const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

                newScoreBoard.batting[outBatsmanIndex].isOut = true;
                newScoreBoard.batting[outBatsmanIndex].outBy = {
                    status: score.status,
                    ballerId: score.ballerId,
                    secondaryPlayerId: score.secondaryPlayerId,
                    runOutType: score.runOutType // Set the runOutType
                };

                if (score.runOutType === 'not_direct') {
                    newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
                }
            }
            // Increment balls bowled
            // newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.extras.wide += score.run + 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else if (score.status == "nb") {
            newScoreBoard.extras.nb += 1;
            if (score.run == 4) {
                newScoreBoard.batting[batIndex].runs += score.run;
                newScoreBoard.batting[batIndex].fours += 1;
            } else if (score.run == 6) {
                newScoreBoard.batting[batIndex].runs += score.run;
                newScoreBoard.batting[batIndex].sixes += 1;
            } else {
                newScoreBoard.batting[batIndex].runs += score.run;
            }
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else if (score.status == "wide") {
            // newScoreBoard.extras.wide += 1;
            // newScoreBoard.balling[ballIndex].runs += 1;
            newScoreBoard.extras.wide += score.run + 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else if (score.status == "lb") {
            newScoreBoard.extras.legByes += score.run;
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].balls += 1;
        } else if (score.status == "byes") {
            newScoreBoard.extras.byes += score.run;
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].balls += 1;
        } else if (score.status == "penalty") {
            newScoreBoard.extras.penalty += score.run;
        } else if (score.status == "nbout") {
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.batting[batIndex].runs += score.run;
            newScoreBoard.batting[batIndex].isOut = true;
            newScoreBoard.extras.nb += 1;

            newScoreBoard.balling[ballIndex].runs += score.run + 1;

            const isBatsman1Out = score.outId.equals(score.batsman1Id);
            const isBatsman2Out = score.outId.equals(score.batsman2Id);

            if (isBatsman1Out || isBatsman2Out) {
                const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

                newScoreBoard.batting[outBatsmanIndex].isOut = true;
                newScoreBoard.batting[outBatsmanIndex].outBy = {
                    status: score.status,
                    ballerId: score.ballerId,
                    secondaryPlayerId: score.secondaryPlayerId,
                    runOutType: score.runOutType // Set the runOutType
                };

                if (score.runOutType === 'not_direct') {
                    newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
                }
            }
            // newScoreBoard.batting[batIndex].outBy = {
            //     status: score.status,
            //     ballerId: score.ballerId,
            //     secondaryPlayerId: score.secondaryPlayerId,
            // };
            // newScoreBoard.balling[ballIndex].wickets += 1;
        } else if (score.status == "retired_hurt") {
            // Determine which batsman is retiring hurt
            const isBatsman1Retired = score.outId.equals(score.batsman1Id);
            const isBatsman2Retired = score.outId.equals(score.batsman2Id);

            // Update the scoreboard for the retired batsman
            if (isBatsman1Retired) {
                newScoreBoard.batting[batIndex].isOut = false; // Mark as out
                newScoreBoard.batting[batIndex].outBy = {
                    status: "retired_hurt",
                    ballerId: score.ballerId,
                };
            } else if (isBatsman2Retired) {
                newScoreBoard.batting[bat2Index].isOut = false; // Mark as out
                newScoreBoard.batting[bat2Index].outBy = {
                    status: "retired_hurt",
                    ballerId: score.ballerId,
                };
            }
        } else if (score.status == "overthrow") {
            if (req.body.overthrowBoundary == 4) {
                newScoreBoard.batting[batIndex].runs += score.run + 4;
                newScoreBoard.batting[batIndex].fours += 1;
            } else if (req.body.overthrowBoundary == 6) {
                newScoreBoard.batting[batIndex].runs += score.run + 6;
                newScoreBoard.batting[batIndex].sixes += 1;
            } else {
                newScoreBoard.batting[batIndex].runs += score.run;
            }
            newScoreBoard.batting[batIndex].runs +=
                score.run + req.body.overthrowBoundary;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else {
            return res
                .status(400)
                .json({ success: false, message: "Status is invalid" });
        }

        const ballsInCurrentOver = newScoreBoard.balling[ballIndex].balls % 6;

        // Check if the over is complete
        if (ballsInCurrentOver === 0) {
            const oversCompleted = newScoreBoard.balling[ballIndex].balls / 6;

            // Calculate runs in the current over
            const runsInCurrentOver = oversCompleted > 1
                ? newScoreBoard.balling[ballIndex].runs - newScoreBoard.balling[ballIndex].previousRuns
                : newScoreBoard.balling[ballIndex].runs;

            // Update the previousRuns to track runs till the end of this over
            newScoreBoard.balling[ballIndex].previousRuns = newScoreBoard.balling[ballIndex].runs;

            // Increment maidenOvers if no runs were conceded in this over
            if (runsInCurrentOver === 0) {
                newScoreBoard.balling[ballIndex].maidenOvers =
                    (newScoreBoard.balling[ballIndex].maidenOvers || 0) + 1;
            }
        }

        newScoreBoard.balling[ballIndex].overs = Math.floor(
            newScoreBoard.balling[ballIndex].balls / 6
        ) + "." + (newScoreBoard.balling[ballIndex].balls % 6);

        newScoreBoard.batting[batIndex].balls =
            newScoreBoard.batting[batIndex].balls || 0;
        newScoreBoard.balling[ballIndex].balls =
            newScoreBoard.balling[ballIndex].balls || 0;

        newScoreBoard.batting[batIndex].strikeRate = parseFloat(
            ((newScoreBoard.batting[batIndex].runs /
                newScoreBoard.batting[batIndex].balls) *
                100).toFixed(2)
        );

        const bowlerOvers =
            Math.floor(newScoreBoard.balling[ballIndex].balls / 6) +
            (newScoreBoard.balling[ballIndex].balls % 6) * 0.1;
        newScoreBoard.balling[ballIndex].economy = parseFloat(
            (newScoreBoard.balling[ballIndex].runs / bowlerOvers).toFixed(2)
        );

        scoreboard = await ScoreBoard.findOneAndUpdate(
            { matchId: score.matchId, inning: score.inning },
            { $set: newScoreBoard },
            { new: true }
        );

        const { pointSystems, leagueId } = await getPointSystemsForMatch(
            matchId
        );

        // console.log("final: ",pointSystems);

        const batsmanPoints = await getPlayerPoints(batsman1Id, matchId, leagueId);
        const ballerPoints = await getPlayerPoints(ballerId, matchId, leagueId);
        const secondaryPlayerPoints = await getPlayerPoints(secondaryPlayerId, matchId, leagueId);

        let updatedBatsmanPoints = batsmanPoints.points;
        let updatedBallerPoints = ballerPoints.points;
        let updatedSecondaryPlayerPoints = secondaryPlayerPoints.points;
        // Batsman
        if ((score.status == "run" || score.status == "four" || score.status == "six" || score.status == "overthrow") && score.run != 0) {
            updatedBatsmanPoints = updateBatsmanPoints(batsmanPoints.points, score, pointSystems);
            if (getPointsFromStatus(pointSystems, "thirty_run") != -1) {
                if ((newScoreBoard.batting[batIndex].runs > 30) && (newScoreBoard.batting[batIndex].runs - score.run < 30)) {
                    updateBatsmanPoints += getPointsFromStatus(pointSystems, "thirty_run")
                }
            }

            if (getPointsFromStatus(pointSystems, "half_century") != -1) {
                if ((newScoreBoard.batting[batIndex].runs > 50) && (newScoreBoard.batting[batIndex].runs - score.run < 50)) {
                    updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
                }
            }

            if (getPointsFromStatus(pointSystems, "century") != -1) {
                if ((newScoreBoard.batting[batIndex].runs > 100) && (newScoreBoard.batting[batIndex].runs - score.run < 100)) {
                    updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
                }
            }

        } //Others
        else if (score.status == "bowled" || score.status == "catch" || score.status == "lbw" || score.status == "stumping") {
            // Baller
            updatedBallerPoints = updateBallerPoints(ballerPoints.points, score, pointSystems);

            if (getPointsFromStatus(pointSystems, "three_wicket") != -1) {
                if ((newScoreBoard.balling[ballIndex].wickets > 3) && (newScoreBoard.balling[ballIndex].wickets - 1 < 3)) {
                    updatedBallerPoints += getPointsFromStatus(pointSystems, "three_wicket")
                }
            }
            if (getPointsFromStatus(pointSystems, "four_wicket") != -1) {
                if ((newScoreBoard.balling[ballIndex].wickets > 4) && (newScoreBoard.balling[ballIndex].wickets - 1 < 4)) {
                    updatedBallerPoints += getPointsFromStatus(pointSystems, "four_wicket")
                }
            }
            if (getPointsFromStatus(pointSystems, "five_wicket") != -1) {
                if ((newScoreBoard.balling[ballIndex].wickets > 5) && (newScoreBoard.balling[ballIndex].wickets - 1 < 5)) {
                    updatedBallerPoints += getPointsFromStatus(pointSystems, "five_wicket")
                }
            }

            // secondaryplayer
            updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);

            if (newScoreBoard.batting[batIndex].balls == 0) {
                updateBatsmanPoints += getPointsFromStatus(pointSystems, "duck");
            }
        }
        else if (score.status == "nbout" || score.status == "runout") {
            updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);
        }

        updatedBatsmanPoints = await updatePointsInDb(matchId, batsman1Id, updatedBatsmanPoints);
        updatedBallerPoints = await updatePointsInDb(matchId, ballerId, updatedBallerPoints);
        updatedSecondaryPlayerPoints = await updatePointsInDb(matchId, secondaryPlayerId, updatedSecondaryPlayerPoints);


        io.emit("livescore", { matchScore, scoreboard });

        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: { score, matchScore, scoreboard },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// exports.superOverScore = async (req, res) => {
//     try {
//         let adminId = req.user;

//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Admin not found",
//             });
//         }
//         // const match = await Match.findById(score.matchId);
//         // if (!match.isStarted) {
//         //     return res
//         //         .status(400)
//         //         .json({ success: false, message: "Match has not yet started" });
//         // }

//         const {
//             matchId,
//             inning,
//             battingTeam,
//             ballingTeam,
//             batsman1Id,
//             batsman2Id,
//             ballerId,
//             secondaryPlayerId,
//             assistingPlayerId,
//             currBall,
//             run,
//             status,
//             runOutType
//         } = req.body;



//         const score = await ScoreCard.create({
//             matchId,
//             inning,
//             battingTeam,
//             ballingTeam,
//             batsman1Id,
//             batsman2Id,
//             ballerId,
//             secondaryPlayerId,
//             assistingPlayerId,
//             currBall,
//             run,
//             status,
//             runOutType
//         });

//         if (req.body.outId.trim().length > 0) {
//             score.outId = req.body.outId;
//             await score.save();
//         }


//         // GET MatchScore by matchId given in score
//         let matchScore = await SuperOver.findOne({ matchId: score.matchId });

//         console.log("matchScore first superover::", matchScore)

//         let newMatchScore = {
//             team1: {
//                 teamId: matchScore.team1.teamId,
//                 runs: matchScore.team1.runs,
//                 wicket: matchScore.team1.wicket,
//                 overs: matchScore.team1.overs,
//             },
//             team2: {
//                 teamId: matchScore.team2.teamId,
//                 runs: matchScore.team2.runs,
//                 wicket: matchScore.team2.wicket,
//                 overs: matchScore.team2.overs,
//             },
//         };

//         // Now we will check what team is batting whether team1 or team2
//         if (score.battingTeam.equals(matchScore.team1.teamId)) {
//             // if there is a run/four/six we will increment balls and runs of the batting team
//             if (
//                 score.status == "run" ||
//                 score.status == "four" ||
//                 score.status == "six"
//             ) {
//                 newMatchScore.team1.runs += score.run;
//                 newMatchScore.team1.overs = score.currBall;
//             }
//             // if there is a wicket we will increment the ball and wickets of that team
//             else if (
//                 score.status == "wicket" ||
//                 score.status == "stumping" ||
//                 score.status == "catch" ||
//                 score.status == "lbw" ||
//                 score.status == "bowled"
//             ) {
//                 newMatchScore.team1.wicket += 1;
//                 newMatchScore.team1.overs = score.currBall;
//             }
//             // if there is a run/four/six we will increment balls and runs of the batting teams and we will update wikets on runout
//             else if (score.status == "runout") {
//                 newMatchScore.team1.runs += score.run;
//                 newMatchScore.team1.wicket += 1;
//                 newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "nbout") {
//                 newMatchScore.team1.runs += score.run + 1;
//                 newMatchScore.team1.wicket += 1;
//                 // newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "nb" || score.status == "wide") {
//                 newMatchScore.team1.runs += score.run + 1
//             } else if (score.status == "lb" || score.status == "byes") {
//                 newMatchScore.team1.runs += score.run
//                 newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "penalty") {
//                 newMatchScore.team1.runs += score.run
//             } else if (score.status == "overthrow") {
//                 score.overthrowBoundary = req.body.overthrowBoundary;
//                 await score.save();
//                 newMatchScore.team1.runs +=
//                     score.run + req.body.overthrowBoundary;
//                 newMatchScore.team1.overs = score.currBall;
//             }
//             else if (score.status == "retired_hurt") {
//                 console.log("player retired hurt")
//             }
//             else {
//                 return res
//                     .status(400)
//                     .json({ success: false, message: "Status is invalid" });
//             }
//         } else {
//             if (
//                 score.status == "run" ||
//                 score.status == "four" ||
//                 score.status == "six"
//             ) {
//                 newMatchScore.team2.runs += score.run;
//                 newMatchScore.team2.overs = score.currBall;

//             } else if (
//                 score.status == "wicket" ||
//                 score.status == "stumping" ||
//                 score.status == "catch" ||
//                 score.status == "lbw" ||
//                 score.status == "bowled"
//             ) {
//                 newMatchScore.team2.wicket += 1;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "runout") {
//                 newMatchScore.team2.runs += score.run + 1;
//                 newMatchScore.team2.wicket += 1;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "nbout") {
//                 newMatchScore.team2.runs += score.run + 1;
//                 newMatchScore.team2.wicket += 1;
//                 // newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "nb" || score.status == "wide") {
//                 newMatchScore.team2.runs += score.run + 1;
//             } else if (score.status == "penalty") {
//                 newMatchScore.team2.runs += score.run
//             } else if (score.status == "lb" || score.status == "byes") {
//                 newMatchScore.team2.runs += score.run
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "overthrow") {
//                 score.overthrowBoundary = req.body.overthrowBoundary;
//                 await score.save();
//                 newMatchScore.team2.runs +=
//                     score.run + req.body.overthrowBoundary;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "retired_hurt") {
//                 console.log("player retired hurt")
//             } else {
//                 return res
//                     .status(400)
//                     .json({ success: false, message: "Status is invalid" });
//             }
//         }

//         matchScore = await SuperOver.findOneAndUpdate(
//             { matchId: score.matchId },
//             { $set: newMatchScore },
//             { new: true }
//         );

//         let scoreboard = await ScoreBoard.findOne({
//             matchId: score.matchId,
//             inning: score.inning,
//         });

//         let newScoreBoard = {
//             extras: scoreboard.extras,
//             batting: scoreboard.batting,
//             balling: scoreboard.balling,
//         };

//         // Check if the batsman already exists
//         let batIndex = newScoreBoard.batting.findIndex((b) =>
//             b.playerId.equals(score.batsman1Id)
//         );
//         let bat2Index = newScoreBoard.batting.findIndex((b) =>
//             b.playerId.equals(score.batsman2Id)
//         );
//         if (batIndex === -1) {
//             newScoreBoard.batting.push({
//                 playerId: score.batsman1Id,
//                 runs: 0,
//                 balls: 0,
//                 fours: 0,
//                 sixs: 0,
//                 strikeRate: 0,
//                 isOut: false,
//             });
//             batIndex = newScoreBoard.batting.length - 1;
//         }
//         if (bat2Index === -1) {
//             newScoreBoard.batting.push({
//                 playerId: score.batsman2Id,
//                 runs: 0,
//                 balls: 0,
//                 fours: 0,
//                 sixs: 0,
//                 strikeRate: 0,
//                 isOut: false,
//             });
//             bat2Index = newScoreBoard.batting.length - 1;
//         }

//         // Check if the bowler already exists
//         let ballIndex = newScoreBoard.balling.findIndex((b) =>
//             b.playerId.equals(score.ballerId)
//         );
//         if (ballIndex === -1) {
//             newScoreBoard.balling.push({
//                 playerId: score.ballerId,
//                 runs: 0,
//                 wickets: 0,
//                 overs: 0,
//                 balls: 0,
//                 economy: 0,
//                 maidenOvers: 0,
//                 previousRuns: 0
//             });
//             ballIndex = newScoreBoard.balling.length - 1;
//         }
//         if (score.status == "run") {
//             newScoreBoard.batting[batIndex].runs += score.run;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += score.run;
//             newScoreBoard.balling[ballIndex].balls += 1;
//         } else if (score.status == "four") {
//             newScoreBoard.batting[batIndex].runs += 4;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += 4; // Correct the value to 4
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].fours += 1;
//         } else if (score.status == "six") {
//             newScoreBoard.batting[batIndex].runs += 6;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += 6; // Correct the value to 6
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].sixes += 1;
//         } else if (
//             score.status == "stumping" ||
//             score.status == "catch" ||
//             score.status == "lbw" ||
//             score.status == "bowled"
//         ) {
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].isOut = true;
//             newScoreBoard.batting[batIndex].outBy = {
//                 status: score.status,
//                 ballerId: score.ballerId,
//                 secondaryPlayerId: score.secondaryPlayerId,
//             };
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].wickets += 1;
//         } else if (score.status === "runout") {
//             // Increment balls faced by the batsman who is not out
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].runs += score.run;

//             const isBatsman1Out = score.outId.equals(score.batsman1Id);
//             const isBatsman2Out = score.outId.equals(score.batsman2Id);

//             if (isBatsman1Out || isBatsman2Out) {
//                 const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

//                 newScoreBoard.batting[outBatsmanIndex].isOut = true;
//                 newScoreBoard.batting[outBatsmanIndex].outBy = {
//                     status: score.status,
//                     ballerId: score.ballerId,
//                     secondaryPlayerId: score.secondaryPlayerId,
//                     runOutType: score.runOutType // Set the runOutType
//                 };

//                 if (score.runOutType === 'not_direct') {
//                     newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
//                 }
//             }
//             // Increment balls bowled
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//             // Increment wickets if needed
//             // newScoreBoard.balling[ballIndex].wickets += 1; 
//         } else if (score.status == "nb") {
//             newScoreBoard.extras.nb += 1;
//             if (score.run == 4) {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//                 newScoreBoard.batting[batIndex].fours += 1;
//             } else if (score.run == 6) {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//                 newScoreBoard.batting[batIndex].sixes += 1;
//             } else {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//             }
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//         } else if (score.status == "wide") {
//             // newScoreBoard.extras.wide += 1;
//             // newScoreBoard.balling[ballIndex].runs += 1;
//             newScoreBoard.extras.wide += 1;
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//         } else if (score.status == "lb") {
//             newScoreBoard.extras.legByes += score.run;
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].balls += 1;
//         } else if (score.status == "byes") {
//             newScoreBoard.extras.byes += score.run;
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].balls += 1;
//         } else if (score.status == "penalty") {
//             newScoreBoard.extras.penalty += score.run;
//         } else if (score.status == "nbout") {
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].runs += score.run;
//             newScoreBoard.batting[batIndex].isOut = true;
//             newScoreBoard.extras.nb += 1;

//             newScoreBoard.balling[ballIndex].runs += score.run + 1;

//             const isBatsman1Out = score.outId.equals(score.batsman1Id);
//             const isBatsman2Out = score.outId.equals(score.batsman2Id);

//             if (isBatsman1Out || isBatsman2Out) {
//                 const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

//                 newScoreBoard.batting[outBatsmanIndex].isOut = true;
//                 newScoreBoard.batting[outBatsmanIndex].outBy = {
//                     status: score.status,
//                     ballerId: score.ballerId,
//                     secondaryPlayerId: score.secondaryPlayerId,
//                     runOutType: score.runOutType // Set the runOutType
//                 };

//                 if (score.runOutType === 'not_direct') {
//                     newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
//                 }
//             }
//             // newScoreBoard.batting[batIndex].outBy = {
//             //     status: score.status,
//             //     ballerId: score.ballerId,
//             //     secondaryPlayerId: score.secondaryPlayerId,
//             // };
//             // newScoreBoard.balling[ballIndex].wickets += 1;
//         } else if (score.status == "retired_hurt") {
//             // Determine which batsman is retiring hurt
//             const isBatsman1Retired = score.outId.equals(score.batsman1Id);
//             const isBatsman2Retired = score.outId.equals(score.batsman2Id);

//             // Update the scoreboard for the retired batsman
//             if (isBatsman1Retired) {
//                 newScoreBoard.batting[batIndex].isOut = false; // Mark as out
//                 newScoreBoard.batting[batIndex].outBy = {
//                     status: "retired_hurt",
//                     ballerId: score.ballerId,
//                 };
//             } else if (isBatsman2Retired) {
//                 newScoreBoard.batting[bat2Index].isOut = false; // Mark as out
//                 newScoreBoard.batting[bat2Index].outBy = {
//                     status: "retired_hurt",
//                     ballerId: score.ballerId,
//                 };
//             }
//         } else if (score.status == "overthrow") {
//             if (req.body.overthrowBoundary == 4) {
//                 newScoreBoard.batting[batIndex].runs += score.run + 4;
//                 newScoreBoard.batting[batIndex].fours += 1;
//             } else if (req.body.overthrowBoundary == 6) {
//                 newScoreBoard.batting[batIndex].runs += score.run + 6;
//                 newScoreBoard.batting[batIndex].sixes += 1;
//             } else {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//             }
//             newScoreBoard.batting[batIndex].runs +=
//                 score.run + req.body.overthrowBoundary;
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//         } else {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "Status is invalid" });
//         }

//         const ballsInCurrentOver = newScoreBoard.balling[ballIndex].balls % 6;

//         // Check if the over is complete
//         if (ballsInCurrentOver === 0) {
//             const oversCompleted = newScoreBoard.balling[ballIndex].balls / 6;

//             // Calculate runs in the current over
//             const runsInCurrentOver = oversCompleted > 1
//                 ? newScoreBoard.balling[ballIndex].runs - newScoreBoard.balling[ballIndex].previousRuns
//                 : newScoreBoard.balling[ballIndex].runs;

//             // Update the previousRuns to track runs till the end of this over
//             newScoreBoard.balling[ballIndex].previousRuns = newScoreBoard.balling[ballIndex].runs;

//             // Increment maidenOvers if no runs were conceded in this over
//             if (runsInCurrentOver === 0) {
//                 newScoreBoard.balling[ballIndex].maidenOvers =
//                     (newScoreBoard.balling[ballIndex].maidenOvers || 0) + 1;
//             }
//         }

//         newScoreBoard.balling[ballIndex].overs = Math.floor(
//             newScoreBoard.balling[ballIndex].balls / 6
//         ) + "." + (newScoreBoard.balling[ballIndex].balls % 6);

//         newScoreBoard.batting[batIndex].balls =
//             newScoreBoard.batting[batIndex].balls || 0;
//         newScoreBoard.balling[ballIndex].balls =
//             newScoreBoard.balling[ballIndex].balls || 0;

//         newScoreBoard.batting[batIndex].strikeRate = parseFloat(
//             ((newScoreBoard.batting[batIndex].runs /
//                 newScoreBoard.batting[batIndex].balls) *
//                 100).toFixed(2)
//         );

//         const bowlerOvers =
//             Math.floor(newScoreBoard.balling[ballIndex].balls / 6) +
//             (newScoreBoard.balling[ballIndex].balls % 6) * 0.1;
//         newScoreBoard.balling[ballIndex].economy = parseFloat(
//             (newScoreBoard.balling[ballIndex].runs / bowlerOvers).toFixed(2)
//         );

//         scoreboard = await ScoreBoard.findOneAndUpdate(
//             { matchId: score.matchId, inning: score.inning },
//             { $set: newScoreBoard },
//             { new: true }
//         );

//         const { pointSystems, leagueId } = await getPointSystemsForMatch(
//             matchId
//         );

//         // console.log("final: ",pointSystems);

//         const batsmanPoints = await getPlayerPoints(batsman1Id, matchId, leagueId);
//         const ballerPoints = await getPlayerPoints(ballerId, matchId, leagueId);
//         const secondaryPlayerPoints = await getPlayerPoints(secondaryPlayerId, matchId, leagueId);

//         let updatedBatsmanPoints = batsmanPoints.points;
//         let updatedBallerPoints = ballerPoints.points;
//         let updatedSecondaryPlayerPoints = secondaryPlayerPoints.points;
//         // Batsman
//         if ((score.status == "run" || score.status == "four" || score.status == "six" || score.status == "overthrow") && score.run != 0) {
//             updatedBatsmanPoints = updateBatsmanPoints(batsmanPoints.points, score, pointSystems);
//             if (getPointsFromStatus(pointSystems, "thirty_run") != -1) {
//                 if ((newScoreBoard.batting[batIndex].runs > 30) && (newScoreBoard.batting[batIndex].runs - score.run < 30)) {
//                     updateBatsmanPoints += getPointsFromStatus(pointSystems, "thirty_run")
//                 }
//             }

//             if (getPointsFromStatus(pointSystems, "half_century") != -1) {
//                 if ((newScoreBoard.batting[batIndex].runs > 50) && (newScoreBoard.batting[batIndex].runs - score.run < 50)) {
//                     updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
//                 }
//             }

//             if (getPointsFromStatus(pointSystems, "century") != -1) {
//                 if ((newScoreBoard.batting[batIndex].runs > 100) && (newScoreBoard.batting[batIndex].runs - score.run < 100)) {
//                     updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
//                 }
//             }

//         } //Others
//         else if (score.status == "bowled" || score.status == "catch" || score.status == "lbw" || score.status == "stumping") {
//             // Baller
//             updatedBallerPoints = updateBallerPoints(ballerPoints.points, score, pointSystems);

//             if (getPointsFromStatus(pointSystems, "three_wicket") != -1) {
//                 if ((newScoreBoard.balling[ballIndex].wickets > 3) && (newScoreBoard.balling[ballIndex].wickets - 1 < 3)) {
//                     updatedBallerPoints += getPointsFromStatus(pointSystems, "three_wicket")
//                 }
//             }
//             if (getPointsFromStatus(pointSystems, "four_wicket") != -1) {
//                 if ((newScoreBoard.balling[ballIndex].wickets > 4) && (newScoreBoard.balling[ballIndex].wickets - 1 < 4)) {
//                     updatedBallerPoints += getPointsFromStatus(pointSystems, "four_wicket")
//                 }
//             }
//             if (getPointsFromStatus(pointSystems, "five_wicket") != -1) {
//                 if ((newScoreBoard.balling[ballIndex].wickets > 5) && (newScoreBoard.balling[ballIndex].wickets - 1 < 5)) {
//                     updatedBallerPoints += getPointsFromStatus(pointSystems, "five_wicket")
//                 }
//             }

//             // secondaryplayer
//             updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);

//             if (newScoreBoard.batting[batIndex].balls == 0) {
//                 updateBatsmanPoints += getPointsFromStatus(pointSystems, "duck");
//             }
//         }
//         else if (score.status == "nbout" || score.status == "runout") {
//             updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);
//         }

//         updatedBatsmanPoints = await updatePointsInDb(matchId, batsman1Id, updatedBatsmanPoints);
//         updatedBallerPoints = await updatePointsInDb(matchId, ballerId, updatedBallerPoints);
//         updatedSecondaryPlayerPoints = await updatePointsInDb(matchId, secondaryPlayerId, updatedSecondaryPlayerPoints);


//         io.emit("livescore", { matchScore, scoreboard });

//         return res.status(200).json({
//             success: true,
//             message: "Score added successfully",
//             data: { score, matchScore, scoreboard },
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message,
//         });
//     }
// };

exports.superOverScore = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        // const match = await Match.findById(score.matchId);
        // if (!match.isStarted) {
        //     return res
        //         .status(400)
        //         .json({ success: false, message: "Match has not yet started" });
        // }

        const {
            matchId,
            inning,
            battingTeam,
            ballingTeam,
            batsman1Id,
            batsman2Id,
            ballerId,
            secondaryPlayerId,
            assistingPlayerId,
            currBall,
            run,
            status,
            runOutType
        } = req.body;



        const score = await ScoreCard.create({
            matchId,
            inning,
            battingTeam,
            ballingTeam,
            batsman1Id,
            batsman2Id,
            ballerId,
            secondaryPlayerId,
            assistingPlayerId,
            currBall,
            run,
            status,
            runOutType
        });

        if (req.body.outId.trim().length > 0) {
            score.outId = req.body.outId;
            await score.save();
        }


        // GET MatchScore by matchId given in score
        let matchScore = await SuperOver.findOne({ matchId: score.matchId });

        console.log("matchScore first superover::", matchScore)

        let newMatchScore = {
            team1: {
                teamId: matchScore.team1.teamId,
                runs: matchScore.team1.runs,
                wicket: matchScore.team1.wicket,
                overs: matchScore.team1.overs,
            },
            team2: {
                teamId: matchScore.team2.teamId,
                runs: matchScore.team2.runs,
                wicket: matchScore.team2.wicket,
                overs: matchScore.team2.overs,
            },
        };

        // Now we will check what team is batting whether team1 or team2
        if (score.battingTeam.equals(matchScore.team1.teamId)) {
            // if there is a run/four/six we will increment balls and runs of the batting team
            if (
                score.status == "run" ||
                score.status == "four" ||
                score.status == "six"
            ) {
                newMatchScore.team1.runs += score.run;
                newMatchScore.team1.overs = score.currBall;
            }
            // if there is a wicket we will increment the ball and wickets of that team
            else if (
                score.status == "wicket" ||
                score.status == "stumping" ||
                score.status == "catch" ||
                score.status == "lbw" ||
                score.status == "bowled"
            ) {
                newMatchScore.team1.wicket += 1;
                newMatchScore.team1.overs = score.currBall;
            }
            // if there is a run/four/six we will increment balls and runs of the batting teams and we will update wikets on runout
            else if (score.status == "runout") {
                newMatchScore.team1.runs += score.run;
                newMatchScore.team1.wicket += 1;
                newMatchScore.team1.overs = score.currBall;
            } else if (score.status == "nbout") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
                // newMatchScore.team1.overs = score.currBall;
            } else if (score.status == "nb" || score.status == "wide") {
                newMatchScore.team1.runs += score.run + 1
            } else if (score.status == "lb" || score.status == "byes") {
                newMatchScore.team1.runs += score.run
                newMatchScore.team1.overs = score.currBall;
            } else if (score.status == "penalty") {
                newMatchScore.team1.runs += score.run
            } else if (score.status == "overthrow") {
                score.overthrowBoundary = req.body.overthrowBoundary;
                await score.save();
                newMatchScore.team1.runs +=
                    score.run + req.body.overthrowBoundary;
                newMatchScore.team1.overs = score.currBall;
            }
            else if (score.status == "retired_hurt") {
                console.log("player retired hurt")
            } else if (score.status == "wide_stumping_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            } else if (score.status == "wide_run_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            }
            else {
                return res
                    .status(400)
                    .json({ success: false, message: "Status is invalid" });
            }
        } else {
            if (
                score.status == "run" ||
                score.status == "four" ||
                score.status == "six"
            ) {
                newMatchScore.team2.runs += score.run;
                newMatchScore.team2.overs = score.currBall;

            } else if (
                score.status == "wicket" ||
                score.status == "stumping" ||
                score.status == "catch" ||
                score.status == "lbw" ||
                score.status == "bowled"
            ) {
                newMatchScore.team2.wicket += 1;
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "runout") {
                newMatchScore.team2.runs += score.run + 1;
                newMatchScore.team2.wicket += 1;
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "nbout") {
                newMatchScore.team2.runs += score.run + 1;
                newMatchScore.team2.wicket += 1;
                // newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "nb" || score.status == "wide") {
                newMatchScore.team2.runs += score.run + 1;
            } else if (score.status == "penalty") {
                newMatchScore.team2.runs += score.run
            } else if (score.status == "lb" || score.status == "byes") {
                newMatchScore.team2.runs += score.run
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "overthrow") {
                score.overthrowBoundary = req.body.overthrowBoundary;
                await score.save();
                newMatchScore.team2.runs +=
                    score.run + req.body.overthrowBoundary;
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "retired_hurt") {
                console.log("player retired hurt")
            } else if (score.status == "wide_stumping_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            } else if (score.status == "wide_run_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            } else {
                return res
                    .status(400)
                    .json({ success: false, message: "Status is invalid" });
            }
        }

        matchScore = await SuperOver.findOneAndUpdate(
            { matchId: score.matchId },
            { $set: newMatchScore },
            { new: true }
        );

        let scoreboard = await ScoreBoard.findOne({
            matchId: score.matchId,
            inning: score.inning,
        });

        let newScoreBoard = {
            extras: scoreboard.extras,
            batting: scoreboard.batting,
            balling: scoreboard.balling,
        };

        // Check if the batsman already exists
        let batIndex = newScoreBoard.batting.findIndex((b) =>
            b.playerId.equals(score.batsman1Id)
        );
        let bat2Index = newScoreBoard.batting.findIndex((b) =>
            b.playerId.equals(score.batsman2Id)
        );
        if (batIndex === -1) {
            newScoreBoard.batting.push({
                playerId: score.batsman1Id,
                runs: 0,
                balls: 0,
                fours: 0,
                sixs: 0,
                strikeRate: 0,
                isOut: false,
            });
            batIndex = newScoreBoard.batting.length - 1;
        }
        if (bat2Index === -1) {
            newScoreBoard.batting.push({
                playerId: score.batsman2Id,
                runs: 0,
                balls: 0,
                fours: 0,
                sixs: 0,
                strikeRate: 0,
                isOut: false,
            });
            bat2Index = newScoreBoard.batting.length - 1;
        }

        // Check if the bowler already exists
        let ballIndex = newScoreBoard.balling.findIndex((b) =>
            b.playerId.equals(score.ballerId)
        );
        if (ballIndex === -1) {
            newScoreBoard.balling.push({
                playerId: score.ballerId,
                runs: 0,
                wickets: 0,
                overs: 0,
                balls: 0,
                economy: 0,
                maidenOvers: 0,
                previousRuns: 0
            });
            ballIndex = newScoreBoard.balling.length - 1;
        }
        if (score.status == "run") {
            newScoreBoard.batting[batIndex].runs += score.run;
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += score.run;
            newScoreBoard.balling[ballIndex].balls += 1;
        } else if (score.status == "four") {
            newScoreBoard.batting[batIndex].runs += 4;
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += 4; // Correct the value to 4
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].fours += 1;
        } else if (score.status == "six") {
            newScoreBoard.batting[batIndex].runs += 6;
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += 6; // Correct the value to 6
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].sixes += 1;
        } else if (
            score.status == "stumping" ||
            score.status == "catch" ||
            score.status == "lbw" ||
            score.status == "bowled"
        ) {
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.batting[batIndex].isOut = true;
            newScoreBoard.batting[batIndex].outBy = {
                status: score.status,
                ballerId: score.ballerId,
                secondaryPlayerId: score.secondaryPlayerId,
            };
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.balling[ballIndex].wickets += 1;
        } else if (score.status == "wide_stumping_out") {
            newScoreBoard.batting[batIndex].isOut = true;
            newScoreBoard.batting[batIndex].outBy = {
                status: score.status,
                ballerId: score.ballerId,
                secondaryPlayerId: score.secondaryPlayerId,
            };
            newScoreBoard.extras.wide += score.run + 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
            newScoreBoard.balling[ballIndex].wickets += 1;
        } else if (score.status === "runout") {
            // Increment balls faced by the batsman who is not out
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.batting[batIndex].runs += score.run;

            const isBatsman1Out = score.outId.equals(score.batsman1Id);
            const isBatsman2Out = score.outId.equals(score.batsman2Id);

            if (isBatsman1Out || isBatsman2Out) {
                const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

                newScoreBoard.batting[outBatsmanIndex].isOut = true;
                newScoreBoard.batting[outBatsmanIndex].outBy = {
                    status: score.status,
                    ballerId: score.ballerId,
                    secondaryPlayerId: score.secondaryPlayerId,
                    runOutType: score.runOutType // Set the runOutType
                };

                if (score.runOutType === 'not_direct') {
                    newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
                }
            }
            // Increment balls bowled
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
            // Increment wickets if needed
            // newScoreBoard.balling[ballIndex].wickets += 1; 
        } else if (score.status == "wide_run_out") {
            // newScoreBoard.batting[batIndex].balls += 1;
            // newScoreBoard.batting[batIndex].runs += score.run;

            const isBatsman1Out = score.outId.equals(score.batsman1Id);
            const isBatsman2Out = score.outId.equals(score.batsman2Id);

            if (isBatsman1Out || isBatsman2Out) {
                const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

                newScoreBoard.batting[outBatsmanIndex].isOut = true;
                newScoreBoard.batting[outBatsmanIndex].outBy = {
                    status: score.status,
                    ballerId: score.ballerId,
                    secondaryPlayerId: score.secondaryPlayerId,
                    runOutType: score.runOutType // Set the runOutType
                };

                if (score.runOutType === 'not_direct') {
                    newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
                }
            }
            // Increment balls bowled
            // newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.extras.wide += score.run + 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else if (score.status == "nb") {
            newScoreBoard.extras.nb += 1;
            if (score.run == 4) {
                newScoreBoard.batting[batIndex].runs += score.run;
                newScoreBoard.batting[batIndex].fours += 1;
            } else if (score.run == 6) {
                newScoreBoard.batting[batIndex].runs += score.run;
                newScoreBoard.batting[batIndex].sixes += 1;
            } else {
                newScoreBoard.batting[batIndex].runs += score.run;
            }
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else if (score.status == "wide") {
            // newScoreBoard.extras.wide += 1;
            // newScoreBoard.balling[ballIndex].runs += 1;
            newScoreBoard.extras.wide += 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else if (score.status == "lb") {
            newScoreBoard.extras.legByes += score.run;
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].balls += 1;
        } else if (score.status == "byes") {
            newScoreBoard.extras.byes += score.run;
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].balls += 1;
        } else if (score.status == "penalty") {
            newScoreBoard.extras.penalty += score.run;
        } else if (score.status == "nbout") {
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.batting[batIndex].runs += score.run;
            newScoreBoard.batting[batIndex].isOut = true;
            newScoreBoard.extras.nb += 1;

            newScoreBoard.balling[ballIndex].runs += score.run + 1;

            const isBatsman1Out = score.outId.equals(score.batsman1Id);
            const isBatsman2Out = score.outId.equals(score.batsman2Id);

            if (isBatsman1Out || isBatsman2Out) {
                const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

                newScoreBoard.batting[outBatsmanIndex].isOut = true;
                newScoreBoard.batting[outBatsmanIndex].outBy = {
                    status: score.status,
                    ballerId: score.ballerId,
                    secondaryPlayerId: score.secondaryPlayerId,
                    runOutType: score.runOutType // Set the runOutType
                };

                if (score.runOutType === 'not_direct') {
                    newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
                }
            }
            // newScoreBoard.batting[batIndex].outBy = {
            //     status: score.status,
            //     ballerId: score.ballerId,
            //     secondaryPlayerId: score.secondaryPlayerId,
            // };
            // newScoreBoard.balling[ballIndex].wickets += 1;
        } else if (score.status == "retired_hurt") {
            // Determine which batsman is retiring hurt
            const isBatsman1Retired = score.outId.equals(score.batsman1Id);
            const isBatsman2Retired = score.outId.equals(score.batsman2Id);

            // Update the scoreboard for the retired batsman
            if (isBatsman1Retired) {
                newScoreBoard.batting[batIndex].isOut = false; // Mark as out
                newScoreBoard.batting[batIndex].outBy = {
                    status: "retired_hurt",
                    ballerId: score.ballerId,
                };
            } else if (isBatsman2Retired) {
                newScoreBoard.batting[bat2Index].isOut = false; // Mark as out
                newScoreBoard.batting[bat2Index].outBy = {
                    status: "retired_hurt",
                    ballerId: score.ballerId,
                };
            }
        } else if (score.status == "overthrow") {
            if (req.body.overthrowBoundary == 4) {
                newScoreBoard.batting[batIndex].runs += score.run + 4;
                newScoreBoard.batting[batIndex].fours += 1;
            } else if (req.body.overthrowBoundary == 6) {
                newScoreBoard.batting[batIndex].runs += score.run + 6;
                newScoreBoard.batting[batIndex].sixes += 1;
            } else {
                newScoreBoard.batting[batIndex].runs += score.run;
            }
            newScoreBoard.batting[batIndex].runs +=
                score.run + req.body.overthrowBoundary;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else {
            return res
                .status(400)
                .json({ success: false, message: "Status is invalid" });
        }

        const ballsInCurrentOver = newScoreBoard.balling[ballIndex].balls % 6;

        // Check if the over is complete
        if (ballsInCurrentOver === 0) {
            const oversCompleted = newScoreBoard.balling[ballIndex].balls / 6;

            // Calculate runs in the current over
            const runsInCurrentOver = oversCompleted > 1
                ? newScoreBoard.balling[ballIndex].runs - newScoreBoard.balling[ballIndex].previousRuns
                : newScoreBoard.balling[ballIndex].runs;

            // Update the previousRuns to track runs till the end of this over
            newScoreBoard.balling[ballIndex].previousRuns = newScoreBoard.balling[ballIndex].runs;

            // Increment maidenOvers if no runs were conceded in this over
            if (runsInCurrentOver === 0) {
                newScoreBoard.balling[ballIndex].maidenOvers =
                    (newScoreBoard.balling[ballIndex].maidenOvers || 0) + 1;
            }
        }

        newScoreBoard.balling[ballIndex].overs = Math.floor(
            newScoreBoard.balling[ballIndex].balls / 6
        ) + "." + (newScoreBoard.balling[ballIndex].balls % 6);

        newScoreBoard.batting[batIndex].balls =
            newScoreBoard.batting[batIndex].balls || 0;
        newScoreBoard.balling[ballIndex].balls =
            newScoreBoard.balling[ballIndex].balls || 0;

        newScoreBoard.batting[batIndex].strikeRate = parseFloat(
            ((newScoreBoard.batting[batIndex].runs /
                newScoreBoard.batting[batIndex].balls) *
                100).toFixed(2)
        );

        const bowlerOvers =
            Math.floor(newScoreBoard.balling[ballIndex].balls / 6) +
            (newScoreBoard.balling[ballIndex].balls % 6) * 0.1;
        newScoreBoard.balling[ballIndex].economy = parseFloat(
            (newScoreBoard.balling[ballIndex].runs / bowlerOvers).toFixed(2)
        );

        scoreboard = await ScoreBoard.findOneAndUpdate(
            { matchId: score.matchId, inning: score.inning },
            { $set: newScoreBoard },
            { new: true }
        );

        const { pointSystems, leagueId } = await getPointSystemsForMatch(
            matchId
        );

        // console.log("final: ",pointSystems);

        const batsmanPoints = await getPlayerPoints(batsman1Id, matchId, leagueId);
        const ballerPoints = await getPlayerPoints(ballerId, matchId, leagueId);
        const secondaryPlayerPoints = await getPlayerPoints(secondaryPlayerId, matchId, leagueId);

        let updatedBatsmanPoints = batsmanPoints.points;
        let updatedBallerPoints = ballerPoints.points;
        let updatedSecondaryPlayerPoints = secondaryPlayerPoints.points;
        // Batsman
        if ((score.status == "run" || score.status == "four" || score.status == "six" || score.status == "overthrow") && score.run != 0) {
            updatedBatsmanPoints = updateBatsmanPoints(batsmanPoints.points, score, pointSystems);
            if (getPointsFromStatus(pointSystems, "thirty_run") != -1) {
                if ((newScoreBoard.batting[batIndex].runs > 30) && (newScoreBoard.batting[batIndex].runs - score.run < 30)) {
                    updateBatsmanPoints += getPointsFromStatus(pointSystems, "thirty_run")
                }
            }

            if (getPointsFromStatus(pointSystems, "half_century") != -1) {
                if ((newScoreBoard.batting[batIndex].runs > 50) && (newScoreBoard.batting[batIndex].runs - score.run < 50)) {
                    updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
                }
            }

            if (getPointsFromStatus(pointSystems, "century") != -1) {
                if ((newScoreBoard.batting[batIndex].runs > 100) && (newScoreBoard.batting[batIndex].runs - score.run < 100)) {
                    updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
                }
            }

        } //Others
        else if (score.status == "bowled" || score.status == "catch" || score.status == "lbw" || score.status == "stumping") {
            // Baller
            updatedBallerPoints = updateBallerPoints(ballerPoints.points, score, pointSystems);

            if (getPointsFromStatus(pointSystems, "three_wicket") != -1) {
                if ((newScoreBoard.balling[ballIndex].wickets > 3) && (newScoreBoard.balling[ballIndex].wickets - 1 < 3)) {
                    updatedBallerPoints += getPointsFromStatus(pointSystems, "three_wicket")
                }
            }
            if (getPointsFromStatus(pointSystems, "four_wicket") != -1) {
                if ((newScoreBoard.balling[ballIndex].wickets > 4) && (newScoreBoard.balling[ballIndex].wickets - 1 < 4)) {
                    updatedBallerPoints += getPointsFromStatus(pointSystems, "four_wicket")
                }
            }
            if (getPointsFromStatus(pointSystems, "five_wicket") != -1) {
                if ((newScoreBoard.balling[ballIndex].wickets > 5) && (newScoreBoard.balling[ballIndex].wickets - 1 < 5)) {
                    updatedBallerPoints += getPointsFromStatus(pointSystems, "five_wicket")
                }
            }

            // secondaryplayer
            updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);

            if (newScoreBoard.batting[batIndex].balls == 0) {
                updateBatsmanPoints += getPointsFromStatus(pointSystems, "duck");
            }
        }
        else if (score.status == "nbout" || score.status == "runout") {
            updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);
        }

        updatedBatsmanPoints = await updatePointsInDb(matchId, batsman1Id, updatedBatsmanPoints);
        updatedBallerPoints = await updatePointsInDb(matchId, ballerId, updatedBallerPoints);
        updatedSecondaryPlayerPoints = await updatePointsInDb(matchId, secondaryPlayerId, updatedSecondaryPlayerPoints);


        io.emit("livescore", { matchScore, scoreboard });

        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: { score, matchScore, scoreboard },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


// exports.secoundSuperOverScore = async (req, res) => {
//     try {
//         let adminId = req.user;

//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Admin not found",
//             });
//         }
//         // const match = await Match.findById(score.matchId);
//         // if (!match.isStarted) {
//         //     return res
//         //         .status(400)
//         //         .json({ success: false, message: "Match has not yet started" });
//         // }

//         const {
//             matchId,
//             inning,
//             battingTeam,
//             ballingTeam,
//             batsman1Id,
//             batsman2Id,
//             ballerId,
//             secondaryPlayerId,
//             assistingPlayerId,
//             currBall,
//             run,
//             status,
//             runOutType
//         } = req.body;



//         const score = await ScoreCard.create({
//             matchId,
//             inning,
//             battingTeam,
//             ballingTeam,
//             batsman1Id,
//             batsman2Id,
//             ballerId,
//             secondaryPlayerId,
//             assistingPlayerId,
//             currBall,
//             run,
//             status,
//             runOutType
//         });

//         if (req.body.outId.trim().length > 0) {
//             score.outId = req.body.outId;
//             await score.save();
//         }


//         // GET MatchScore by matchId given in score
//         let matchScore = await SecoundSuperOver.findOne({ matchId: score.matchId, });

//         console.log("matchScore::", matchScore)


//         let newMatchScore = {
//             team1: {
//                 teamId: matchScore.team1.teamId,
//                 runs: matchScore.team1.runs,
//                 wicket: matchScore.team1.wicket,
//                 overs: matchScore.team1.overs,
//             },
//             team2: {
//                 teamId: matchScore.team2.teamId,
//                 runs: matchScore.team2.runs,
//                 wicket: matchScore.team2.wicket,
//                 overs: matchScore.team2.overs,
//             },
//         };

//         // Now we will check what team is batting whether team1 or team2
//         if (score.battingTeam.equals(matchScore.team1.teamId)) {
//             // if there is a run/four/six we will increment balls and runs of the batting team
//             if (
//                 score.status == "run" ||
//                 score.status == "four" ||
//                 score.status == "six"
//             ) {
//                 newMatchScore.team1.runs += score.run;
//                 newMatchScore.team1.overs = score.currBall;
//             }
//             // if there is a wicket we will increment the ball and wickets of that team
//             else if (
//                 score.status == "wicket" ||
//                 score.status == "stumping" ||
//                 score.status == "catch" ||
//                 score.status == "lbw" ||
//                 score.status == "bowled"
//             ) {
//                 newMatchScore.team1.wicket += 1;
//                 newMatchScore.team1.overs = score.currBall;
//             }
//             // if there is a run/four/six we will increment balls and runs of the batting teams and we will update wikets on runout
//             else if (score.status == "runout") {
//                 newMatchScore.team1.runs += score.run;
//                 newMatchScore.team1.wicket += 1;
//                 newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "nbout") {
//                 newMatchScore.team1.runs += score.run + 1;
//                 newMatchScore.team1.wicket += 1;
//                 // newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "nb" || score.status == "wide") {
//                 newMatchScore.team1.runs += score.run + 1
//             } else if (score.status == "lb" || score.status == "byes") {
//                 newMatchScore.team1.runs += score.run
//                 newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "penalty") {
//                 newMatchScore.team1.runs += score.run
//             } else if (score.status == "overthrow") {
//                 score.overthrowBoundary = req.body.overthrowBoundary;
//                 await score.save();
//                 newMatchScore.team1.runs +=
//                     score.run + req.body.overthrowBoundary;
//                 newMatchScore.team1.overs = score.currBall;
//             }
//             else if (score.status == "retired_hurt") {
//                 console.log("player retired hurt")
//             }
//             else {
//                 return res
//                     .status(400)
//                     .json({ success: false, message: "Status is invalid" });
//             }
//         } else {
//             if (
//                 score.status == "run" ||
//                 score.status == "four" ||
//                 score.status == "six"
//             ) {
//                 newMatchScore.team2.runs += score.run;
//                 newMatchScore.team2.overs = score.currBall;

//             } else if (
//                 score.status == "wicket" ||
//                 score.status == "stumping" ||
//                 score.status == "catch" ||
//                 score.status == "lbw" ||
//                 score.status == "bowled"
//             ) {
//                 newMatchScore.team2.wicket += 1;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "runout") {
//                 newMatchScore.team2.runs += score.run + 1;
//                 newMatchScore.team2.wicket += 1;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "nbout") {
//                 newMatchScore.team2.runs += score.run + 1;
//                 newMatchScore.team2.wicket += 1;
//                 // newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "nb" || score.status == "wide") {
//                 newMatchScore.team2.runs += score.run + 1;
//             } else if (score.status == "penalty") {
//                 newMatchScore.team2.runs += score.run
//             } else if (score.status == "lb" || score.status == "byes") {
//                 newMatchScore.team2.runs += score.run
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "overthrow") {
//                 score.overthrowBoundary = req.body.overthrowBoundary;
//                 await score.save();
//                 newMatchScore.team2.runs +=
//                     score.run + req.body.overthrowBoundary;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "retired_hurt") {
//                 console.log("player retired hurt")
//             } else {
//                 return res
//                     .status(400)
//                     .json({ success: false, message: "Status is invalid" });
//             }
//         }

//         matchScore = await SecoundSuperOver.findOneAndUpdate(
//             { matchId: score.matchId },
//             { $set: newMatchScore },
//             { new: true }
//         );

//         let scoreboard = await ScoreBoard.findOne({
//             matchId: score.matchId,
//             inning: score.inning,
//         });


//         let newScoreBoard = {
//             extras: scoreboard.extras,
//             batting: scoreboard.batting,
//             balling: scoreboard.balling,
//         };

//         // Check if the batsman already exists
//         let batIndex = newScoreBoard.batting.findIndex((b) =>
//             b.playerId.equals(score.batsman1Id)
//         );
//         let bat2Index = newScoreBoard.batting.findIndex((b) =>
//             b.playerId.equals(score.batsman2Id)
//         );
//         if (batIndex === -1) {
//             newScoreBoard.batting.push({
//                 playerId: score.batsman1Id,
//                 runs: 0,
//                 balls: 0,
//                 fours: 0,
//                 sixs: 0,
//                 strikeRate: 0,
//                 isOut: false,
//             });
//             batIndex = newScoreBoard.batting.length - 1;
//         }
//         if (bat2Index === -1) {
//             newScoreBoard.batting.push({
//                 playerId: score.batsman2Id,
//                 runs: 0,
//                 balls: 0,
//                 fours: 0,
//                 sixs: 0,
//                 strikeRate: 0,
//                 isOut: false,
//             });
//             bat2Index = newScoreBoard.batting.length - 1;
//         }

//         // Check if the bowler already exists
//         let ballIndex = newScoreBoard.balling.findIndex((b) =>
//             b.playerId.equals(score.ballerId)
//         );
//         if (ballIndex === -1) {
//             newScoreBoard.balling.push({
//                 playerId: score.ballerId,
//                 runs: 0,
//                 wickets: 0,
//                 overs: 0,
//                 balls: 0,
//                 economy: 0,
//                 maidenOvers: 0,
//                 previousRuns: 0
//             });
//             ballIndex = newScoreBoard.balling.length - 1;
//         }
//         if (score.status == "run") {
//             newScoreBoard.batting[batIndex].runs += score.run;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += score.run;
//             newScoreBoard.balling[ballIndex].balls += 1;
//         } else if (score.status == "four") {
//             newScoreBoard.batting[batIndex].runs += 4;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += 4; // Correct the value to 4
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].fours += 1;
//         } else if (score.status == "six") {
//             newScoreBoard.batting[batIndex].runs += 6;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += 6; // Correct the value to 6
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].sixes += 1;
//         } else if (
//             score.status == "stumping" ||
//             score.status == "catch" ||
//             score.status == "lbw" ||
//             score.status == "bowled"
//         ) {
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].isOut = true;
//             newScoreBoard.batting[batIndex].outBy = {
//                 status: score.status,
//                 ballerId: score.ballerId,
//                 secondaryPlayerId: score.secondaryPlayerId,
//             };
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].wickets += 1;
//         } else if (score.status === "runout") {
//             // Increment balls faced by the batsman who is not out
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].runs += score.run;

//             const isBatsman1Out = score.outId.equals(score.batsman1Id);
//             const isBatsman2Out = score.outId.equals(score.batsman2Id);

//             if (isBatsman1Out || isBatsman2Out) {
//                 const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

//                 newScoreBoard.batting[outBatsmanIndex].isOut = true;
//                 newScoreBoard.batting[outBatsmanIndex].outBy = {
//                     status: score.status,
//                     ballerId: score.ballerId,
//                     secondaryPlayerId: score.secondaryPlayerId,
//                     runOutType: score.runOutType // Set the runOutType
//                 };

//                 if (score.runOutType === 'not_direct') {
//                     newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
//                 }
//             }
//             // Increment balls bowled
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//             // Increment wickets if needed
//             // newScoreBoard.balling[ballIndex].wickets += 1; 
//         } else if (score.status == "nb") {
//             newScoreBoard.extras.nb += 1;
//             if (score.run == 4) {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//                 newScoreBoard.batting[batIndex].fours += 1;
//             } else if (score.run == 6) {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//                 newScoreBoard.batting[batIndex].sixes += 1;
//             } else {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//             }
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//         } else if (score.status == "wide") {
//             // newScoreBoard.extras.wide += 1;
//             // newScoreBoard.balling[ballIndex].runs += 1;
//             newScoreBoard.extras.wide += 1;
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//         } else if (score.status == "lb") {
//             newScoreBoard.extras.legByes += score.run;
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].balls += 1;
//         } else if (score.status == "byes") {
//             newScoreBoard.extras.byes += score.run;
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].balls += 1;
//         } else if (score.status == "penalty") {
//             newScoreBoard.extras.penalty += score.run;
//         } else if (score.status == "nbout") {
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].runs += score.run;
//             newScoreBoard.batting[batIndex].isOut = true;
//             newScoreBoard.extras.nb += 1;

//             newScoreBoard.balling[ballIndex].runs += score.run + 1;

//             const isBatsman1Out = score.outId.equals(score.batsman1Id);
//             const isBatsman2Out = score.outId.equals(score.batsman2Id);

//             if (isBatsman1Out || isBatsman2Out) {
//                 const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

//                 newScoreBoard.batting[outBatsmanIndex].isOut = true;
//                 newScoreBoard.batting[outBatsmanIndex].outBy = {
//                     status: score.status,
//                     ballerId: score.ballerId,
//                     secondaryPlayerId: score.secondaryPlayerId,
//                     runOutType: score.runOutType // Set the runOutType
//                 };

//                 if (score.runOutType === 'not_direct') {
//                     newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
//                 }
//             }
//             // newScoreBoard.batting[batIndex].outBy = {
//             //     status: score.status,
//             //     ballerId: score.ballerId,
//             //     secondaryPlayerId: score.secondaryPlayerId,
//             // };
//             // newScoreBoard.balling[ballIndex].wickets += 1;
//         } else if (score.status == "retired_hurt") {
//             // Determine which batsman is retiring hurt
//             const isBatsman1Retired = score.outId.equals(score.batsman1Id);
//             const isBatsman2Retired = score.outId.equals(score.batsman2Id);

//             // Update the scoreboard for the retired batsman
//             if (isBatsman1Retired) {
//                 newScoreBoard.batting[batIndex].isOut = false; // Mark as out
//                 newScoreBoard.batting[batIndex].outBy = {
//                     status: "retired_hurt",
//                     ballerId: score.ballerId,
//                 };
//             } else if (isBatsman2Retired) {
//                 newScoreBoard.batting[bat2Index].isOut = false; // Mark as out
//                 newScoreBoard.batting[bat2Index].outBy = {
//                     status: "retired_hurt",
//                     ballerId: score.ballerId,
//                 };
//             }
//         } else if (score.status == "overthrow") {
//             if (req.body.overthrowBoundary == 4) {
//                 newScoreBoard.batting[batIndex].runs += score.run + 4;
//                 newScoreBoard.batting[batIndex].fours += 1;
//             } else if (req.body.overthrowBoundary == 6) {
//                 newScoreBoard.batting[batIndex].runs += score.run + 6;
//                 newScoreBoard.batting[batIndex].sixes += 1;
//             } else {
//                 newScoreBoard.batting[batIndex].runs += score.run;
//             }
//             newScoreBoard.batting[batIndex].runs +=
//                 score.run + req.body.overthrowBoundary;
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//         } else {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "Status is invalid" });
//         }

//         const ballsInCurrentOver = newScoreBoard.balling[ballIndex].balls % 6;

//         // Check if the over is complete
//         if (ballsInCurrentOver === 0) {
//             const oversCompleted = newScoreBoard.balling[ballIndex].balls / 6;

//             // Calculate runs in the current over
//             const runsInCurrentOver = oversCompleted > 1
//                 ? newScoreBoard.balling[ballIndex].runs - newScoreBoard.balling[ballIndex].previousRuns
//                 : newScoreBoard.balling[ballIndex].runs;

//             // Update the previousRuns to track runs till the end of this over
//             newScoreBoard.balling[ballIndex].previousRuns = newScoreBoard.balling[ballIndex].runs;

//             // Increment maidenOvers if no runs were conceded in this over
//             if (runsInCurrentOver === 0) {
//                 newScoreBoard.balling[ballIndex].maidenOvers =
//                     (newScoreBoard.balling[ballIndex].maidenOvers || 0) + 1;
//             }
//         }

//         newScoreBoard.balling[ballIndex].overs = Math.floor(
//             newScoreBoard.balling[ballIndex].balls / 6
//         ) + "." + (newScoreBoard.balling[ballIndex].balls % 6);

//         newScoreBoard.batting[batIndex].balls =
//             newScoreBoard.batting[batIndex].balls || 0;
//         newScoreBoard.balling[ballIndex].balls =
//             newScoreBoard.balling[ballIndex].balls || 0;

//         newScoreBoard.batting[batIndex].strikeRate = parseFloat(
//             ((newScoreBoard.batting[batIndex].runs /
//                 newScoreBoard.batting[batIndex].balls) *
//                 100).toFixed(2)
//         );

//         const bowlerOvers =
//             Math.floor(newScoreBoard.balling[ballIndex].balls / 6) +
//             (newScoreBoard.balling[ballIndex].balls % 6) * 0.1;
//         newScoreBoard.balling[ballIndex].economy = parseFloat(
//             (newScoreBoard.balling[ballIndex].runs / bowlerOvers).toFixed(2)
//         );

//         scoreboard = await ScoreBoard.findOneAndUpdate(
//             { matchId: score.matchId, inning: score.inning },
//             { $set: newScoreBoard },
//             { new: true }
//         );

//         const { pointSystems, leagueId } = await getPointSystemsForMatch(
//             matchId
//         );

//         // console.log("final: ",pointSystems);

//         const batsmanPoints = await getPlayerPoints(batsman1Id, matchId, leagueId);
//         const ballerPoints = await getPlayerPoints(ballerId, matchId, leagueId);
//         const secondaryPlayerPoints = await getPlayerPoints(secondaryPlayerId, matchId, leagueId);

//         let updatedBatsmanPoints = batsmanPoints.points;
//         let updatedBallerPoints = ballerPoints.points;
//         let updatedSecondaryPlayerPoints = secondaryPlayerPoints.points;
//         // Batsman
//         if ((score.status == "run" || score.status == "four" || score.status == "six" || score.status == "overthrow") && score.run != 0) {
//             updatedBatsmanPoints = updateBatsmanPoints(batsmanPoints.points, score, pointSystems);
//             if (getPointsFromStatus(pointSystems, "thirty_run") != -1) {
//                 if ((newScoreBoard.batting[batIndex].runs > 30) && (newScoreBoard.batting[batIndex].runs - score.run < 30)) {
//                     updateBatsmanPoints += getPointsFromStatus(pointSystems, "thirty_run")
//                 }
//             }

//             if (getPointsFromStatus(pointSystems, "half_century") != -1) {
//                 if ((newScoreBoard.batting[batIndex].runs > 50) && (newScoreBoard.batting[batIndex].runs - score.run < 50)) {
//                     updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
//                 }
//             }

//             if (getPointsFromStatus(pointSystems, "century") != -1) {
//                 if ((newScoreBoard.batting[batIndex].runs > 100) && (newScoreBoard.batting[batIndex].runs - score.run < 100)) {
//                     updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
//                 }
//             }

//         } //Others
//         else if (score.status == "bowled" || score.status == "catch" || score.status == "lbw" || score.status == "stumping") {
//             // Baller
//             updatedBallerPoints = updateBallerPoints(ballerPoints.points, score, pointSystems);

//             if (getPointsFromStatus(pointSystems, "three_wicket") != -1) {
//                 if ((newScoreBoard.balling[ballIndex].wickets > 3) && (newScoreBoard.balling[ballIndex].wickets - 1 < 3)) {
//                     updatedBallerPoints += getPointsFromStatus(pointSystems, "three_wicket")
//                 }
//             }
//             if (getPointsFromStatus(pointSystems, "four_wicket") != -1) {
//                 if ((newScoreBoard.balling[ballIndex].wickets > 4) && (newScoreBoard.balling[ballIndex].wickets - 1 < 4)) {
//                     updatedBallerPoints += getPointsFromStatus(pointSystems, "four_wicket")
//                 }
//             }
//             if (getPointsFromStatus(pointSystems, "five_wicket") != -1) {
//                 if ((newScoreBoard.balling[ballIndex].wickets > 5) && (newScoreBoard.balling[ballIndex].wickets - 1 < 5)) {
//                     updatedBallerPoints += getPointsFromStatus(pointSystems, "five_wicket")
//                 }
//             }

//             // secondaryplayer
//             updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);

//             if (newScoreBoard.batting[batIndex].balls == 0) {
//                 updateBatsmanPoints += getPointsFromStatus(pointSystems, "duck");
//             }
//         }
//         else if (score.status == "nbout" || score.status == "runout") {
//             updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);
//         }

//         updatedBatsmanPoints = await updatePointsInDb(matchId, batsman1Id, updatedBatsmanPoints);
//         updatedBallerPoints = await updatePointsInDb(matchId, ballerId, updatedBallerPoints);
//         updatedSecondaryPlayerPoints = await updatePointsInDb(matchId, secondaryPlayerId, updatedSecondaryPlayerPoints);


//         io.emit("livescore", { matchScore, scoreboard });

//         return res.status(200).json({
//             success: true,
//             message: "Score added successfully",
//             data: { score, matchScore, scoreboard },
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message,
//         });
//     }
// };

exports.secoundSuperOverScore = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        // const match = await Match.findById(score.matchId);
        // if (!match.isStarted) {
        //     return res
        //         .status(400)
        //         .json({ success: false, message: "Match has not yet started" });
        // }

        const {
            matchId,
            inning,
            battingTeam,
            ballingTeam,
            batsman1Id,
            batsman2Id,
            ballerId,
            secondaryPlayerId,
            assistingPlayerId,
            currBall,
            run,
            status,
            runOutType
        } = req.body;



        const score = await ScoreCard.create({
            matchId,
            inning,
            battingTeam,
            ballingTeam,
            batsman1Id,
            batsman2Id,
            ballerId,
            secondaryPlayerId,
            assistingPlayerId,
            currBall,
            run,
            status,
            runOutType
        });

        if (req.body.outId.trim().length > 0) {
            score.outId = req.body.outId;
            await score.save();
        }


        // GET MatchScore by matchId given in score
        let matchScore = await SecoundSuperOver.findOne({ matchId: score.matchId, });

        console.log("matchScore::", matchScore)


        let newMatchScore = {
            team1: {
                teamId: matchScore.team1.teamId,
                runs: matchScore.team1.runs,
                wicket: matchScore.team1.wicket,
                overs: matchScore.team1.overs,
            },
            team2: {
                teamId: matchScore.team2.teamId,
                runs: matchScore.team2.runs,
                wicket: matchScore.team2.wicket,
                overs: matchScore.team2.overs,
            },
        };

        // Now we will check what team is batting whether team1 or team2
        if (score.battingTeam.equals(matchScore.team1.teamId)) {
            // if there is a run/four/six we will increment balls and runs of the batting team
            if (
                score.status == "run" ||
                score.status == "four" ||
                score.status == "six"
            ) {
                newMatchScore.team1.runs += score.run;
                newMatchScore.team1.overs = score.currBall;
            }
            // if there is a wicket we will increment the ball and wickets of that team
            else if (
                score.status == "wicket" ||
                score.status == "stumping" ||
                score.status == "catch" ||
                score.status == "lbw" ||
                score.status == "bowled"
            ) {
                newMatchScore.team1.wicket += 1;
                newMatchScore.team1.overs = score.currBall;
            }
            // if there is a run/four/six we will increment balls and runs of the batting teams and we will update wikets on runout
            else if (score.status == "runout") {
                newMatchScore.team1.runs += score.run;
                newMatchScore.team1.wicket += 1;
                newMatchScore.team1.overs = score.currBall;
            } else if (score.status == "nbout") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
                // newMatchScore.team1.overs = score.currBall;
            } else if (score.status == "nb" || score.status == "wide") {
                newMatchScore.team1.runs += score.run + 1
            } else if (score.status == "lb" || score.status == "byes") {
                newMatchScore.team1.runs += score.run
                newMatchScore.team1.overs = score.currBall;
            } else if (score.status == "penalty") {
                newMatchScore.team1.runs += score.run
            } else if (score.status == "overthrow") {
                score.overthrowBoundary = req.body.overthrowBoundary;
                await score.save();
                newMatchScore.team1.runs +=
                    score.run + req.body.overthrowBoundary;
                newMatchScore.team1.overs = score.currBall;
            }
            else if (score.status == "retired_hurt") {
                console.log("player retired hurt")
            } else if (score.status == "wide_stumping_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            } else if (score.status == "wide_run_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            }
            else {
                return res
                    .status(400)
                    .json({ success: false, message: "Status is invalid" });
            }
        } else {
            if (
                score.status == "run" ||
                score.status == "four" ||
                score.status == "six"
            ) {
                newMatchScore.team2.runs += score.run;
                newMatchScore.team2.overs = score.currBall;

            } else if (
                score.status == "wicket" ||
                score.status == "stumping" ||
                score.status == "catch" ||
                score.status == "lbw" ||
                score.status == "bowled"
            ) {
                newMatchScore.team2.wicket += 1;
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "runout") {
                newMatchScore.team2.runs += score.run + 1;
                newMatchScore.team2.wicket += 1;
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "nbout") {
                newMatchScore.team2.runs += score.run + 1;
                newMatchScore.team2.wicket += 1;
                // newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "nb" || score.status == "wide") {
                newMatchScore.team2.runs += score.run + 1;
            } else if (score.status == "penalty") {
                newMatchScore.team2.runs += score.run
            } else if (score.status == "lb" || score.status == "byes") {
                newMatchScore.team2.runs += score.run
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "overthrow") {
                score.overthrowBoundary = req.body.overthrowBoundary;
                await score.save();
                newMatchScore.team2.runs +=
                    score.run + req.body.overthrowBoundary;
                newMatchScore.team2.overs = score.currBall;
            } else if (score.status == "retired_hurt") {
                console.log("player retired hurt")
            } else if (score.status == "wide_stumping_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            } else if (score.status == "wide_run_out") {
                newMatchScore.team1.runs += score.run + 1;
                newMatchScore.team1.wicket += 1;
            } else {
                return res
                    .status(400)
                    .json({ success: false, message: "Status is invalid" });
            }
        }

        matchScore = await SecoundSuperOver.findOneAndUpdate(
            { matchId: score.matchId },
            { $set: newMatchScore },
            { new: true }
        );

        let scoreboard = await ScoreBoard.findOne({
            matchId: score.matchId,
            inning: score.inning,
        });


        let newScoreBoard = {
            extras: scoreboard.extras,
            batting: scoreboard.batting,
            balling: scoreboard.balling,
        };

        // Check if the batsman already exists
        let batIndex = newScoreBoard.batting.findIndex((b) =>
            b.playerId.equals(score.batsman1Id)
        );
        let bat2Index = newScoreBoard.batting.findIndex((b) =>
            b.playerId.equals(score.batsman2Id)
        );
        if (batIndex === -1) {
            newScoreBoard.batting.push({
                playerId: score.batsman1Id,
                runs: 0,
                balls: 0,
                fours: 0,
                sixs: 0,
                strikeRate: 0,
                isOut: false,
            });
            batIndex = newScoreBoard.batting.length - 1;
        }
        if (bat2Index === -1) {
            newScoreBoard.batting.push({
                playerId: score.batsman2Id,
                runs: 0,
                balls: 0,
                fours: 0,
                sixs: 0,
                strikeRate: 0,
                isOut: false,
            });
            bat2Index = newScoreBoard.batting.length - 1;
        }

        // Check if the bowler already exists
        let ballIndex = newScoreBoard.balling.findIndex((b) =>
            b.playerId.equals(score.ballerId)
        );
        if (ballIndex === -1) {
            newScoreBoard.balling.push({
                playerId: score.ballerId,
                runs: 0,
                wickets: 0,
                overs: 0,
                balls: 0,
                economy: 0,
                maidenOvers: 0,
                previousRuns: 0
            });
            ballIndex = newScoreBoard.balling.length - 1;
        }
        if (score.status == "run") {
            newScoreBoard.batting[batIndex].runs += score.run;
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += score.run;
            newScoreBoard.balling[ballIndex].balls += 1;
        } else if (score.status == "four") {
            newScoreBoard.batting[batIndex].runs += 4;
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += 4; // Correct the value to 4
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].fours += 1;
        } else if (score.status == "six") {
            newScoreBoard.batting[batIndex].runs += 6;
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += 6; // Correct the value to 6
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].sixes += 1;
        } else if (
            score.status == "stumping" ||
            score.status == "catch" ||
            score.status == "lbw" ||
            score.status == "bowled"
        ) {
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.batting[batIndex].isOut = true;
            newScoreBoard.batting[batIndex].outBy = {
                status: score.status,
                ballerId: score.ballerId,
                secondaryPlayerId: score.secondaryPlayerId,
            };
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.balling[ballIndex].wickets += 1;
        } else if (score.status == "wide_stumping_out") {
            newScoreBoard.batting[batIndex].isOut = true;
            newScoreBoard.batting[batIndex].outBy = {
                status: score.status,
                ballerId: score.ballerId,
                secondaryPlayerId: score.secondaryPlayerId,
            };
            newScoreBoard.extras.wide += score.run + 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
            newScoreBoard.balling[ballIndex].wickets += 1;
        } else if (score.status === "runout") {
            // Increment balls faced by the batsman who is not out
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.batting[batIndex].runs += score.run;

            const isBatsman1Out = score.outId.equals(score.batsman1Id);
            const isBatsman2Out = score.outId.equals(score.batsman2Id);

            if (isBatsman1Out || isBatsman2Out) {
                const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

                newScoreBoard.batting[outBatsmanIndex].isOut = true;
                newScoreBoard.batting[outBatsmanIndex].outBy = {
                    status: score.status,
                    ballerId: score.ballerId,
                    secondaryPlayerId: score.secondaryPlayerId,
                    runOutType: score.runOutType // Set the runOutType
                };

                if (score.runOutType === 'not_direct') {
                    newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
                }
            }
            // Increment balls bowled
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
            // Increment wickets if needed
            // newScoreBoard.balling[ballIndex].wickets += 1; 
        } else if (score.status == "wide_run_out") {
            // newScoreBoard.batting[batIndex].balls += 1;
            // newScoreBoard.batting[batIndex].runs += score.run;

            const isBatsman1Out = score.outId.equals(score.batsman1Id);
            const isBatsman2Out = score.outId.equals(score.batsman2Id);

            if (isBatsman1Out || isBatsman2Out) {
                const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

                newScoreBoard.batting[outBatsmanIndex].isOut = true;
                newScoreBoard.batting[outBatsmanIndex].outBy = {
                    status: score.status,
                    ballerId: score.ballerId,
                    secondaryPlayerId: score.secondaryPlayerId,
                    runOutType: score.runOutType // Set the runOutType
                };

                if (score.runOutType === 'not_direct') {
                    newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
                }
            }
            // Increment balls bowled
            // newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.extras.wide += score.run + 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else if (score.status == "nb") {
            newScoreBoard.extras.nb += 1;
            if (score.run == 4) {
                newScoreBoard.batting[batIndex].runs += score.run;
                newScoreBoard.batting[batIndex].fours += 1;
            } else if (score.run == 6) {
                newScoreBoard.batting[batIndex].runs += score.run;
                newScoreBoard.batting[batIndex].sixes += 1;
            } else {
                newScoreBoard.batting[batIndex].runs += score.run;
            }
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else if (score.status == "wide") {
            // newScoreBoard.extras.wide += 1;
            // newScoreBoard.balling[ballIndex].runs += 1;
            newScoreBoard.extras.wide += 1;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else if (score.status == "lb") {
            newScoreBoard.extras.legByes += score.run;
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].balls += 1;
        } else if (score.status == "byes") {
            newScoreBoard.extras.byes += score.run;
            newScoreBoard.balling[ballIndex].balls += 1;
            newScoreBoard.batting[batIndex].balls += 1;
        } else if (score.status == "penalty") {
            newScoreBoard.extras.penalty += score.run;
        } else if (score.status == "nbout") {
            newScoreBoard.batting[batIndex].balls += 1;
            newScoreBoard.batting[batIndex].runs += score.run;
            newScoreBoard.batting[batIndex].isOut = true;
            newScoreBoard.extras.nb += 1;

            newScoreBoard.balling[ballIndex].runs += score.run + 1;

            const isBatsman1Out = score.outId.equals(score.batsman1Id);
            const isBatsman2Out = score.outId.equals(score.batsman2Id);

            if (isBatsman1Out || isBatsman2Out) {
                const outBatsmanIndex = isBatsman1Out ? batIndex : bat2Index; // Determine the index of the out batsman

                newScoreBoard.batting[outBatsmanIndex].isOut = true;
                newScoreBoard.batting[outBatsmanIndex].outBy = {
                    status: score.status,
                    ballerId: score.ballerId,
                    secondaryPlayerId: score.secondaryPlayerId,
                    runOutType: score.runOutType // Set the runOutType
                };

                if (score.runOutType === 'not_direct') {
                    newScoreBoard.batting[outBatsmanIndex].outBy.assistingPlayerId = score.assistingPlayerId; // Set the assisting player's ID
                }
            }
            // newScoreBoard.batting[batIndex].outBy = {
            //     status: score.status,
            //     ballerId: score.ballerId,
            //     secondaryPlayerId: score.secondaryPlayerId,
            // };
            // newScoreBoard.balling[ballIndex].wickets += 1;
        } else if (score.status == "retired_hurt") {
            // Determine which batsman is retiring hurt
            const isBatsman1Retired = score.outId.equals(score.batsman1Id);
            const isBatsman2Retired = score.outId.equals(score.batsman2Id);

            // Update the scoreboard for the retired batsman
            if (isBatsman1Retired) {
                newScoreBoard.batting[batIndex].isOut = false; // Mark as out
                newScoreBoard.batting[batIndex].outBy = {
                    status: "retired_hurt",
                    ballerId: score.ballerId,
                };
            } else if (isBatsman2Retired) {
                newScoreBoard.batting[bat2Index].isOut = false; // Mark as out
                newScoreBoard.batting[bat2Index].outBy = {
                    status: "retired_hurt",
                    ballerId: score.ballerId,
                };
            }
        } else if (score.status == "overthrow") {
            if (req.body.overthrowBoundary == 4) {
                newScoreBoard.batting[batIndex].runs += score.run + 4;
                newScoreBoard.batting[batIndex].fours += 1;
            } else if (req.body.overthrowBoundary == 6) {
                newScoreBoard.batting[batIndex].runs += score.run + 6;
                newScoreBoard.batting[batIndex].sixes += 1;
            } else {
                newScoreBoard.batting[batIndex].runs += score.run;
            }
            newScoreBoard.batting[batIndex].runs +=
                score.run + req.body.overthrowBoundary;
            newScoreBoard.balling[ballIndex].runs += score.run + 1;
        } else {
            return res
                .status(400)
                .json({ success: false, message: "Status is invalid" });
        }

        const ballsInCurrentOver = newScoreBoard.balling[ballIndex].balls % 6;

        // Check if the over is complete
        if (ballsInCurrentOver === 0) {
            const oversCompleted = newScoreBoard.balling[ballIndex].balls / 6;

            // Calculate runs in the current over
            const runsInCurrentOver = oversCompleted > 1
                ? newScoreBoard.balling[ballIndex].runs - newScoreBoard.balling[ballIndex].previousRuns
                : newScoreBoard.balling[ballIndex].runs;

            // Update the previousRuns to track runs till the end of this over
            newScoreBoard.balling[ballIndex].previousRuns = newScoreBoard.balling[ballIndex].runs;

            // Increment maidenOvers if no runs were conceded in this over
            if (runsInCurrentOver === 0) {
                newScoreBoard.balling[ballIndex].maidenOvers =
                    (newScoreBoard.balling[ballIndex].maidenOvers || 0) + 1;
            }
        }

        newScoreBoard.balling[ballIndex].overs = Math.floor(
            newScoreBoard.balling[ballIndex].balls / 6
        ) + "." + (newScoreBoard.balling[ballIndex].balls % 6);

        newScoreBoard.batting[batIndex].balls =
            newScoreBoard.batting[batIndex].balls || 0;
        newScoreBoard.balling[ballIndex].balls =
            newScoreBoard.balling[ballIndex].balls || 0;

        newScoreBoard.batting[batIndex].strikeRate = parseFloat(
            ((newScoreBoard.batting[batIndex].runs /
                newScoreBoard.batting[batIndex].balls) *
                100).toFixed(2)
        );

        const bowlerOvers =
            Math.floor(newScoreBoard.balling[ballIndex].balls / 6) +
            (newScoreBoard.balling[ballIndex].balls % 6) * 0.1;
        newScoreBoard.balling[ballIndex].economy = parseFloat(
            (newScoreBoard.balling[ballIndex].runs / bowlerOvers).toFixed(2)
        );

        scoreboard = await ScoreBoard.findOneAndUpdate(
            { matchId: score.matchId, inning: score.inning },
            { $set: newScoreBoard },
            { new: true }
        );

        const { pointSystems, leagueId } = await getPointSystemsForMatch(
            matchId
        );

        // console.log("final: ",pointSystems);

        const batsmanPoints = await getPlayerPoints(batsman1Id, matchId, leagueId);
        const ballerPoints = await getPlayerPoints(ballerId, matchId, leagueId);
        const secondaryPlayerPoints = await getPlayerPoints(secondaryPlayerId, matchId, leagueId);

        let updatedBatsmanPoints = batsmanPoints.points;
        let updatedBallerPoints = ballerPoints.points;
        let updatedSecondaryPlayerPoints = secondaryPlayerPoints.points;
        // Batsman
        if ((score.status == "run" || score.status == "four" || score.status == "six" || score.status == "overthrow") && score.run != 0) {
            updatedBatsmanPoints = updateBatsmanPoints(batsmanPoints.points, score, pointSystems);
            if (getPointsFromStatus(pointSystems, "thirty_run") != -1) {
                if ((newScoreBoard.batting[batIndex].runs > 30) && (newScoreBoard.batting[batIndex].runs - score.run < 30)) {
                    updateBatsmanPoints += getPointsFromStatus(pointSystems, "thirty_run")
                }
            }

            if (getPointsFromStatus(pointSystems, "half_century") != -1) {
                if ((newScoreBoard.batting[batIndex].runs > 50) && (newScoreBoard.batting[batIndex].runs - score.run < 50)) {
                    updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
                }
            }

            if (getPointsFromStatus(pointSystems, "century") != -1) {
                if ((newScoreBoard.batting[batIndex].runs > 100) && (newScoreBoard.batting[batIndex].runs - score.run < 100)) {
                    updateBatsmanPoints += getPointsFromStatus(pointSystems, "half_century")
                }
            }

        } //Others
        else if (score.status == "bowled" || score.status == "catch" || score.status == "lbw" || score.status == "stumping") {
            // Baller
            updatedBallerPoints = updateBallerPoints(ballerPoints.points, score, pointSystems);

            if (getPointsFromStatus(pointSystems, "three_wicket") != -1) {
                if ((newScoreBoard.balling[ballIndex].wickets > 3) && (newScoreBoard.balling[ballIndex].wickets - 1 < 3)) {
                    updatedBallerPoints += getPointsFromStatus(pointSystems, "three_wicket")
                }
            }
            if (getPointsFromStatus(pointSystems, "four_wicket") != -1) {
                if ((newScoreBoard.balling[ballIndex].wickets > 4) && (newScoreBoard.balling[ballIndex].wickets - 1 < 4)) {
                    updatedBallerPoints += getPointsFromStatus(pointSystems, "four_wicket")
                }
            }
            if (getPointsFromStatus(pointSystems, "five_wicket") != -1) {
                if ((newScoreBoard.balling[ballIndex].wickets > 5) && (newScoreBoard.balling[ballIndex].wickets - 1 < 5)) {
                    updatedBallerPoints += getPointsFromStatus(pointSystems, "five_wicket")
                }
            }

            // secondaryplayer
            updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);

            if (newScoreBoard.batting[batIndex].balls == 0) {
                updateBatsmanPoints += getPointsFromStatus(pointSystems, "duck");
            }
        }
        else if (score.status == "nbout" || score.status == "runout") {
            updatedSecondaryPlayerPoints = updateSecondaryPlayerPoints(secondaryPlayerPoints.points, score, pointSystems);
        }

        updatedBatsmanPoints = await updatePointsInDb(matchId, batsman1Id, updatedBatsmanPoints);
        updatedBallerPoints = await updatePointsInDb(matchId, ballerId, updatedBallerPoints);
        updatedSecondaryPlayerPoints = await updatePointsInDb(matchId, secondaryPlayerId, updatedSecondaryPlayerPoints);


        io.emit("livescore", { matchScore, scoreboard });

        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: { score, matchScore, scoreboard },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.displayLastScore = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const matchId = req.params.id;
        const inning = req.query.inning;
        const lastScore = await ScoreCard.findOne({
            matchId: matchId,
            inning: inning,
        }).sort({
            createdAt: -1,
        });
        return res.status(200).json({
            success: true,
            message: "Last Score fetched successfully",
            data: lastScore,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.displayScoresByMatch = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const matchId = req.params.id;

        const scoreList = await ScoreCard.find({ matchId: matchId });
        return res.status(200).json({
            success: true,
            message: "Scorecard fetched successfully",
            data: scoreList,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.updateScoreById = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        const newScore = req.body;
        const scoreId = req.params.id;
        const score = await ScoreCard.findByIdAndUpdate(
            scoreId,
            { $set: newScore },
            { new: true }
        );
        return res.status(200).json({
            success: true,
            message: "Scorecard fetched successfully",
            data: score,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// const updateScore = async (req, res) => {
//     try {
//         let adminId = req.user;

//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Admin not found",
//             });
//         }

//         const {
//             scoreId,
//             matchId,
//             inning,
//             battingTeam,
//             batsman1Id,
//             batsman2Id,
//             ballerId,
//             secondaryPlayerId,
//             currBall,
//             run,
//             status,
//             outId,
//             overthrowBoundary,
//         } = req.body;

//         // Fetch existing score
//         let score = await ScoreCard.findById(scoreId);
//         if (!score) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Score not found",
//             });
//         }

//         // Update score details
//         score.matchId = matchId || score.matchId;
//         score.inning = inning || score.inning;
//         score.battingTeam = battingTeam || score.battingTeam;
//         score.batsman1Id = batsman1Id || score.batsman1Id;
//         score.batsman2Id = batsman2Id || score.batsman2Id;
//         score.ballerId = ballerId || score.ballerId;
//         score.secondaryPlayerId = secondaryPlayerId || score.secondaryPlayerId;
//         score.currBall = currBall || score.currBall;
//         score.run = run || score.run;
//         score.status = status || score.status;
//         score.outId = outId || score.outId;
//         score.overthrowBoundary = overthrowBoundary || score.overthrowBoundary;

//         await score.save();

//         // Update MatchScore and ScoreBoard
//         let matchScore = await MatchScore.findOne({ matchId: score.matchId });
//         let newMatchScore = {
//             team1: {
//                 teamId: matchScore.team1.teamId,
//                 runs: matchScore.team1.runs,
//                 wicket: matchScore.team1.wicket,
//                 overs: matchScore.team1.overs,
//             },
//             team2: {
//                 teamId: matchScore.team2.teamId,
//                 runs: matchScore.team2.runs,
//                 wicket: matchScore.team2.wicket,
//                 overs: matchScore.team2.overs,
//             },
//         };

//         // Update match score based on batting team
//         if (score.battingTeam.equals(matchScore.team1.teamId)) {
//             if (score.status == "run" || score.status == "four" || score.status == "six") {
//                 newMatchScore.team1.runs += score.run;
//                 newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "wicket" || score.status == "stumping" || score.status == "catch" ||
//                        score.status == "lbw" || score.status == "bowled") {
//                 newMatchScore.team1.wicket += 1;
//                 newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "runout" || score.status == "nbout") {
//                 newMatchScore.team1.runs += score.run;
//                 newMatchScore.team1.wicket += 1;
//                 newMatchScore.team1.overs = score.currBall;
//             } else if (score.status == "nb" || score.status == "wide") {
//                 newMatchScore.team1.runs += score.run + 1;
//             } else if (score.status == "overthrow") {
//                 newMatchScore.team1.runs += score.run + score.overthrowBoundary;
//                 newMatchScore.team1.overs = score.currBall;
//             } else {
//                 return res.status(400).json({ success: false, message: "Status is invalid" });
//             }
//         } else {
//             if (score.status == "run" || score.status == "four" || score.status == "six") {
//                 newMatchScore.team2.runs += score.run;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "wicket" || score.status == "stumping" || score.status == "catch" ||
//                        score.status == "lbw" || score.status == "bowled") {
//                 newMatchScore.team2.wicket += 1;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "runout" || score.status == "nbout") {
//                 newMatchScore.team2.runs += score.run + 1;
//                 newMatchScore.team2.wicket += 1;
//                 newMatchScore.team2.overs = score.currBall;
//             } else if (score.status == "nb" || score.status == "wide") {
//                 newMatchScore.team2.runs += score.run + 1;
//             } else if (score.status == "overthrow") {
//                 newMatchScore.team2.runs += score.run + score.overthrowBoundary;
//                 newMatchScore.team2.overs = score.currBall;
//             } else {
//                 return res.status(400).json({ success: false, message: "Status is invalid" });
//             }
//         }

//         matchScore = await MatchScore.findOneAndUpdate(
//             { matchId: score.matchId },
//             { $set: newMatchScore },
//             { new: true }
//         );

//         let scoreboard = await ScoreBoard.findOne({ matchId: score.matchId, inning: score.inning });
//         let newScoreBoard = {
//             extras: scoreboard.extras,
//             batting: scoreboard.batting,
//             balling: scoreboard.balling,
//         };

//         // Update batsman and bowler details
//         let batIndex = newScoreBoard.batting.findIndex((b) => b.playerId.equals(score.batsman1Id));
//         let bat2Index = newScoreBoard.batting.findIndex((b) => b.playerId.equals(score.batsman2Id));
//         if (batIndex === -1) {
//             newScoreBoard.batting.push({
//                 playerId: score.batsman1Id,
//                 runs: 0,
//                 balls: 0,
//                 fours: 0,
//                 sixs: 0,
//                 isOut: false,
//             });
//             batIndex = newScoreBoard.batting.length - 1;
//         }
//         if (bat2Index === -1) {
//             newScoreBoard.batting.push({
//                 playerId: score.batsman2Id,
//                 runs: 0,
//                 balls: 0,
//                 fours: 0,
//                 sixs: 0,
//                 isOut: false,
//             });
//             bat2Index = newScoreBoard.batting.length - 1;
//         }

//         let ballIndex = newScoreBoard.balling.findIndex((b) => b.playerId.equals(score.ballerId));
//         if (ballIndex === -1) {
//             newScoreBoard.balling.push({
//                 playerId: score.ballerId,
//                 runs: 0,
//                 wickets: 0,
//                 overs: 0,
//                 balls: 0,
//             });
//             ballIndex = newScoreBoard.balling.length - 1;
//         }

//         // Update scoreboard based on score status
//         if (score.status == "run") {
//             newScoreBoard.batting[batIndex].runs += score.run;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += score.run;
//             newScoreBoard.balling[ballIndex].balls += 1;
//         } else if (score.status == "four") {
//             newScoreBoard.batting[batIndex].runs += 4;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += 4;
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].fours += 1;
//         } else if (score.status == "six") {
//             newScoreBoard.batting[batIndex].runs += 6;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += 6;
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.batting[batIndex].sixes += 1;
//         } else if (score.status == "stumping" || score.status == "catch" || score.status == "lbw" || score.status == "bowled") {
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].isOut = true;
//             newScoreBoard.batting[batIndex].outBy = {
//                 status: score.status,
//                 ballerId: score.ballerId,
//                 secondaryPlayerId: score.secondaryPlayerId,
//             };
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].wickets += 1;
//         } else if (score.status == "runout") {
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.batting[batIndex].runs += score.run;
//             if (score.outId.equals(score.batsman1Id)) {
//                 newScoreBoard.batting[batIndex].isOut = true;
//                 newScoreBoard.batting[batIndex].outBy = {
//                     status: score.status,
//                     ballerId: score.ballerId,
//                     secondaryPlayerId: score.secondaryPlayerId,
//                 };
//             } else {
//                 newScoreBoard.batting[bat2Index].isOut = true;
//                 newScoreBoard.batting[bat2Index].outBy = {
//                     status: score.status,
//                     ballerId: score.ballerId,
//                     secondaryPlayerId: score.secondaryPlayerId,
//                 };
//             }
//             newScoreBoard.balling[ballIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += score.run;
//         } else if (score.status == "nb" || score.status == "wide") {
//             newScoreBoard.balling[ballIndex].runs += score.run + 1;
//             newScoreBoard.extras += score.run + 1;
//         } else if (score.status == "overthrow") {
//             newScoreBoard.batting[batIndex].runs += score.run + score.overthrowBoundary;
//             newScoreBoard.batting[batIndex].balls += 1;
//             newScoreBoard.balling[ballIndex].runs += score.run + score.overthrowBoundary;
//             newScoreBoard.balling[ballIndex].balls += 1;
//         } else {
//             return res.status(400).json({ success: false, message: "Status is invalid" });
//         }

//         scoreboard = await ScoreBoard.findOneAndUpdate(
//             { matchId: score.matchId, inning: score.inning },
//             { $set: newScoreBoard },
//             { new: true }
//         );

//         // Emit live score update
//         global.io.to(score.matchId.toString()).emit("updateLiveMatchScore", matchScore);
//         global.io.to(score.matchId.toString()).emit("updateLiveScoreBoard", scoreboard);

//         return res.status(200).json({
//             success: true,
//             message: "Score updated successfully",
//             score,
//             matchScore,
//             scoreboard,
//         });

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error",
//         });
//     }
// };


exports.test = async (req, res) => {
    const matchId = req.params.id;
    const pointSystems = await getPointSystemsForMatch(matchId);
    console.log(pointSystems);
    res.json(pointSystems);
};
