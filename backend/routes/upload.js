const express    = require("express");
const multer     = require("multer");
const router     = express.Router();
const auth       = require("../middleware/auth");
const upload     = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

// Multer riêng cho file hợp đồng: nhận cả ảnh và PDF
const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh hoặc PDF"));
    }
  },
});

// POST /upload/image
router.post("/image", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Không có file" });

    // Upload lên Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "rental_management" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /upload/file — upload file hợp đồng (ảnh hoặc PDF)
router.post("/file", auth, fileUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Không có file" });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "rental_management/contracts", resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;