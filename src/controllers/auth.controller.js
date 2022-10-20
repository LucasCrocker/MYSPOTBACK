const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');


const redirect = catchAsync(async (req, res) => {
  console.log("redirect working");

  res.redirect("myspot://home");
});

const passwordResetRedirect = catchAsync(async (req, res) => {
  // console.log("token:", req.query.token);
  const redirectLink = `myspot://passwordReset/${req.query.token}`;
  // const redirectLink = `exp://192.168.0.62:19000/--/passwordReset/${req.query.token}`;
  res.redirect(redirectLink);
});

const register = catchAsync(async (req, res) => {
  // console.log("register", req.body);
  const newUser = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(newUser);
  const { isEmailVerified, account, customer, password, ...user} = newUser.toObject();
  // console.log("user", newUser);
  // console.log("new user", user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const email = req.body.email;
  const user_password = req.body.password;
  const newUser = await authService.loginUserWithEmailAndPassword(email, user_password);
  const tokens = await tokenService.generateAuthTokens(newUser);
  const { isEmailVerified, account, customer, password, ...user} = newUser.toObject();
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  // console.log("logout", req.body);
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  // console.log("refreshTokens", req.body);
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  // console.log("Inside pass reset:", req);
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  redirect,
  passwordResetRedirect
};
