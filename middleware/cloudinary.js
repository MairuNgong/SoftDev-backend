const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer();

function uploadImageToCloudinary(folder = 'Softdev') {
  return async function (req, res, next) {
    if (req.file) {
      try {
        const streamUpload = (req) => {
          return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream(
              { folder },
              (error, result) => {
                if (result) resolve(result);
                else reject(error);
              }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
        };

        const result = await streamUpload(req);
        req.body.imageUrl = result.secure_url; // Use a generic key
      } catch (err) {
        return res.status(400).json({ error: 'Image upload failed', details: err.message });
      }
    }
    next();
  };
}


module.exports = { upload, uploadImageToCloudinary };