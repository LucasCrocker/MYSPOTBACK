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

const getBookingStatus = catchAsync(async (req, res) => {
  //get timestamp and location of driveway your renting
  const bookedDrivewayResult = await User.find({'driveway.bookedDriveway.user': req.user._id}, {'driveway.bookedBy.user.lastModified': 1, 'driveway.location': 1})
  //get timestamp of your driveway
  const yourDrivewayResult = await User.find({'email': req.user._id}, {'driveway.bookedBy': 1})
  

return { booked: bookedDrivewayResult, driveway: yourDrivewayResult};
})

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
    { $and: [
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
   },
   {'driveway.vacant': true  },
  ]}
 )
 console.log("result: ", result);
 
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

const bookDriveway = catchAsync(async (req, res) => {
  const ObjectId = require('mongodb').ObjectId;
  const result = await User.findOne(
    { $and: [
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
      },
   },
   {"driveway.location.description": req.body.location.description},
  ]}
 )
 
  result.driveway.vacant = false;
  result.driveway.bookedBy = {
    user: req.user.email,
    lastModified: new Date()
  }


  let bookedDriveway = {
    emailOfDriveway: result.email,
    lastModified: new Date(),
    driveway: result.driveway.location
  }
  const userBookingDrivewayResult = await userService.updateUserById(req.user._id, {booked: bookedDriveway});
  const user = await userService.updateUserById(result._id, {driveway: result.driveway});
  res.send(userBookingDrivewayResult);
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
  bookDriveway,
  getBookingStatus
};
