const Joi = require('joi');
const { password } = require('./custom.validation');

const registerDriveway = {
  body: Joi.object().keys({
    days: Joi.array().items(Joi.string()),
    location: Joi.object(),
    // name: Joi.string().required(),
  }),
};

module.exports = {
  registerDriveway,

};
