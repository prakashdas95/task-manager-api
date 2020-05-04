const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task');


const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error("Email is invalid")
                }
            }
        },
        password: {
            type: String,
            required: true,
            minlength: 7,
            trim: true,
            validator(value) {
                if (value.toLowerCase().includes('password')) {
                    throw new Error('Password cannot contain "password"')
                }
            }
        },
        age: {
            type: Number,
            default: 0,
            validate(value) {
                if (value < 0) {
                    throw new Error('Age must be a positive number')
                }
            }
        },
        tokens: [{
            token: {
                type: String,
                require: true
            }
        }],
        avatar: {
            type: Buffer
        }
    }, {
    timestamps: true
}
)

//virtual property is not actually data stored in the database 
// it's a relationship between two entities 
//in this case between user and task
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})


//method on the instance and individual user
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject;
}


//method on the instance and individual user
userSchema.methods.generateAuthToken = async function () {
    const user = this;

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save();

    return token;
}


//methods on the actual uppercase User method
// comparing using email to find exact user then using bycrpt compare 
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!email) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new console.error('Unable to login!');
    }

    return user;
}


// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    //accessing the user
    const user = this

    if (user.isModified('password')) {
        //swapping password with hashed password
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })

    next()
})



const User = mongoose.model('User', userSchema)

module.exports = User;