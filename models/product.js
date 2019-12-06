const mongoose = require('mongoose');

var ProductSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    make : {
        type : Number,
        required : true
    },
    category : {
        type : mongoose.Types.ObjectId
    }
});


var Product = mongoose.model('Product' ,ProductSchema)

module.exports = {Product};
