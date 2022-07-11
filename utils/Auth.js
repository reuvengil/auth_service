const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");

const getListUsers = async (res) => {
  let users = await User.find({}, { password: 0, __v: 0 });
  res.status(200).json(users);
};

const userBlock = async (email, flag, res) => {
  try {
    await User.updateOne(
      { email: email },
      {
        $set: {
          block: flag,
        },
      }
    );
    return res.status(201).json({
      message: flag ? "User blocked." : "User unblocked.",
      success: true,
    });
  } catch {
    return res.status(500).json({
      message: flag ? "Unable to block account." : "Unable to unblock account.",
      success: false,
    });
  }
};

const userChangePassword = async (req, res) => {
  if (!req.body.newPassword || !req.body.oldPassword) {
    return res.status(400).json({
      message: `Missing parameters.`,
      success: false,
    });
  }
  let isMatch = await bcrypt.compare(req.body.oldPassword, req.user.password);
  if (isMatch) {
    const password = await bcrypt.hash(req.body.newPassword, 12);
    await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          password: password,
        },
      }
    );
  } else {
    return res.status(403).json({
      message: "Incorrect password.",
      success: false,
    });
  }
  return res.status(201).json({
    message: "User password was updated successfully. please login.",
    success: true,
  });
};

const userRegister = async (userDets, role, res) => {
  try {
    let emailNotRegistered = await validateEmail(userDets.email);
    if (!emailNotRegistered) {
      return res.status(400).json({
        message: `Email is already registered.`,
        success: false,
      });
    }

    let phoneNotRegistered = await validatePhone(userDets.phone);
    if (!phoneNotRegistered) {
      return res.status(400).json({
        message: `Phone is already registered.`,
        success: false,
      });
    }

    const password = await bcrypt.hash(userDets.password, 12);
    // create a new user
    const newUser = new User({
      ...userDets,
      password,
      role,
    });

    await newUser.save();
    return res.status(201).json({
      message: "You are successfully registred. Please login.",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to create your account.",
      success: false,
    });
  }
};

const userLogin = async (userCreds, role, res) => {
  let { email, password } = userCreds;
  // First Check if the username is in the database
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      message: "Invalid login credentials.",
      success: false,
    });
  }
  // We will check the role

  // That means user is existing and trying to signin fro the right portal
  // Now check for the password
  let isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    // Sign in the token and issue it to the user
    let token = jwt.sign(
      {
        user_id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.PRIVATE_KEY,
      { expiresIn: "7 days" }
    );

    let result = {
      block: user.block,
      role: user.role,
      email: user.email,
      Notifications: user.messages,
      token: `Bearer ${token}`,
      expiresIn: 168,
    };

    return res.status(200).json({
      message: "User login successfully.",
      success: true,
      ...result,
    });
  } else {
    return res.status(403).json({
      message: "Incorrect password.",
      success: false,
    });
  }
};

const userDelete = async (email, res) => {
  try {
    await User.deleteOne({ email: email });
    return res.status(201).json({
      message: "User deleted successfully.",
      success: true,
    });
  } catch {
    return res.status(500).json({
      message: "Unable to delete account.",
      success: false,
    });
  }
};

// !!!!
const userUpdate = async (req, res) => {
  const ser = serializeUpdateUser(req.user, req.body);
  
  const usernameisvalid =
    (ser.username !== req.user.username &&
      (await validateUsername(ser.username))) ||
    ser.username === req.user.username;

  const phoneisvalid =
    (ser.phone !== req.user.phone && (await validatePhone(ser.phone))) ||
    ser.phone === req.user.phone;
  
  const emailisvalid =
    (ser.email !== req.user.email && (await validateEmail(ser.email))) ||
    ser.email === req.user.email;

  // check if username is alredy taken
  if (!usernameisvalid) {
    return res.status(400).json({
      message: `Username is already taken.`,
      success: false,
    });
  }

  // check if phone is alredy taken
  if (!phoneisvalid) {
    return res.status(400).json({
      message: `Phone is already taken.`,
      success: false,
    });
  }
  // check if email is alredy taken
  if (!emailisvalid) {
    return res.status(400).json({
      message: `Email is already taken.`,
      success: false,
    });
  }
  // update user in database
  await User.updateOne(
    { _id: req.user._id },
    {
      $set: {
        phone: ser.phone,
        email: ser.email,
        name: ser.name,
        username: ser.username,
      },
    }
  );
  return res.status(201).json({
    message: "User update successfully.",
    success: true,
  });
};
//#endregion

//#region Validate Functions
const validateEmail = async (email) => {
  let user = await User.findOne({ email });
  return user ? false : true;
};
const validatePhone = async (phone) => {
  let user = await User.findOne({ phone });
  return user ? false : true;
};
//#endregion

//#region Auth Middelwares
/**
 * Check if user login or not
 */
const userAuth = passport.authenticate("jwt", { session: false });
/**
 * Check if current user is permitted
 * @param {*} roles - admin/user
 * @returns
 */
const checkRole = (roles) => (req, res, next) => {
  !roles.includes(req.user.role)
    ? res.status(401).json({ message: "Unauthorized" })
    : next();
};

function block(req, res, next) {
  req.user.block ? res.status(401).json({ message: "User blocked" }) : next();
}

//#endregion

//#region Serilaize Functions
const serializeUpdateUser = (user, body) => {
  return {
    email: body.email ? body.email : user.email,
    name: body.name ? body.name : user.name,
    phone: body.phone ? body.phone : user.phone,
  };
};
const serializeUser = (user) => {
  return {
    _id: user._id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    updatedAt: user.updatedAt,
    createdAt: user.createdAt,
  };
};
//#endregion

module.exports = {
  userAuth,
  checkRole,
  userLogin,
  userRegister,
  userDelete,
  serializeUser,
  userUpdate,
  getListUsers,
  userChangePassword,
  userBlock,
  block,
};