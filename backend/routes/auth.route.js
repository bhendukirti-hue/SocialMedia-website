const express = require("express");

const AuthController = require("../controllers/auth.controler");
const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../config/multer");

const router = express.Router();


// ==========================================
// REGISTER
// ==========================================

// Send OTP
router.post(
    "/register",
    AuthController.register
);


// ==========================================
// VERIFY OTP
// ==========================================

router.post(
    "/verify-otp",
    AuthController.verifyOTP
);


// ==========================================
// LOGIN
// ==========================================

router.post(
    "/login",
    AuthController.login
);

// ==========================================
// FORGOT PASSWORD
// ==========================================

router.post(
    "/forgot-password",
    AuthController.forgotPassword
);


// ==========================================
// RESET PASSWORD
// ==========================================

router.post(
    "/reset-password/:token",
    AuthController.resetPassword
);
// ==========================================
// VERIFY TOKEN
// ==========================================

router.get(
    "/verify-token",
    authMiddleware,
    AuthController.verifyToken
);


// ==========================================
// LOGOUT
// ==========================================

router.post(
    "/logout",
    authMiddleware,
    AuthController.logout
);

// ==========================================
// UPDATE PROFILE
// ==========================================

router.put(
    "/update-profile",
    authMiddleware,
    AuthController.updateProfile
);

// ==========================================
// UPLOAD PROFILE PICTURE
// ==========================================

router.post(
    "/upload-profile",
    authMiddleware,
    upload.single("profileimage"),
    AuthController.uploadProfilePicture
);

module.exports = router;