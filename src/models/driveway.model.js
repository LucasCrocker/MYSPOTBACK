const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const drivewaySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    role: {
      type: String,
      enum: roles,
      default: 'driveway',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
drivewaySchema.plugin(toJSON);
drivewaySchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The driveway's email
 * @param {ObjectId} [excludeDrivewayId] - The id of the driveway to be excluded
 * @returns {Promise<boolean>}
 */
// drivewaySchema.statics.isEmailTaken = async function (email, excludeDrivewayId) {
//   const driveway = await this.findOne({ email, _id: { $ne: excludeDrivewayId } });
//   return !!driveway;
// };

/**
 * Check if password matches the driveway's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
// drivewaySchema.methods.isPasswordMatch = async function (password) {
//   const driveway = this;
//   return bcrypt.compare(password, driveway.password);
// };

// drivewaySchema.pre('save', async function (next) {
//   const driveway = this;
//   if (driveway.isModified('password')) {
//     driveway.password = await bcrypt.hash(driveway.password, 8);
//   }
//   next();
// });

/**
 * @typedef Driveway
 */
const Driveway = mongoose.model('Driveway', drivewaySchema);

module.exports = Driveway;
