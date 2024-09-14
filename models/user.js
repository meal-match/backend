const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@(crimson\.)?ua\.edu$/,
            'Email must be a valid ua.edu address'
        ]
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    resetPasswordToken: String, // Store the reset token
    resetPasswordExpires: Date // Expiry time for the token
})

// Hash the password before saving the user document
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next()
    } // Only hash if password was modified

    try {
        const salt = await bcrypt.genSalt(10) // Generate salt
        this.password = await bcrypt.hash(this.password, salt) // Hash password with salt
        next()
    } catch (err) {
        next(err)
    }
})

// Method to compare hashed password with the provided password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password) // Compare passwords
    } catch (err) {
        throw new Error(err)
    }
}

module.exports = mongoose.model('User', UserSchema)
