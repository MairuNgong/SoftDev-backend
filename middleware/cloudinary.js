// middleware/cloudinary.js
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer();

/**
 * Use AFTER: upload.single('ImagePicture')
 * If file exists, uploads to Cloudinary, sets req.body.imageUrl / imagePublicId, then next().
 * If no file, just next().
 */
function uploadImageToCloudinary(folder = 'Softdev') {
  return async function (req, res, next) {
    if (!req.file) return next();

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      req.body.imageUrl = result.secure_url;
      req.body.imagePublicId = result.public_id;
      return next();
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      return res.status(400).json({ error: 'Image upload failed', details: err.message });
    }
  };
}

module.exports = { upload, uploadImageToCloudinary };
