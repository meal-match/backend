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
    },
    maxSideCustomizations: {
        // If there is no maxSideCustomizations field, refer to restaurant's defaultMaxSideCustomizations
        type: Number,
        required: false,
        default: undefined
    }
})

const DrinkSchema = new mongoose.Schema({
    drink: {
        type: String,
        required: true
    },
    drinkCustomizations: {
        type: [String],
        required: true,
        default: []
    },
    maxDrinkCustomizations: {
        // If there is no maxDrinkCustomizations field, refer to restaurant's defaultMaxDrinkCustomizations
        type: Number,
        required: false,
        default: undefined
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
        type: [DrinkSchema],
        required: false,
        default: undefined
    },
    sauces: {
        // If there is no sauces field, refer to restaurant's defaultSauces
        type: [String],
        required: false,
        default: undefined
    },
    maxEntreeCustomizations: {
        // If there is no maxEntreeCustomizations field, refer to restaurant's defaultMaxEntreeCustomizations
        type: Number,
        required: false,
        default: undefined
    },
    maxSauces: {
        // If there is no maxSauces field, refer to restaurant's defaultMaxSauces
        type: Number,
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
        type: [DrinkSchema],
        required: true,
        default: []
    },
    defaultSauces: {
        type: [String],
        required: true,
        default: []
    },
    defaultMaxSauces: {
        type: Number,
        required: true,
        default: 0
    },
    defaultMaxDrinkCustomizations: {
        type: Number,
        required: true,
        default: 0
    },
    defaultMaxSideCustomizations: {
        type: Number,
        required: true,
        default: 0
    },
    defaultMaxEntreeCustomizations: {
        type: Number,
        required: true,
        default: 0
    }
})

module.exports = mongoose.model('Restaurant', RestaurantSchema)
