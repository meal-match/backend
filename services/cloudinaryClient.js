require('dotenv').config()
const { v2: cloudinary } = require('cloudinary')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'uploads', // Folder in Cloudinary
        // eslint-disable-next-line no-unused-vars
        format: async (_req, _file) => 'png',
        public_id: (_req, file) => `${Date.now()}-${file.originalname}`
    }
})

const upload = multer({ storage })

module.exports = { cloudinary, upload }
