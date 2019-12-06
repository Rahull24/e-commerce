const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const _ = require('lodash');

var UserSchema = new mongoose.Schema({
        email: {
            type : String,
            required: true,
            trim : true,
            minLength : 1,
            unique : true,
            validate:{
                validator : validator.isEmail,
                message: '{VALUE} is not a valid Email'
            }
        },
        password : {
            type : String,
            required : true,
            minLength : 6
        },
        token: {
            type : String
        },
        cart : [mongoose.Types.ObjectId]
});

UserSchema.methods.toJSON = function() {
    var user = this;
    var userObject = user.toObject();
    return _.pick(userObject, ['_id', 'email']);
}

UserSchema.methods.generateAuthToken = function() {
    var user = this;
    var token = jwt.sign({_id: user._id.toHexString()}, 'abc123').toString();
    user.token = token;
    
    return user.save().then(() => {
        return token;
    });
};

UserSchema.statics.findByToken = function(token) {
    var User = this;
    var decoded;
    try {
        decoded = jwt.verify(token, 'abc123');
    } catch(e) {
        return Promise.reject();
    }
    return User.findOne({
        _id : decoded._id,
        token : token
    });
};

UserSchema.statics.findByCredentials = function(email, password) {
    var User = this;

    return User.findOne({email}).then((user) => {
        if(!user) {
            return Promise.reject();
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if(res) {
                    resolve(user)
                } else {
                    reject();
                }
            });
        });
        
    });    
}

UserSchema.pre('save', function(next){
    var user = this;

    if(user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

var User = mongoose.model('User', UserSchema);

module.exports = {User}