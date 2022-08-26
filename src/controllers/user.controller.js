const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const { User } = require('../models');
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('sk_test_51LZlAiBPaG0NtDBCYaZFxWwYX9HwjdH86FW69v12OUcABN57tYriwJtfiZVLoUQOhPsHf5hnIkUwA9ZNPqbOMtyv00cwMjjDC5');

const checkForPaymentMethod = catchAsync(async (req, res) => {
  const ObjectId = require('mongodb').ObjectId;

  let user = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )
    let customer = user.customer;
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });
    // console.log("Payment methods: ", paymentMethods);
    // console.log("Payment methods (paymentMethods.data.length > 0): ", (paymentMethods.data.length > 0));
    res.send(paymentMethods.data.length > 0);
});
const testPaymentSheet = catchAsync(async (req, res) => {
  const ObjectId = require('mongodb').ObjectId;

  let user = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )
    let customer = user.customer;
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });
    console.log("Payment methods: ", paymentMethods);
    console.log("PaymentMethods.data[0].id: ", paymentMethods.data[0].id);

try {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1199,
    currency: 'usd',
    customer: customer.id,
    payment_method: paymentMethods.data[0].id,
    off_session: true,
    confirm: true,
  });
  res.send(paymentIntent);
} catch (err) {
  // Error code will be authentication_required if authentication is needed
  console.log('Error code is: ', err.code);
  const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
  console.log('PI retrieved: ', paymentIntentRetrieved.id);
  throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
}
});

const paymentSheet = catchAsync(async (req, res) => {
  // Use an existing Customer ID if this is a returning customer.
  // const customer = await stripe.customers.create();
  const ObjectId = require('mongodb').ObjectId;

  let user = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )
  let customer = user.customer;
  console.log("flag 1");
  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customer.id},
    {apiVersion: '2022-08-01'}
  );
  console.log("flag 2");
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
  });
  console.log("flag 3")
  // res.json({
  //   setupIntent: setupIntent.client_secret,
  //   ephemeralKey: ephemeralKey.secret,
  //   customer: customer.id,
  //   publishableKey: 'pk_test_A7jK4iCYHL045qgjjfzAfPxu'
  // })
  res.send({
    setupIntent: setupIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey: 'pk_test_51LZlAiBPaG0NtDBCN9LceoWeCkacRMmrY3EQcNtJCEcjrWGnzJudSd0fH97NGAiFFSzXaDG0OkrzWTno0ppcU84n007mQUmu3b'
  })
});

const processPaymentIntent = catchAsync(async (req, res) => {
  const ObjectId = require('mongodb').ObjectId;

  let user = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )
  const paymentMethods = await stripe.paymentMethods.list({
    customer: user.customer.id,
    type: 'card',
  });
  console.log("paymentMethods", paymentMethods);
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1099,
      currency: 'cad',
      customer: user.customer.id,
      payment_method: card,
      // payment_method: paymentMethods[0].id,
      off_session: true,
      confirm: true,
    });
    const clientSecret = paymentIntent.client_secret;
    res.send(clientSecret);
  } catch (err) {
    // Error code will be authentication_required if authentication is needed
    console.log('Error code is: ', err.code);
    // const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
    // console.log('PI retrieved: ', paymentIntentRetrieved.id);
  }
});

// create the payment intent for a given user
const setPaymentIntent = catchAsync(async (req, res) => {
  const ObjectId = require('mongodb').ObjectId;

  let user = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )
  // const setupIntent = await stripe.setupIntents.create({
  //   customer: user.customer.id,
  // });
  // const paymentMethods = await stripe.paymentMethods.list({
  //   customer: user.customer.id,
  //   type: 'card',
  // });

  // console.log("paymentMethods on setPaymentIntent: ", paymentMethods, user.customer.id);
  // const clientSecret = setupIntent.client_secret;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099, //lowest denomination of particular currency
    currency: "usd",
    payment_method_types: ["card"], //by default
  });

  const clientSecret = paymentIntent.client_secret;
  console.log("client secret is: ", clientSecret)
  res.send(clientSecret);
});

const createUser = catchAsync(async (req, res) => {
  const customer = await stripe.customers.create();
  req.body.customer = customer;
  console.log("customer: ", customer);
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

// const getBookingStatus = catchAsync(async (req, res) => {
//   //get timestamp and location of driveway your renting
//   const bookedDrivewayResult = await User.find({'driveway.bookedDriveway.user': req.user._id}, {'driveway.bookedBy.user.lastModified': 1, 'driveway.location': 1})
//   //get timestamp of your driveway
//   const yourDrivewayResult = await User.find({'email': req.user._id}, {'driveway.bookedBy': 1})
  

// return { booked: bookedDrivewayResult, driveway: yourDrivewayResult};
// })

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
  ]},
  {_id: 1, "driveway.location.location": 1, "driveway.location.description": 1 }
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

 
  let userCheck = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )
    let customer = userCheck.customer;
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    }); 
    if (paymentMethods.data.length > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No payment methods present');
    }

  const result = await User.findOne(
    { $and: [
   {"_id": ObjectId(req.body.location.id)},
  ]}
 )
//  console.log("result is:", result);
  result.driveway.vacant = false;
  result.driveway.bookedBy = {
    user: req.user._id,
    lastModified: new Date()
  }


  let bookedDriveway = {
    idOfDriveway: result._id,
    lastModified: new Date(),
    driveway: result.driveway.location
  }
  const userBookingDrivewayResult = await userService.updateUserById(req.user._id, {booked: bookedDriveway});
  const user = await userService.updateUserById(result._id, {driveway: result.driveway});
  // console.log("here it is m8: ", userBookingDrivewayResult);
  res.send(userBookingDrivewayResult);
});

const releaseDriveway = catchAsync(async (req, res) => {

  const ObjectId = require('mongodb').ObjectId;
  let drivewayOwner = await User.findOne(
    {"_id": ObjectId(req.user.booked.idOfDriveway)},
    )
  drivewayOwner.driveway.bookedBy = null;
  drivewayOwner.driveway.vacant = true;
  const userResult = await userService.updateUserById(req.user.booked.idOfDriveway, {driveway: drivewayOwner.driveway});
    
  let userBookingDriveway = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )
  userBookingDriveway.booked = null;
  const userBookingDrivewayResult = await userService.updateUserById(req.user._id, userBookingDriveway);
  
  res.send(userBookingDrivewayResult);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const deleteDriveway = catchAsync(async (req, res) => {
  console.log('in deleteDriveway');
  const ObjectId = require('mongodb').ObjectId;
  let drivewayOwner = await User.findOne(
    {"_id": ObjectId(req.user._id)},
    )

  if (drivewayOwner.driveway.bookedBy) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Driveway is currently booked.');
  } else {
    drivewayOwner.driveway = null;
    const userResult = await userService.updateUserById(req.user._id, {driveway: drivewayOwner.driveway});
    res.send(userResult);
  }
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
  releaseDriveway,
  setPaymentIntent,
  processPaymentIntent,
  paymentSheet,
  testPaymentSheet,
  deleteDriveway,
  checkForPaymentMethod
};
