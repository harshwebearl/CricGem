const Admin = require("../models/admin");
const pointFor = require("../models/PointFor");

const insertPointType = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        const { point_for_name , status} = req.body;



        newData = new pointFor({
            point_for_name,
            status
        });

        await newData.save();


        return res.status(200).json({
            success:true,
            message: "point type inserted successfully",
            Data: newData
        });


    } catch (error) {
        return res.status(500).json({success:true, error: error.message });
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
        const point_for = await pointFor.find();
        
        if (!point_for ) {
            return res.status(404).send({success:true, message: "data not found" });
        }
        return res.status(200).json({
            message: "data retrived successfully",
            point_for: point_for,
        })
    } catch (error) {
        return res.status(500).send({success:true, error: error.message })
    }
}

const updatePoint = async (req, res) => {
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
        const {point_for_name, status} = req.body;

        const updateData = {
            point_for_name,
            status
        }

        const updatedData = await pointFor.findByIdAndUpdate(id,{$set:updateData},{new:true})

        return res.status(200).json({
            success: true,
            message: "PointFor updated successfully",
            Data: updatedData
        });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
};

const deletePoint = async (req, res) => {
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

        const deletePoint = await pointFor.findByIdAndDelete(id);
        if(!deletePoint){
            return res.status(404).send({message:"point for not found"})
        }
        return res.status(200).json({
            success:true,
            message:"pointFor deleted successfully",
            data:deletePoint
        })
    } catch (error) {
        return res.status(500).send({success:true,error:error.message})
    }
}

module.exports = {
    insertPointType,
    displayAll,
    updatePoint,
    deletePoint
}