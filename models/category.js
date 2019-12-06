const mongoose = require('mongoose');

var CategorySchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    type : {
        type : String,
        required : true
    },
    model : {
        type : Number,
        required : true
    },
    product : [mongoose.Types.ObjectId]
});


var Category = mongoose.model('Categories' ,CategorySchema)

module.exports = {Category};
