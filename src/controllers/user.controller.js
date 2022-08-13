const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const { User } = require('../models');
const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const getDriveways = catchAsync(async (req, res) => {
  // console.log("we're in", req.body);
  // const filter = { 
  //   $and: [
  //   {driveway: { $exists: true } },
  //   {'driveway.vacant': true  },
  //   // {"driveway.loc": {"$nearSphere": {"$geometry": {type: "Point", coordinates: [25.601198, 45.657976]}, "$maxDistance": 1000}}}
  //   ]
  // };

  const result = await User.find(
    {
      "driveway.loc": {
        $near: {
          $geometry: {
             type: "Point" ,
             coordinates: [req.body.location.location.lng, req.body.location.location.lat]
          },
          $maxDistance: 1000,
          $minDistance: 0
        }
      }
   }
 )
 
 
  // const filter = pick(req.query, ['name', 'role']);
  // const options = pick(req.query, ['sortBy', 'limit', 'page']);
  // const result = await userService.queryUsers(filter, options);

  res.send(result);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const addDrivewayToUser = catchAsync(async (req, res) => {
  console.log("req.body", req.body);
  req.body['vacant'] = true;
  req.body['loc'] = {
    type: 'Point',
    coordinates: [req.body.location.location.lng, req.body.location.location.lat]
  }
  const user = await userService.updateUserById(req.user._id, {driveway: req.body});
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUsers,
  getDriveways,
  getUser,
  updateUser,
  addDrivewayToUser,
  deleteUser,
};
