const mongoose = require('mongoose')

const SideSchema = new mongoose.Schema({
    side: {
        type: String,
        required: true
    },
    sideCustomizations: {
        type: [String],
        required: true,
        default: []
    }
})

const MealSchema = new mongoose.Schema({
    entree: {
        type: String,
        required: true
    },
    entreeCustomizations: {
        type: [String],
        required: true,
        default: []
    },
    sides: {
        // If there is no sides field, refer to restaurant's defaultSides
        type: [SideSchema],
        required: false,
        default: undefined
    },
    drinks: {
        // If there is no drinks field, refer to restaurant's defaultDrinks
        type: [String],
        required: false,
        default: undefined
    },
    sauces: {
        // If there is no sauces field, refer to restaurant's defaultSauces
        type: [String],
        required: false,
        default: undefined
    }
})

const RestaurantSchema = new mongoose.Schema({
    restaurant: {
        type: String,
        required: true
    },
    meals: {
        type: [MealSchema],
        required: true
    },
    defaultSides: {
        type: [SideSchema],
        required: true,
        default: []
    },
    defaultDrinks: {
        type: [String],
        required: true,
        default: []
    },
    defaultSauces: {
        type: [String],
        required: true,
        default: []
    }
})

module.exports = mongoose.model('Restaurant', RestaurantSchema)
