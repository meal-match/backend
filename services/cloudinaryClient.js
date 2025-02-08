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
        folder: process.env.CLOUDINARY_FOLDER, // Folder in Cloudinary
        // eslint-disable-next-line no-unused-vars
        format: async (_req, _file) => 'png',
        public_id: (_req, file) => `${Date.now()}-${file.originalname}`
    }
})

const deleteImageFromCloudinary = async (imageUrl) => {
    if (!imageUrl) {
        return
    }

    // Extract public_id from Cloudinary URL
    const parts = imageUrl.split('/')
    const filename = parts[parts.length - 1] // Get filename
    const publicId =
        process.env.CLOUDINARY_FOLDER +
        '/' +
        filename.substring(0, filename.lastIndexOf('.')) // Remove extension

    try {
        await cloudinary.uploader.destroy(publicId)
        console.log(`Deleted image: ${publicId}`)
    } catch (err) {
        console.error('Error deleting image from Cloudinary:', err)
    }
}

const upload = multer({ storage })

module.exports = { cloudinary, upload, deleteImageFromCloudinary }
