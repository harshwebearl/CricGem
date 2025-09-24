const mongoose = require("mongoose");
const Team = require("../models/team");
const Admin = require("../models/admin");
const BASE_URL = 'https://cricgem-harsh.onrender.com/teamPhoto/'
const BASE_URL_PLAYER = 'https://cricgem-harsh.onrender.com/playerPhoto/'
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const League = require("../models/league");
const unlinkAsync = promisify(fs.unlink);

exports.createTeam = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        const logo = req.files['logo'][0].filename;
        const other_photo = req.files['other_photo'][0].filename;

        let { team_name, short_name, color_code, league_id } = req.body
        let teamData = new Team({
            team_name,
            logo: logo,
            league_id,
            other_photo: other_photo,
            short_name,
            color_code
        });
        let result = await teamData.save();
        res.status(200).json({
            success: true,
            message: "Team Created Successfully",
            data: result
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}



exports.displayList = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        let teamData = await Team.find();

        if (teamData && teamData.length > 0) {
            // Fetch league details and add league name to team data
            teamData = await Promise.all(teamData.map(async (team) => {
                // Fetch the league data for the current team
                const league = await League.findById(team.league_id);
                return {
                    ...team._doc,  // Spread the original team document properties
                    logo: `${BASE_URL}${team.logo}`,  // Assuming the field for the logo is 'logo'
                    other_photo: `${BASE_URL}${team.other_photo}`,  // Assuming the field for the photo is 'photo'
                    league_name: league ? league.league_name : "League Not Found" // Add league name if found
                };
            }));
        }


        if (teamData) {
            res.status(200).json({
                success: true,
                message: "Team Find Successfully",
                data: teamData
            })
        } else {
            res.status(200).json({
                success: true,
                message: "Team Not Found!"
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}


// exports.displayListByLeagueId = async (req, res) => {
//     try {
//         let adminId = req.user;

//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }
//         let league_id = req.params.id;
//         let teamData = await Team.find({ league_id });

//         if (teamData) {
//             // Modify teamData to include BASE_URL in the logo and other_photo fields
//             teamData = {
//                 ...teamData._doc,  // Spread the original team document properties
//                 logo: `${BASE_URL}/${teamData.logo}`,  // Add BASE_URL to logo
//                 other_photo: `${BASE_URL}/${teamData.other_photo}` // Add BASE_URL to other_photo
//             };
//         }

//         if (teamData) {
//             res.status(200).json({
//                 success: true,
//                 message: "Team Find Successfully",
//                 data: teamData
//             })
//         } else {
//             res.status(200).json({
//                 success: true,
//                 message: "Team Not Found!"
//             })
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message
//         });
//     }
// }



exports.displayListByLeagueId = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let league_id = req.params.id;
        let teamData = await Team.find({ league_id });

        if (teamData.length > 0) {
            // const baseURL = "https://your-base-url.com/images/";
            teamData = teamData.map(team => {
                return {
                    ...team._doc,
                    logo: BASE_URL + team.logo,
                    other_photo: BASE_URL + team.other_photo
                };
            });

            res.status(200).json({
                success: true,
                message: "Team Find Successfully",
                data: teamData
            });
        } else {
            res.status(200).json({
                success: true,
                message: "Team Not Found!"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}




// exports.displayDetails = async (req, res) => {
//     try {
//         let adminId = req.user;

//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }

//         let { teamId } = req.query;

//         // Get team data and aggregate with additional details
//         let teamData = await Team.aggregate([
//             {
//                 $match: {
//                     _id: new mongoose.Types.ObjectId(teamId)
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "leagues",
//                     localField: "league_id",
//                     foreignField: "_id",
//                     as: "league_details"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "players",
//                     localField: "captain",
//                     foreignField: "_id",
//                     as: "captain_details"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "players",
//                     localField: "vice_captain",
//                     foreignField: "_id",
//                     as: "vice_captain_details"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "teamplayers",
//                     localField: "_id",
//                     foreignField: "team_id",
//                     as: "teamplayer",
//                     pipeline: [
//                         {
//                             $lookup: {
//                                 from: "players",
//                                 localField: "player_id",
//                                 foreignField: "_id",
//                                 as: "player_details",
//                                 pipeline: [
//                                     {
//                                         $project: {
//                                             _id: 1,
//                                             player_name: 1,
//                                             player_photo: 1,
//                                             role: 1,
//                                             nationality: 1,
//                                             bat_type: 1,
//                                             bowl_type: 1
//                                         }
//                                     }
//                                 ]
//                             }
//                         },
//                     ]
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "matchscores",
//                     localField: "_id",
//                     foreignField: "team1.teamId",
//                     as: "match_scores",
//                     pipeline: [
//                         {
//                             $lookup: {
//                                 from: "teams",
//                                 localField: "team2.teamId",
//                                 foreignField: "_id",
//                                 as: "team2_details"
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: "teams",
//                                 localField: "team1.teamId",
//                                 foreignField: "_id",
//                                 as: "team1_details"
//                             }
//                         }
//                     ]
//                 }
//             }
//         ]);

//         // Add base URL to team photos
//         teamData[0].logo = `${BASE_URL}${teamData[0].logo}`;
//         teamData[0].other_photo = `${BASE_URL}${teamData[0].other_photo}`;

//         // Add base URL to captain details photos
//         if (teamData[0].captain_details) {
//             for (let captain of teamData[0].captain_details) {
//                 captain.player_photo = `${BASE_URL_PLAYER}${captain.player_photo}`;
//             }
//         }

//         // Add base URL to vice-captain details photos
//         if (teamData[0].vice_captain_details) {
//             for (let viceCaptain of teamData[0].vice_captain_details) {
//                 viceCaptain.player_photo = `${BASE_URL_PLAYER}${viceCaptain.player_photo}`;
//             }
//         }

//         // Add base URL to player details photos
//         if (teamData[0].teamplayer.map(e => e.player_details)) {
//             for (let player of teamData[0].teamplayer.map(e => e.player_details)) {
//                 player[0].player_photo = `${BASE_URL_PLAYER}${player[0].player_photo}`;
//             }
//         }

//         // Structure the team score object
//         let teamScore = [];
//         if (teamData[0].match_scores.length > 0) {
//             teamData[0].match_scores.forEach(matchScore => {
//                 if (matchScore.team1_details.length > 0 && matchScore.team2_details.length > 0) {
//                     // For team1
//                     let team1 = {
//                         score: `${matchScore.team1.runs}/${matchScore.team1.wicket} (${matchScore.team1.overs})`,
//                         innings: 1,
//                         team_name: matchScore.team1_details[0].team_name
//                     };

//                     // For team2
//                     let team2 = {
//                         score: `${matchScore.team2.runs}/${matchScore.team2.wicket} (${matchScore.team2.overs})`,
//                         innings: 2,
//                         team_name: matchScore.team2_details[0].team_name
//                     };

//                     // Toss information
//                     let tossInfo = '';
//                     if (matchScore.toss && matchScore.toss.teamId) {
//                         let tossTeamName = '';
//                         // Determine which team won the toss
//                         if (matchScore.toss.teamId.toString() === matchScore.team1_details[0]._id.toString()) {
//                             tossTeamName = matchScore.team1_details[0].team_name;
//                         } else if (matchScore.toss.teamId.toString() === matchScore.team2_details[0]._id.toString()) {
//                             tossTeamName = matchScore.team2_details[0].team_name;
//                         }

//                         let tossChoice = matchScore.toss.choice; // Get the choice (bat/bowl)
//                         tossInfo = `${tossTeamName} win the toss and select to ${tossChoice.toLowerCase()}`;
//                     }

//                     let matchResult = '';
//                     if (matchScore.team1.runs > matchScore.team2.runs) {
//                         // Team1 won by runs
//                         let runDifference = matchScore.team1.runs - matchScore.team2.runs;
//                         matchResult = `${team1.team_name} won by ${runDifference} runs`;
//                     } else if (matchScore.team2.runs > matchScore.team1.runs) {
//                         // Team2 won by wickets
//                         let wicketDifference = 10 - matchScore.team2.wicket;
//                         matchResult = `${team2.team_name} won by ${wicketDifference} wickets`;
//                     } else {
//                         // Match tied
//                         matchResult = 'Match tied';
//                     }

//                     // Add the match details to the teamScore array
//                     teamScore.push({
//                         tossInfo: tossInfo,
//                         matchResult: matchResult,
//                         team1: team1,
//                         team2: team2
//                     });
//                 }
//             });
//         }


//         // Response with the required team scores and details
//         if (teamData) {
//             res.status(200).json({
//                 success: true,
//                 message: "Team found successfully",
//                 data: {
//                     _id: teamData[0]._id,
//                     team_name: teamData[0].team_name,
//                     league_id: teamData[0].league_id,
//                     logo: teamData[0].logo,
//                     other_photo: teamData[0].other_photo,
//                     short_name: teamData[0].short_name,
//                     captain: teamData[0].captain,
//                     vice_captain: teamData[0].vice_captain,
//                     color_code: teamData[0].color_code,
//                     createdAt: teamData[0].createdAt,
//                     updatedAt: teamData[0].updatedAt,
//                     league_details: teamData[0].league_details.map(league => ({
//                         _id: league._id,
//                         league_name: league.league_name,
//                         matchType: league.matchType,
//                         start_date: league.start_date,
//                         end_date: league.end_date,
//                         createdAt: league.createdAt,
//                         updatedAt: league.updatedAt,
//                         __v: league.__v
//                     })),
//                     captain_details: teamData[0].captain_details.map(captain => ({
//                         _id: captain._id,
//                         player_name: captain.player_name,
//                         player_photo: captain.player_photo,
//                         age: captain.age,
//                         nationality: captain.nationality,
//                         birth_date: captain.birth_date,
//                         role: captain.role,
//                         bat_type: captain.bat_type,
//                         bowl_type: captain.bowl_type,
//                         createdAt: captain.createdAt,
//                         updatedAt: captain.updatedAt,
//                         __v: captain.__v
//                     })),
//                     vice_captain_details: teamData[0].vice_captain_details.map(viceCaptain => ({
//                         _id: viceCaptain._id,
//                         player_name: viceCaptain.player_name,
//                         player_photo: viceCaptain.player_photo,
//                         age: viceCaptain.age,
//                         nationality: viceCaptain.nationality,
//                         birth_date: viceCaptain.birth_date,
//                         role: viceCaptain.role,
//                         bat_type: viceCaptain.bat_type,
//                         bowl_type: viceCaptain.bowl_type,
//                         createdAt: viceCaptain.createdAt,
//                         updatedAt: viceCaptain.updatedAt,
//                         __v: viceCaptain.__v
//                     })),
//                     teamplayer: teamData[0].teamplayer.map(teamplayer => ({
//                         _id: teamplayer._id,
//                         team_id: teamplayer.team_id,
//                         player_id: teamplayer.player_id,
//                         c_or_vc: teamplayer.c_or_vc,
//                         status: teamplayer.status,
//                         createdAt: teamplayer.createdAt,
//                         updatedAt: teamplayer.updatedAt,
//                         __v: teamplayer.__v,
//                         player_details: teamplayer.player_details.map(player => ({
//                             _id: player._id,
//                             player_name: player.player_name,
//                             player_photo: player.player_photo,
//                             nationality: player.nationality,
//                             role: player.role,
//                             bat_type: player.bat_type,
//                             bowl_type: player.bowl_type
//                         }))
//                     })),
//                     teamScore: teamScore // Already structured above
//                 }
//             });
//         } else {
//             res.status(200).json({
//                 success: true,
//                 message: "Team not found!"
//             });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message
//         });
//     }
// };

exports.displayDetails = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let { teamId } = req.query;

        // Get team data and aggregate with additional details
        let teamData = await Team.aggregate([
            {
            $match: {
                _id: new mongoose.Types.ObjectId(teamId)
            }
            },
            {
            $lookup: {
                from: "leagues",
                localField: "league_id",
                foreignField: "_id",
                as: "league_details"
            }
            },
            {
            $lookup: {
                from: "players",
                localField: "captain",
                foreignField: "_id",
                as: "captain_details"
            }
            },
            {
            $lookup: {
                from: "players",
                localField: "vice_captain",
                foreignField: "_id",
                as: "vice_captain_details"
            }
            },
            {
            $lookup: {
                from: "teamplayers",
                localField: "_id",
                foreignField: "team_id",
                as: "teamplayer",
                pipeline: [
                {
                    $lookup: {
                    from: "players",
                    localField: "player_id",
                    foreignField: "_id",
                    as: "player_details",
                    pipeline: [
                        {
                        $project: {
                            _id: 1,
                            player_name: 1,
                            player_photo: 1,
                            role: 1,
                            nationality: 1,
                            bat_type: 1,
                            bowl_type: 1
                        }
                        }
                    ]
                    }
                },
                ]
            }
            },
            {
            $lookup: {
                from: "matchscores",
                let: { teamId: "$_id" },
                pipeline: [
                {
                    $match: {
                    $expr: {
                        $or: [
                        { $eq: ["$team1.teamId", "$$teamId"] },
                        { $eq: ["$team2.teamId", "$$teamId"] }
                        ]
                    }
                    }
                },
                {
                    $lookup: {
                    from: "teams",
                    localField: "team2.teamId",
                    foreignField: "_id",
                    as: "team2_details"
                    }
                },
                {
                    $lookup: {
                    from: "teams",
                    localField: "team1.teamId",
                    foreignField: "_id",
                    as: "team1_details"
                    }
                }
                ],
                as: "match_scores"
            }
            }
        ]);

        // Add base URL to team photos
        teamData[0].logo = `${BASE_URL}${teamData[0].logo}`;
        teamData[0].other_photo = `${BASE_URL}${teamData[0].other_photo}`;

        // Add base URL to captain details photos
        if (teamData[0].captain_details) {
            for (let captain of teamData[0].captain_details) {
                captain.player_photo = `${BASE_URL_PLAYER}${captain.player_photo}`;
            }
        }

        // Add base URL to vice-captain details photos
        if (teamData[0].vice_captain_details) {
            for (let viceCaptain of teamData[0].vice_captain_details) {
                viceCaptain.player_photo = `${BASE_URL_PLAYER}${viceCaptain.player_photo}`;
            }
        }

        // Add base URL to player details photos
        if (teamData[0].teamplayer.map(e => e.player_details)) {
            for (let player of teamData[0].teamplayer.map(e => e.player_details)) {
                player[0].player_photo = `${BASE_URL_PLAYER}${player[0].player_photo}`;
            }
        }

        // Structure the team score object
        let teamScore = [];
        if (teamData[0].match_scores.length > 0) {
            teamData[0].match_scores.forEach(matchScore => {
                if (matchScore.team1_details.length > 0 && matchScore.team2_details.length > 0) {
                    // For team1
                    let team1 = {
                        score: `${matchScore.team1.runs}/${matchScore.team1.wicket} (${matchScore.team1.overs})`,
                        innings: 1,
                        team_name: matchScore.team1_details[0].team_name
                    };

                    // For team2
                    let team2 = {
                        score: `${matchScore.team2.runs}/${matchScore.team2.wicket} (${matchScore.team2.overs})`,
                        innings: 2,
                        team_name: matchScore.team2_details[0].team_name
                    };

                    // Toss information
                    let tossInfo = '';
                    if (matchScore.toss && matchScore.toss.teamId) {
                        let tossTeamName = '';
                        // Determine which team won the toss
                        if (matchScore.toss.teamId.toString() === matchScore.team1_details[0]._id.toString()) {
                            tossTeamName = matchScore.team1_details[0].team_name;
                        } else if (matchScore.toss.teamId.toString() === matchScore.team2_details[0]._id.toString()) {
                            tossTeamName = matchScore.team2_details[0].team_name;
                        }

                        let tossChoice = matchScore.toss.choice; // Get the choice (bat/bowl)
                        tossInfo = `${tossTeamName} win the toss and select to ${tossChoice.toLowerCase()}`;
                    }

                    let matchResult = '';
                    if (matchScore.team1.runs > matchScore.team2.runs) {
                        // Team1 won by runs
                        let runDifference = matchScore.team1.runs - matchScore.team2.runs;
                        matchResult = `${team1.team_name} won by ${runDifference} runs`;
                    } else if (matchScore.team2.runs > matchScore.team1.runs) {
                        // Team2 won by wickets
                        let wicketDifference = 10 - matchScore.team2.wicket;
                        matchResult = `${team2.team_name} won by ${wicketDifference} wickets`;
                    } else {
                        // Match tied
                        matchResult = 'Match tied';
                    }

                    // Add the match details to the teamScore array
                    teamScore.push({
                        tossInfo: tossInfo,
                        matchResult: matchResult,
                        team1: team1,
                        team2: team2
                    });
                }
            });
        }


        // Response with the required team scores and details
        if (teamData) {
            res.status(200).json({
                success: true,
                message: "Team found successfully",
                data: {
                    _id: teamData[0]._id,
                    team_name: teamData[0].team_name,
                    league_id: teamData[0].league_id,
                    logo: teamData[0].logo,
                    other_photo: teamData[0].other_photo,
                    short_name: teamData[0].short_name,
                    captain: teamData[0].captain,
                    vice_captain: teamData[0].vice_captain,
                    color_code: teamData[0].color_code,
                    createdAt: teamData[0].createdAt,
                    updatedAt: teamData[0].updatedAt,
                    league_details: teamData[0].league_details.map(league => ({
                        _id: league._id,
                        league_name: league.league_name,
                        matchType: league.matchType,
                        start_date: league.start_date,
                        end_date: league.end_date,
                        createdAt: league.createdAt,
                        updatedAt: league.updatedAt,
                        __v: league.__v
                    })),
                    captain_details: teamData[0].captain_details.map(captain => ({
                        _id: captain._id,
                        player_name: captain.player_name,
                        player_photo: captain.player_photo,
                        age: captain.age,
                        nationality: captain.nationality,
                        birth_date: captain.birth_date,
                        role: captain.role,
                        bat_type: captain.bat_type,
                        bowl_type: captain.bowl_type,
                        createdAt: captain.createdAt,
                        updatedAt: captain.updatedAt,
                        __v: captain.__v
                    })),
                    vice_captain_details: teamData[0].vice_captain_details.map(viceCaptain => ({
                        _id: viceCaptain._id,
                        player_name: viceCaptain.player_name,
                        player_photo: viceCaptain.player_photo,
                        age: viceCaptain.age,
                        nationality: viceCaptain.nationality,
                        birth_date: viceCaptain.birth_date,
                        role: viceCaptain.role,
                        bat_type: viceCaptain.bat_type,
                        bowl_type: viceCaptain.bowl_type,
                        createdAt: viceCaptain.createdAt,
                        updatedAt: viceCaptain.updatedAt,
                        __v: viceCaptain.__v
                    })),
                    teamplayer: teamData[0].teamplayer.map(teamplayer => ({
                        _id: teamplayer._id,
                        team_id: teamplayer.team_id,
                        player_id: teamplayer.player_id,
                        c_or_vc: teamplayer.c_or_vc,
                        status: teamplayer.status,
                        createdAt: teamplayer.createdAt,
                        updatedAt: teamplayer.updatedAt,
                        __v: teamplayer.__v,
                        player_details: teamplayer.player_details.map(player => ({
                            _id: player._id,
                            player_name: player.player_name,
                            player_photo: player.player_photo,
                            nationality: player.nationality,
                            role: player.role,
                            bat_type: player.bat_type,
                            bowl_type: player.bowl_type
                        }))
                    })),
                    teamScore: teamScore // Already structured above
                }
            });
        } else {
            res.status(200).json({
                success: true,
                message: "Team not found!"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// exports.displayDetails = async (req, res) => {
//     try {
//         let adminId = req.user;

//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }
//         let { teamId } = req.query
//         // let teamData = await Team.findById(teamId)

//         let teamData = await Team.aggregate([
//             {
//                 $match: {
//                     _id: new mongoose.Types.ObjectId(teamId)
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "leagues",
//                     localField: "league_id",
//                     foreignField: "_id",
//                     as: "league_details"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "players",
//                     localField: "captain",
//                     foreignField: "_id",
//                     as: "captain_details"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "players",
//                     localField: "vice_captain",
//                     foreignField: "_id",
//                     as: "vice_captain_details"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "teamplayers",
//                     localField: "_id",
//                     foreignField: "team_id",
//                     as: "teamplayer",
//                     pipeline: [
//                         {
//                             $lookup: {
//                                 from: "players",
//                                 localField: "player_id",
//                                 foreignField: "_id",
//                                 as: "player_details",
//                                 pipeline: [
//                                     {
//                                         $project: {
//                                             _id: 1,
//                                             player_name: 1,
//                                             player_photo: 1,
//                                             role: 1,
//                                             nationality: 1,
//                                             bat_type: 1,
//                                             bowl_type: 1
//                                         }
//                                     }
//                                 ]
//                             }
//                         },
//                     ]
//                 }
//             }
//         ])


//         // Add base URL to team photos
//         teamData[0].logo = `${BASE_URL}${teamData[0].logo}`;
//         teamData[0].other_photo = `${BASE_URL}${teamData[0].other_photo}`;

//         // Add base URL to captain details photos
//         if (teamData[0].captain_details) {
//             for (let captain of teamData[0].captain_details) {
//                 captain.player_photo = `${BASE_URL_PLAYER}${captain.player_photo}`;
//             }
//         }

//         // Add base URL to vice-captain details photos
//         if (teamData[0].vice_captain_details) {
//             for (let viceCaptain of teamData[0].vice_captain_details) {
//                 viceCaptain.player_photo = `${BASE_URL_PLAYER}${viceCaptain.player_photo}`;
//             }
//         }

//         if (teamData[0].teamplayer.map(e => e.player_details)) {
//             for (let player of teamData[0].teamplayer.map(e => e.player_details)) {
//                 player[0].player_photo = `${BASE_URL_PLAYER}${player[0].player_photo}`;
//             }
//         }


//         if (teamData) {
//             res.status(200).json({
//                 success: true,
//                 message: "Team Find Successfully",
//                 data: teamData[0]
//             })
//         } else {
//             res.status(200).json({
//                 success: true,
//                 message: "Team Not Found!"
//             })
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message
//         });
//     }
// }


exports.editTeam = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let { teamId } = req.query;
        let { team_name, short_name, league_id, color_code } = req.body;
        let updateData = {
            team_name,
            short_name,
            league_id,
            color_code
        };

        // Check if a logo is being uploaded
        if (req.files && req.files.logo) {
            const logo = req.files.logo[0]; // Assuming 'logo' is the field name for the logo file
            updateData.logo = logo.filename;
        }

        // Check if an other_photo is being uploaded
        if (req.files && req.files.other_photo) {
            const otherPhoto = req.files.other_photo[0]; // Assuming 'other_photo' is the field name for the other photo file
            updateData.other_photo = otherPhoto.filename;
        }

        let teamUpdateData = await Team.findByIdAndUpdate(teamId, updateData, { new: true });

        res.status(200).json({
            success: true,
            message: "Team Data Updated Successfully",
            data: teamUpdateData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.editCaptainAndViceCaptain = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }


        let { teamId } = req.query;

        let updatedData = {
            captain: req.body.captain,
            vice_captain: req.body.vice_captain
        };

        if (req.body.captain === req.body.vice_captain) {
            return res.status(400).json({
                success: false,
                message: "Captain and vice-captain must be different players"
            })
        }

        let existsViceCaptainData = await Team.findOne({ vice_captain: req.body.captain });
        if (existsViceCaptainData) {
            return res.status(400).json({
                success: false,
                message: "Player is already a vice-captain"
            });
        }


        let existsCaptainData = await Team.findOne({ captain: req.body.vice_captain });
        if (existsCaptainData) {
            return res.status(400).json({
                success: false,
                message: "Player is already a captain"
            });
        }

        let existsOtherCaptainData = await Team.findOne({ captain: req.body.captain });
        if (existsOtherCaptainData) {
            return res.status(400).json({
                success: false,
                message: "Player is already a captain for another team"
            });
        }

        let existsOtherViceCaptainData = await Team.findOne({ vice_captain: req.body.vice_captain });
        if (existsOtherViceCaptainData) {
            return res.status(400).json({
                success: false,
                message: "Player is already a vice-captain for another team"
            });
        }

        let updateCaptainAndViceCaptain = await Team.findByIdAndUpdate(teamId, { $set: updatedData }, { new: true });
        res.status(200).json({
            success: true,
            message: "Team Captain And Vicecaptain Updated Successfully",
            data: updateCaptainAndViceCaptain
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


