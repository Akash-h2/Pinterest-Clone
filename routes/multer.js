const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pinterest_uploads', // Specify folder in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Allowed file formats
    },
});

// Set up Multer to use Cloudinary storage
const upload = multer({ storage: storage });

module.exports = upload;
