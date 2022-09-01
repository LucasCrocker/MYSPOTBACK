const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const { User } = require('../models');
const moment =  require('moment')

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

    res.send(paymentMethods.data.length > 0);
});

const paymentSheet = catchAsync(async (req, res) => {

  const ObjectId = require('mongodb').ObjectId;

  let user = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )
  let customer = user.customer;
  // console.log("flag 1");
  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customer.id},
    {apiVersion: '2022-08-01'}
  );
  // console.log("flag 2");
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
  });
  // console.log("flag 3")

  res.send({
    setupIntent: setupIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey: 'pk_test_51LZlAiBPaG0NtDBCN9LceoWeCkacRMmrY3EQcNtJCEcjrWGnzJudSd0fH97NGAiFFSzXaDG0OkrzWTno0ppcU84n007mQUmu3b'
  })
});

const updatePaymentMethod = catchAsync(async (req, res) => {
  const ObjectId = require('mongodb').ObjectId;

  let user = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )
  let customer = user.customer;

  let paymentMethods = await stripe.paymentMethods.list({
    customer: customer.id,
    type: 'card',
  });

  console.log('Payment methods: ', paymentMethods.data[0].id);
  let deleted;
  if (paymentMethods.data.length > 0) {
    deleted = await stripe.paymentMethods.detach(
      paymentMethods.data[0].id
    );
  }
  
  paymentMethods = await stripe.paymentMethods.list({
    customer: customer.id,
    type: 'card',
  });

  res.send(paymentMethods.data.length > 0)

})

const createUser = catchAsync(async (req, res) => {
  const customer = await stripe.customers.create();
  req.body.customer = customer;
  // console.log("customer: ", customer);
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

  // const numVacantDriveways = 1
  const numVacantDriveways = await User.aggregate(
    [
      {
        $geoNear: {
           near: { type: "Point", coordinates: [req.body.location.location.lng, req.body.location.location.lat] },
           distanceField: "dist.calculated",
           maxDistance: 1000,
           minDistance: 0,
           key: "driveway.loc",
           spherical: true,
           query: {'driveway.vacant': true  }
        }
      },
      {
        $count: "count"
      }
    ]
  )
  const numTotalDriveways = await User.aggregate(
    [
      {
        $geoNear: {
           near: { type: "Point", coordinates: [req.body.location.location.lng, req.body.location.location.lat] },
           distanceField: "dist.calculated",
           maxDistance: 1000,
           minDistance: 0,
           key: "driveway.loc",
           spherical: true
        }
      },
      {
        $count: "count"
      }
    ]
  )

  let result = await User.find(
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
 console.log("numTotalDriveways: ", numTotalDriveways);
 console.log("numVacantDriveways: ", numVacantDriveways);
 const quote = (numVacantDriveways/numTotalDriveways * 150) > 0.5 ? (numVacantDriveways/numTotalDriveways * 150).toFixed(2) : 0.5

  // const filter = pick(req.query, ['name', 'role']);
  // const options = pick(req.query, ['sortBy', 'limit', 'page']);
  // const result = await userService.queryUsers(filter, options);
  await userService.updateUserById(req.user._id, {quote: quote});
  result = {spots: result, quote: quote};
  res.send(result);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const addDrivewayToUser = catchAsync(async (req, res) => {
  const ObjectId = require('mongodb').ObjectId;
  console.log("Inside addDrivewayToUser");
  console.log('req:', req.body);
  const drivewayOwner = await User.findOne(
    {"driveway.location.location": req.body.location.location}
  )
  console.log(drivewayOwner);

  if (drivewayOwner) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This driveway is already listed.');
  }

  let userCheck = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )

  if (userCheck.account !== undefined) {
    req.body['vacant'] = true;
    // req.body['account'] = account;
    req.body['loc'] = {
      type: 'Point',
      coordinates: [req.body.location.location.lng, req.body.location.location.lat]
    }
    const user = await userService.updateUserById(req.user._id, {driveway: req.body});
    res.send(user);
  } else {
  // add a stripe account for the driveway
    const newAccount = await stripe.accounts.create({
      country: 'CA',
      type: 'express',
      capabilities: {card_payments: {requested: true}, transfers: {requested: true}},
      business_type: 'individual',
    });

    const accountLink = await stripe.accountLinks.create({
      account: newAccount.id,
      refresh_url: 'https://myspot-back.herokuapp.com/v1/auth/redirect',
      return_url: 'https://myspot-back.herokuapp.com/v1/auth/redirect',
      type: 'account_onboarding',
    });

    req.body['vacant'] = true;
    // req.body['account'] = account;
    req.body['loc'] = {
      type: 'Point',
      coordinates: [req.body.location.location.lng, req.body.location.location.lat]
    }
    const user = await userService.updateUserById(req.user._id, {account: newAccount, driveway: req.body});
    // res.send(user);
    res.send(accountLink);
  }
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
  if (!(paymentMethods.data.length > 0)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No payment methods present');
  }

  const result = await User.findOne(
    { $and: [
   {"_id": ObjectId(req.body.location.id)},
  ]}
 )

 if (!(result.account)) {
  throw new ApiError(httpStatus.BAD_REQUEST, 'Driveway owner has no account');
 }

 if (!(result.driveway)) {
  throw new ApiError(httpStatus.BAD_REQUEST, 'This user has no driveway listed');
 }
 
//  console.log("result is:", result);
  result.driveway.vacant = false;
  result.driveway.bookedBy = {
    user: req.user._id,
    lastModified: new Date()
  }


  let bookedDriveway = {
    idOfDriveway: result._id,
    lastModified: new Date(),
    driveway: result.driveway.location,
    lockedInPrice: userCheck.quote
  }
  const userBookingDrivewayResult = await userService.updateUserById(req.user._id, {booked: bookedDriveway});
  const user = await userService.updateUserById(result._id, {driveway: result.driveway});
  // console.log("here it is m8: ", userBookingDrivewayResult);
  res.send(userBookingDrivewayResult);
});

const releaseDriveway = catchAsync(async (req, res) => {
  const myspotFee = 0.1;
  const ObjectId = require('mongodb').ObjectId;

  let drivewayOwner = await User.findOne(
    {"_id": ObjectId(req.user.booked.idOfDriveway)},
    )
  let bookedDate = moment(drivewayOwner.driveway.bookedBy.lastModified);


  drivewayOwner.driveway.bookedBy = null;
  drivewayOwner.driveway.vacant = true;
  const userResult = await userService.updateUserById(req.user.booked.idOfDriveway, {driveway: drivewayOwner.driveway});
    
  let userBookingDriveway = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )
  let price = userBookingDriveway.booked.lockedInPrice;
  userBookingDriveway.booked = null;
  const userBookingDrivewayResult = await userService.updateUserById(req.user._id, userBookingDriveway);
  


  let customer = userBookingDriveway.customer;
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customer.id,
    type: 'card',
  });
  console.log("Payment methods: ", paymentMethods);
  console.log("PaymentMethods.data[0].id: ", paymentMethods.data[0].id);
  let now = moment(new Date());
  let paymentTotal = now.diff(bookedDate, 'hours') * price + 5
  console.log("payment total", paymentTotal);
  // the plus five above is just for testing and should be removed in case I forget
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: (paymentTotal * 100),
      currency: 'cad',
      customer: customer.id,
      payment_method: paymentMethods.data[0].id,
      off_session: true,
      confirm: true,
      application_fee_amount: (paymentTotal * 100 * myspotFee),
      transfer_data: {
        destination: drivewayOwner.account.id,
      },
    });
    console.log("payment success", paymentIntent);
    userBookingDrivewayResult
    res.send(userBookingDrivewayResult);
  } catch (err) {
    // Error code will be authentication_required if authentication is needed
    console.log('Error code is: ', err.code);
    const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
    userBookingDrivewayResult.paymentIntentRetrievedErr = paymentIntentRetrieved;
    console.log('PI retrieved: ', paymentIntentRetrieved.id);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment failed - please contact administrator');
  }


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
  // setPaymentIntent,
  // processPaymentIntent,
  paymentSheet,
  // testPaymentSheet,
  deleteDriveway,
  checkForPaymentMethod,
  updatePaymentMethod,
};
