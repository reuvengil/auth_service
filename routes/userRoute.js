require('dotenv').config()
const router = require("express").Router()
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Bring in the User Registration function
const {
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
} = require("../utils/Auth");



// Login Route
router.post("/login", async (req, res) => {
    await userLogin(req.body, "user", res);
});

// blocking user
router.put("/block/:email", userAuth, block, async (req, res) => {
    await userBlock(req.params.email, true, res);
});
router.put("/unblock/:email", userAuth, block, async (req, res) => {
    await userBlock(req.params.email, false, res);
});
router.post("/register-admin", async (req, res) => {
    await userRegister(req.body, "admin", res);
});

// Admin Login Route
// Get Users List Route (Admin only)
router.get("/", userAuth, checkRole(["admin"]), async (req, res) => {
    await getListUsers(res);
});


router.delete("/delete-admin/:email", userAuth, checkRole(["admin"]), async (req, res) => {
    await userDelete(req.params.email, res);
});

// Users Registeration Route
router.post("/register-user", async (req, res) => {
    await userRegister(req.body, "user", res);
});

// Profile Route
router.get("/profile", userAuth, block, async (req, res) => {
    return res.json(serializeUser(req.user));
});

// Delete Route
router.delete("/delete", userAuth, block, async (req, res) => {
    await userDelete(req.user.email, res);
});

router.put("/update", userAuth, block, async (req, res) => {
    await userUpdate(req, res);
});

// Change Password Route
router.put("/change-password", userAuth, block, async (req, res) => {
  await userChangePassword(req, res);
});
module.exports = router