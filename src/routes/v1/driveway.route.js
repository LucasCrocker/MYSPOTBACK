const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const drivewayValidation = require('../../validations/driveway.validation');
const drivewayController = require('../../controllers/driveway.controller');

const router = express.Router();

// router.post('/register-driveway', drivewayController.register);
// router.post('/register-driveway', validate(drivewayValidation.register), authController.register);

router 
  // .route('/register-driveway')
  // .post( validate(drivewayValidation.register), authController.register);
  .route('/')
  .post(auth('register-driveway'), validate(drivewayValidation.registerDriveway), drivewayController.createDriveway);
router
  .route('/')
  .post(auth('manageDriveways'), validate(drivewayValidation.createDriveway), drivewayController.createDriveway)
  .get(auth('getDriveways'), validate(drivewayValidation.getDriveways), drivewayController.getDriveways);
router
  .route('/:drivewayId')
  .get(auth('getDriveways'), validate(drivewayValidation.getDriveway), drivewayController.getDriveway)
  .patch(auth('manageDriveways'), validate(drivewayValidation.updateDriveway), drivewayController.updateDriveway)
  .delete(auth('manageDriveways'), validate(drivewayValidation.deleteDriveway), drivewayController.deleteDriveway);

module.exports = router;

