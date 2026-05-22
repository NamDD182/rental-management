const Room = require("../models/room");

// GET /rooms - danh sach tat ca phong
const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({ roomNumber: 1 });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /rooms/:id - chi tiet 1 phong
const getRoomById = async (req, res) => {
    try{
        const room = await Room.findById(req.params.id);
        if(!room){
            return res.status(404).json({message: "Không tìm thấy phòng"});
        }
        res.json(room);
    } catch (error){
        res.status(500).json({message: error.message});
    }
}

// POST /rooms - tao phong moi
const createRoom = async(req, res) => {
    try{
        const room = await Room.create(req.body);
        res.status(201).json(room);
    } catch(error){
        res.status(500).json({message: error.message});
    }
}

// PUT /rooms/:id - sua phong
const updateRoom = async(req, res) => {
    try{
        const room = await Room.findByIdAndUpdate(req.params.id,req.body,{new: true, runValidators: true});
        if(!room){
            return res.status(404).json({ message: "Không tìm thấy phòng"});
        }
        res.json(room);
    } catch(error){
        res.status(500).json({message: error.message});
    }
}

// DELETE /rooms/id - xoa phong
const deleteRoom = async(req, res) => {
    try{
        const room = await Room.findById(req.params.id);
        if(!room){
            return res.status(400).json({message: "Không tìm thấy phòng"});
        }

        //không xóa phòng có ng đang ở
        if(room.status === "occupied"){
             return res.status(400).json({ message: "Phòng đang có người ở, không thể xóa" });
        }
        await room.deleteOne();
        res.json({message: "Xóa phòng thành công!"});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

module.exports = {getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom};