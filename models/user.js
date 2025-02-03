const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

const OrderSchema = new mongoose.Schema(
    {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        type: { type: String, required: true }
    },
    { _id: false }
)

const PayMethodSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        default: { type: Boolean, required: true }
    },
    { _id: false }
)

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@crimson\.ua\.edu$/,
            'Email must be a valid crimson.ua.edu address'
        ]
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        validate: {
            validator: (v) => {
                // Regular expression for the password criteria:
                // - At least one digit
                // - At least one lowercase letter
                // - At least one uppercase letter
                // - At least one special character from ! @ # $ % ^ & *
                // - Minimum length of 8 characters
                return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/.test(
                    v
                )
            },
            message:
                'Password must be at least 8 characters long and include at least one number, one uppercase letter, one lowercase letter, and one special character (! @ # $ % ^ & *).'
        }
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    paymentMethods: {
        type: [PayMethodSchema],
        default: []
    },
    payoutMethods: {
        type: [PayMethodSchema],
        default: []
    },
    verificationToken: String, // Store the verification token
    resetPasswordToken: String, // Store the reset token
    resetPasswordExpires: Date, // Expiry time for the reset token
    openOrders: [OrderSchema], // Array of open orders
    paymentSetupIntent: String, // Store the stripe payment setup intent
    payoutSetupIntent: String, // Store the stripe payout setup intent
    pushToken: String // Store the push notification token from the frontend
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
