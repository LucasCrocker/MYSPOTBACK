const Joi = require('joi');
const { password } = require('./custom.validation');

const registerDriveway = {
  body: Joi.object().keys({
    days: Joi.object().keys({
      mon: Joi.boolean(),
      tue: Joi.boolean(),
      wed: Joi.boolean(),
      thu: Joi.boolean(),
      fri: Joi.boolean(),
      sat: Joi.boolean(),
      sun: Joi.boolean(),
    }),
    location: Joi.object().keys({
      location: Joi.object().keys({
        lat: Joi.number(),
        lng: Joi.number()
      }),
      description: Joi.string()
    }),
  }),
};
const getBookingStatus = {
};

const getDriveways = {
  body: Joi.object().keys({
    location: Joi.object().keys({
      location: Joi.object().keys({
        lat: Joi.number(),
        lng: Joi.number()
      }),
      description: Joi.string()
    }),
  }),
};

module.exports = {
  registerDriveway,
  getDriveways,
  getBookingStatus
};
