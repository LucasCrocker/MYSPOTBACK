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

  // console.log('Payment methods: ', paymentMethods.data[0].id);
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

//not used?
const createUser = catchAsync(async (req, res) => {
  const customer = await stripe.customers.create();
  req.body.customer = customer;
  // console.log("customer: ", customer);
  const user = await userService.createUser(req.body).lean();
  // const { isEmailVerified, ...newUser} = user;
  // console.log("user: ", user);
  // console.log("new user: " , newUser);
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
//  console.log("result: ", result);
//  console.log("numTotalDriveways: ", numTotalDriveways);
//  console.log("numVacantDriveways: ", numVacantDriveways);
 const quote = (numVacantDriveways/numTotalDriveways * 150) > 0.5 ? (numVacantDriveways/numTotalDriveways * 150).toFixed(2) : 0.5

  // const filter = pick(req.query, ['name', 'role']);
  // const options = pick(req.query, ['sortBy', 'limit', 'page']);
  // const result = await userService.queryUsers(filter, options);
  await userService.updateUserById(req.user._id, {quote: quote});
  // let bestSpot = result[0]
  // let { isEmailVerified, account, customer, password, ...bestSpot} = result[0].toObject();

  const random1 = Math.floor(Math.random() * 10)
  const random2 = Math.floor(Math.random() * 10)
  const random3 = Math.floor(Math.random() * 10)
  const random4 = Math.floor(Math.random() * 10)
  // console.log("random1", random1)
  // console.log("random2", random2)
  let fuzzedLat = (result[0].driveway.location.location.lat).toFixed(3) + random1 + random1 + random3 + random4;
  let fuzzedLng = (result[0].driveway.location.location.lng).toFixed(3) + random2 + random2 + random3 + random4;
  let bestSpot = {
    id: result[0]._id,
    driveway: {
      location: {
        location: { 
          lat: parseFloat(fuzzedLat ),
          lng: parseFloat(fuzzedLng )
        },
        description: result[0].driveway.location.description.replace(/[0-9]/g, '').trim(),
      }
    }
  }
  let spots = [bestSpot]
  // let spots = [result[0]]
  console.log("bestSpot", bestSpot)
  result = {spots: spots, quote: quote};
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
  // console.log(drivewayOwner);

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
    const newUser = await userService.updateUserById(req.user._id, {driveway: req.body});
    const { isEmailVerified, account, customer, password, flags, ...user} = newUser.toObject();
    // console.log("user", newUser);
    // console.log("new user", user);  
    res.send(newUser);
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
    console.log(accountLink);
    res.send(accountLink);
  }
});

const bookDriveway = catchAsync(async (req, res) => {
  const ObjectId = require('mongodb').ObjectId;

  let userCheck = await User.findOne(
    {"_id": ObjectId(req.user._id)},
  )
  let temp_customer = userCheck.customer;
  const paymentMethods = await stripe.paymentMethods.list({
    customer: temp_customer.id,
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
  console.log("result account fuck up guy", result);
 if (!(result.account)) {
  throw new ApiError(httpStatus.BAD_REQUEST, 'Driveway owner has no account');
 }

 if (!(result.driveway)) {
  throw new ApiError(httpStatus.BAD_REQUEST, 'This user has no driveway listed');
 }

 if (result.flags && result.flags.paymentIntentRetrievedErr) {
  throw new ApiError(httpStatus.BAD_REQUEST, 'There was an error with your lat payment on this platform - please contact the administrator');
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
  const { isEmailVerified, account, customer, password, flags, ...userBookingDriveway} = userBookingDrivewayResult.toObject();
  // console.log("user", userBookingDrivewayResult);
  console.log("new user", userBookingDriveway);  
  res.send(userBookingDriveway);
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
  


  let temp_customer = userBookingDriveway.customer;
  const paymentMethods = await stripe.paymentMethods.list({
    customer: temp_customer.id,
    type: 'card',
  });
  // console.log("Payment methods: ", paymentMethods);
  // console.log("PaymentMethods.data[0].id: ", paymentMethods.data[0].id);
  const flatRate = 1;
  let now = moment(new Date());
  let paymentTotal = now.diff(bookedDate, 'hours') * price + flatRate;
  console.log("payment total", paymentTotal);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: (paymentTotal * 100),
      currency: 'cad',
      customer: temp_customer.id,
      payment_method: paymentMethods.data[0].id,
      off_session: true,
      confirm: true,
      application_fee_amount: (paymentTotal * 100 * myspotFee),
      transfer_data: {
        destination: drivewayOwner.account.id,
      },
    });
    console.log("payment success", paymentIntent);
    
    // userBookingDrivewayResult
    const { isEmailVerified, account, customer, password, flags, ...newUser} = userBookingDrivewayResult.toObject();
    console.log("releaseDriveway new user:", newUser);
    res.send(newUser);
  } catch (err) {
    // Error code will be authentication_required if authentication is needed
    console.log('Error code is: ', err.code);
    const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
    (userBookingDrivewayResult.flags) ? 
      userBookingDrivewayResult.flags.paymentIntentRetrievedErr = paymentIntentRetrieved
      :
      userBookingDrivewayResult.flags = {'paymentIntentRetrievedErr': paymentIntentRetrieved}
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
    const { isEmailVerified, account, customer, password, flags, ...newUser} = userResult.toObject();
    console.log("deletedriveway new user:", newUser);

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
