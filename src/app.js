const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const YOUR_DOMAIN = 'http://localhost:3000';
const app = express();
const stripe_secret_key = process.env.stripe_secret_key;
// const stripe = require('stripe')('sk_test_Hrs6SAopgFPF0bZXSN3f6ELN');
const stripe = require('stripe')(stripe_secret_key);

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = "whsec_uqvZJ0leP3IgUZaoA9EkYZpYxs9y0vcb";

app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  // console.log(`Incoming webhook event ${event.type}`);
  let account;
  let application;
  let externalAccount;
  let paymentIntent;
  // Handle the event
  switch (event.type) {
    case 'account.updated':
      account = event.data.object;
      // Then define and call a function to handle the event account.updated
      break;
    case 'account.application.authorized':
      application = event.data.object;
      // Then define and call a function to handle the event account.application.authorized
      break;
    case 'account.application.deauthorized':
      application = event.data.object;
      // Then define and call a function to handle the event account.application.deauthorized
      break;
    case 'account.external_account.created':
      externalAccount = event.data.object;
      // Then define and call a function to handle the event account.external_account.created
      break;
    case 'account.external_account.deleted':
      externalAccount = event.data.object;
      // Then define and call a function to handle the event account.external_account.deleted
      break;
    case 'account.external_account.updated':
      externalAccount = event.data.object;
      // Then define and call a function to handle the event account.external_account.updated
      break;
    case 'payment_intent.amount_capturable_updated':
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.amount_capturable_updated
      break;
    case 'payment_intent.canceled':
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.canceled
      break;
    case 'payment_intent.created':
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.created
      break;
    case 'payment_intent.partially_funded':
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.partially_funded
      break;
    case 'payment_intent.payment_failed':
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.payment_failed
      break;
    case 'payment_intent.processing':
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.processing
      break;
    case 'payment_intent.requires_action':
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.requires_action
      break;
    case 'payment_intent.succeeded':
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
