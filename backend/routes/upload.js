const express    = require("express");
const router     = express.Router();
const auth       = require("../middleware/auth");
const upload     = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

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

module.exports = router;