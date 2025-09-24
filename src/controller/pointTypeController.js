const { default: mongoose } = require("mongoose");
const pointType = require("../models/PointType");
const Admin = require("../models/admin");

const pointTypeInsert = async(req,res)=>{
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        const {point_type_name,point_for} = req.body;
        const newData = new pointType({
            point_type_name,
            point_for
        })
        await newData.save();
        return res.status(200).json({
            success:true,
            message:"pointType inserted successfully",
            data:newData
        })

    } catch (error) {
        return res.status(500).send({error:error.message});
    }
}

const displayAll = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        const pointTypes = await pointType.aggregate([
            {
                $lookup: {
                    from: 'point_fors', 
                    localField: 'point_for', 
                    foreignField: '_id', 
                    as: 'point_for_details' 
                }
            },
            {
                $project: {
                    _id: 1,
                    point_type_name: 1,
                    point_for:"$point_for_details"
                }
            }
        ]);

        if (!pointTypes.length) {
            return res.status(404).send({success:false, message: "Point types not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Point types retrieved successfully",
            data: pointTypes
        });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
}
const displayById = async (req, res) => {
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
        const pointTypes = await pointType.aggregate([
            {
                $match: {_id: new mongoose.Types.ObjectId(id)}
            },
            {
                $lookup: {
                    from: 'point_fors', 
                    localField: 'point_for', 
                    foreignField: '_id', 
                    as: 'point_for_details' 
                }
            },
            {
                $project: {
                    _id: 1,
                    point_type_name: 1,
                    point_for:"$point_for_details"
                }
            }
        ]);

        if (!pointTypes.length) {
            return res.status(404).send({ message: "Point types not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Point types retrieved successfully",
            data: pointTypes
        });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
}

const updatePointType = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        const { id } = req.params;
        const { point_type_name, point_for } = req.body;
        const data = {
            point_type_name,
            point_for
        }

        const updatedPointType = await pointType.findByIdAndUpdate(id, data, { new: true });

        if (!updatedPointType) {
            return res.status(404).send({ message: "Point type not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Point type updated successfully",
            data: updatedPointType
        });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
};

const deletePointType = async(req,res)=>{
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
        let deleteType = await pointType.findById(id);
        if(!deleteType){
            return res.status(404).send({message:"Point Type not found"});
        }
        deleteType = await pointType.findByIdAndDelete(id);
        return res.status(200).json({
            success:true,
            message:"point Type delete successfully",
            data:deleteType
        })
    } catch (error) {
        return res.status(500).send({error:error.message})
    }
}

module.exports = {
    pointTypeInsert,
    displayAll,
    displayById,
    updatePointType,
    deletePointType
}