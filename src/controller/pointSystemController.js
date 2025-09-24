const Admin = require("../models/admin");
const PointSystem = require("../models/PointSystem");
const User = require("../models/user");

exports.createPointSystem = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const { matchType, pointType, pointFor, points } = req.body;

        const existingPointSystem = await PointSystem.findOne({ matchType, pointType, pointFor });
        if (existingPointSystem) {
            return res.status(400).json({
                success: false,
                message: "A point system with the same matchType, pointType, and pointFor already exists.",
            });
        }

        const pointSystem = await PointSystem.create({ matchType, pointFor, pointType, points });

        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: pointSystem,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

exports.updatePointSystem = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const { matchType, pointType, pointFor, points } = req.body;
        const newPointSystem = { matchType, pointType, pointFor, points }
        const id = req.params.id;

        const pointSystem = await PointSystem.findByIdAndUpdate(id, { $set: newPointSystem }, { new: true });

        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: pointSystem,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}
exports.deletePointSystem = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const id = req.params.id;

        const pointSystem = await PointSystem.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: pointSystem,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}
exports.getAllPointSystemByPointTypeAndMatchType = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const { matchType, pointType } = req.query;
        const pointSystem = await PointSystem.find({ matchType: matchType, pointType: pointType });

        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: pointSystem,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}
exports.getAllPointSystem = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const pointSystem = await PointSystem.find();

        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: pointSystem,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

// exports.playerPoint = async (req, res) => {
//     try {

//         const pointSystem = await PointSystem.aggregate([
//             {
//                 $lookup: {
//                     from: 'match_types',
//                     localField: 'matchType',
//                     foreignField: '_id',
//                     as: 'match_type'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'point_fors',
//                     localField: 'pointFor',
//                     foreignField: '_id',
//                     as: 'point_for'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'point_types',
//                     localField: 'pointType',
//                     foreignField: '_id',
//                     as: 'point_type'
//                 }
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     matchType: 1,
//                     pointType: 1,
//                     pointFor: 1,
//                     points: 1,
//                     match_type_name: { $arrayElemAt: ["$match_type.name", 0] },
//                     point_for_name: { $arrayElemAt: ["$point_for.point_for_name", 0] },
//                     point_for_status: { $arrayElemAt: ["$point_for.status", 0] },
//                     point_type_name: { $arrayElemAt: ["$point_type.point_type_name", 0] },
//                 }
//             }
//         ]);

//         if (pointSystem.lenght === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Point Not Found!"
//             })
//         }

//         res.status(200).json({
//             success: true,
//             message: "display Point System",
//             data: pointSystem
//         })

//     } catch (error) {

//     }
// }

// exports.playerPoint = async (req, res) => {
//     try {
//         const pointSystem = await PointSystem.aggregate([
//             {
//                 $lookup: {
//                     from: 'match_types',
//                     localField: 'matchType',
//                     foreignField: '_id',
//                     as: 'match_type'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'point_fors',
//                     localField: 'pointFor',
//                     foreignField: '_id',
//                     as: 'point_for'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'point_types',
//                     localField: 'pointType',
//                     foreignField: '_id',
//                     as: 'point_type'
//                 }
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     pointType: 1,
//                     points: 1,
//                     match_type_name: { $arrayElemAt: ["$match_type.name", 0] },
//                     point_for_name: { $arrayElemAt: ["$point_for.point_for_name", 0] },
//                     point_for_status: { $arrayElemAt: ["$point_for.status", 0] },
//                     point_type_name: { $arrayElemAt: ["$point_type.point_type_name", 0] },
//                 }
//             }
//         ]);

//         // Structure the response
//         const groupedPoints = pointSystem.reduce((acc, item) => {
//             const type = item.point_type_name;

//             if (!acc[type]) {
//                 acc[type] = {
//                     point_type_name: type,
//                     point_for: []
//                 };
//             }

//             acc[type].point_for.push({
//                 point_for_name: item.point_for_name,
//                 point_for_status: item.point_for_status,
//                 points: item.points
//             });

//             return acc;
//         }, {});

//         const result = Object.values(groupedPoints);

//         if (result.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Point Not Found!"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Display Point System",
//             data: result
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error"
//         });
//     }
// };


exports.playerPoint = async (req, res) => {
    try {
        // Fetch the point system data
        const pointSystem = await PointSystem.aggregate([
            {
                $lookup: {
                    from: 'match_types',
                    localField: 'matchType',
                    foreignField: '_id',
                    as: 'match_type'
                }
            },
            {
                $lookup: {
                    from: 'point_fors',
                    localField: 'pointFor',
                    foreignField: '_id',
                    as: 'point_for'
                }
            },
            {
                $lookup: {
                    from: 'point_types',
                    localField: 'pointType',
                    foreignField: '_id',
                    as: 'point_type'
                }
            },
            {
                $project: {
                    _id: 0,
                    matchType: 1,
                    pointType: 1,
                    points: 1,
                    match_type_name: { $arrayElemAt: ["$match_type.name", 0] },
                    point_for_name: { $arrayElemAt: ["$point_for.point_for_name", 0] },
                    point_for_status: { $arrayElemAt: ["$point_for.status", 0] },
                    point_type_name: { $arrayElemAt: ["$point_type.point_type_name", 0] },
                }
            }
        ]);

        // Group points by match type and point type
        const groupedPoints = pointSystem.reduce((acc, item) => {
            const matchType = item.match_type_name;
            const type = item.point_type_name;

            // Initialize the structure for the match type if it doesn't exist
            if (!acc[matchType]) {
                acc[matchType] = {};
            }

            // Initialize the structure for the point type within the match type
            if (!acc[matchType][type]) {
                acc[matchType][type] = {
                    point_type_name: type,
                    point_for: []
                };
            }

            // Add point details to the respective type under the match type
            acc[matchType][type].point_for.push({
                point_for_name: item.point_for_name,
                point_for_status: item.point_for_status,
                points: item.points
            });

            return acc;
        }, {});

        // Convert the grouped points into the desired format
        const result = Object.entries(groupedPoints).map(([matchType, types]) => ({
            match_type_name: matchType,
            point_types: Object.values(types)
        }));

        if (result.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Point Not Found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "Display Point System",
            data: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};
