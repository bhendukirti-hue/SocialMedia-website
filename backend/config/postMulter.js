const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,

  params: {
    folder: "vlogify/posts",

    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "mp4",
      "mov",
      "avi",
      "mkv",
    ],

    resource_type: "auto",
  },
});

const upload = multer({
  storage: storage,

  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

module.exports = upload;