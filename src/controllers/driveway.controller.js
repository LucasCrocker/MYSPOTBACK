const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { drivewayService } = require('../services');

const createDriveway = catchAsync(async (req, res) => {
  console.log("creating driveway", req.body);
  const driveway = await drivewayService.createDriveway(req.body);
  res.status(httpStatus.CREATED).send(driveway);
});

const getDriveways = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await drivewayService.queryDriveways(filter, options);
  res.send(result);
});

const getDriveway = catchAsync(async (req, res) => {
  const driveway = await drivewayService.getDrivewayById(req.params.drivewayId);
  if (!driveway) {
    throw new ApiError(httpStatus.NOT_FOUND, 'driveway not found');
  }
  res.send(driveway);
});

const updateDriveway = catchAsync(async (req, res) => {
  const driveway = await drivewayService.updateDrivewayById(req.params.drivewayId, req.body);
  res.send(driveway);
});

const deleteDriveway = catchAsync(async (req, res) => {
  await drivewayService.deleteDrivewayById(req.params.drivewayId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createDriveway,
  getDriveways,
  getDriveway,
  updateDriveway,
  deleteDriveway,
};
