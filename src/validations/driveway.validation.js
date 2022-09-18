const Joi = require('joi');
const { password } = require('./custom.validation');

const registerDriveway = {
  body: Joi.object().keys({
    days: Joi.object().keys({
      mon: Joi.binary(),
      tue: Joi.binary(),
      wed: Joi.binary(),
      thu: Joi.binary(),
      fri: Joi.binary(),
      sat: Joi.binary(),
      sun: Joi.binary(),
    }),
    location: Joi.object().keys({
      location: Joi.object().keys({
        lat: Joi.number(),
        lng: Joi.number()
      }),
      description: Joi.string(),
      unit: Joi.string()
    }),
  }),
};

const updateDriveway = {
  body: Joi.object().keys({
    location: Joi.object().keys({
      location: Joi.object().keys({
        lat: Joi.number(),
        lng: Joi.number()
      }),
      description: Joi.string(),
      unit: Joi.string()
    })
  }),
};

const setSchedule = {
  body: Joi.object().keys({
    day: Joi.string(),
    schedule: Joi.binary()
  })
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

const bookDriveway = {
  body: Joi.object().keys({
    location: Joi.object().keys({
      location: Joi.object().keys({
        lat: Joi.number(),
        lng: Joi.number()
      }),
      description: Joi.string(),
      id: Joi.string().hex().length(24)
    }),
  }),
};

module.exports = {
  registerDriveway,
  getDriveways,
  bookDriveway,
  updateDriveway,
  setSchedule
};
