const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserModel = require("../models/user.model");
const OTPModel = require("../models/otp.model");

const sendEmail = require("../config/mail");

const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS) || 10;

class AuthController {

    // ==========================================
    // REGISTER - SEND OTP
    // ==========================================

    static register = async (req, res, next) => {
        try {

            const { username, email, password } = req.body;

            // Check required fields
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Username, email and password are required"
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            // Check existing user
            const existingUser = await UserModel.findOne({
                email: normalizedEmail
            });

            if (existingUser) {

                if (existingUser.isVerified) {
                    return res.status(400).json({
                        success: false,
                        message: "Email already registered"
                    });
                }

                // If user exists but is not verified,
                // remove the old user so registration can continue
                await UserModel.deleteOne({
                    _id: existingUser._id
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(
                password,
                saltRounds
            );

            // Generate 6 digit OTP
            const otp = crypto
                .randomInt(100000, 1000000)
                .toString();

            // Create user
            const newUser = new UserModel({
                ...req.body,
                email: normalizedEmail,
                password: hashedPassword,
                isVerified: false
            });

            await newUser.save();

            // Remove old OTP
            await OTPModel.deleteMany({
                email: normalizedEmail
            });

            // Store OTP
            await OTPModel.create({
                email: normalizedEmail,
                otp: otp,
                expiresAt: new Date(
                    Date.now() + 5 * 60 * 1000
                )
            });

            // Send OTP email
            await sendEmail(
                normalizedEmail,
                "Email Verification OTP",
                `Your OTP is ${otp}`,
                `
                    <div style="font-family:Arial;padding:20px">

                        <h2>Email Verification</h2>

                        <p>Hello ${username},</p>

                        <p>Your verification OTP is:</p>

                        <h1 style="color:#0F4C5C">
                            ${otp}
                        </h1>

                        <p>
                            This OTP will expire in 5 minutes.
                        </p>

                    </div>
                `
            );

            return res.status(201).json({
                success: true,
                message: "OTP sent successfully"
            });

        } catch (error) {
            next(error);
        }
    };


    // ==========================================
    // VERIFY OTP
    // ==========================================

    static verifyOTP = async (req, res, next) => {
        try {

            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({
                    success: false,
                    message: "Email and OTP are required"
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            // Find user
            const user = await UserModel.findOne({
                email: normalizedEmail
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Find OTP
            const otpData = await OTPModel.findOne({
                email: normalizedEmail
            });

            if (!otpData) {
                return res.status(400).json({
                    success: false,
                    message: "OTP expired or not found"
                });
            }

            // Check expiration
            if (otpData.expiresAt < new Date()) {

                await OTPModel.deleteOne({
                    _id: otpData._id
                });

                return res.status(400).json({
                    success: false,
                    message: "OTP expired"
                });
            }

            // Check OTP
            if (otpData.otp !== String(otp)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid OTP"
                });
            }

            // Verify user
            user.isVerified = true;

            await user.save();

            // Delete OTP
            await OTPModel.deleteOne({
                _id: otpData._id
            });

            return res.status(200).json({
                success: true,
                message: "Registration successful"
            });

        } catch (error) {
            next(error);
        }
    };


    // ==========================================
    // LOGIN
    // ==========================================

    static login = async (req, res, next) => {
        try {

            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email and password are required"
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            // Find user
            const currentUser = await UserModel.findOne({
                email: normalizedEmail
            });

            // Don't reveal whether email exists
            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            // Check email verification
            if (!currentUser.isVerified) {
                return res.status(403).json({
                    success: false,
                    message: "Please verify your email first"
                });
            }

            // Compare password
            const isMatched = await bcrypt.compare(
                password,
                currentUser.password
            );

            if (!isMatched) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            // Generate JWT
            const token = jwt.sign(
                {
                    id: currentUser._id,
                    role: currentUser.role
                },
                process.env.JWT_SECRET_KEY,
                {
                    expiresIn: "7d"
                }
            );

            // Store JWT in HTTP-only cookie
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite:
                    process.env.NODE_ENV === "production"
                        ? "none"
                        : "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({
                success: true,
                message: "Login successful"
            });

        } catch (error) {
            next(error);
        }
    };

    // ==========================================
// FORGOT PASSWORD
// ==========================================

static forgotPassword = async (req, res, next) => {
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await UserModel.findOne({
            email: normalizedEmail
        });

        // Don't reveal whether email exists
        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    "If an account exists with this email, a password reset link has been sent."
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash token before saving in database
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Save token and expiry
        user.resetPasswordToken = hashedToken;

        user.resetPasswordExpires =
            new Date(Date.now() + 15 * 60 * 1000);

        await user.save();

        // Frontend reset URL
        const resetUrl =
            `http://localhost:5173/reset-password/${resetToken}`;

        await sendEmail(
            normalizedEmail,
            "Reset Your Vlogify Password",
            `Reset your Vlogify password using this link: ${resetUrl}`,
            `
                <div style="font-family:Arial;padding:20px">

                    <h2 style="color:#2563EB">
                        Reset Your Password
                    </h2>

                    <p>Hello ${user.username},</p>

                    <p>
                        We received a request to reset your Vlogify
                        account password.
                    </p>

                    <p>
                        Click the button below to create a new password.
                    </p>

                    <a
                        href="${resetUrl}"
                        style="
                            display:inline-block;
                            padding:12px 20px;
                            background:#2563EB;
                            color:white;
                            text-decoration:none;
                            border-radius:8px;
                            margin:15px 0;
                        "
                    >
                        Reset Password
                    </a>

                    <p>
                        This link will expire in 15 minutes.
                    </p>

                    <p>
                        If you did not request this, you can safely
                        ignore this email.
                    </p>

                </div>
            `
        );

        return res.status(200).json({
            success: true,
            message:
                "If an account exists with this email, a password reset link has been sent."
        });

    } catch (error) {
        next(error);
    }
};
    // ==========================================
// RESET PASSWORD
// ==========================================

static resetPassword = async (req, res, next) => {
    try {

        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // Hash token
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Find user with valid token
        const user = await UserModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: {
                $gt: new Date()
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Reset link is invalid or expired"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(
            password,
            saltRounds
        );

        // Update password
        user.password = hashedPassword;

        // Remove reset token
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful"
        });

    } catch (error) {
        next(error);
    }
};
    // ==========================================
    // LOGOUT
    // ==========================================

    static logout = async (req, res, next) => {
        try {

            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite:
                    process.env.NODE_ENV === "production"
                        ? "none"
                        : "lax"
            });

            return res.status(200).json({
                success: true,
                message: "Logout successful"
            });

        } catch (error) {
            next(error);
        }
    };


    // ==========================================
    // VERIFY TOKEN
    // ==========================================

    static verifyToken = async (req, res, next) => {
    try {

        const user = await UserModel.findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Token is valid",
            user: user
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// UPDATE PROFILE
// ==========================================

static updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const {
            username,
            bio,
            location,
            profilePicture
        } = req.body;

        // Find current user
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check username
        if (username && username.trim() !== user.username) {

            const existingUser = await UserModel.findOne({
                username: username.trim(),
                _id: { $ne: userId }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Username already exists"
                });
            }

            user.username = username.trim();
        }

        // Update fields
        if (bio !== undefined) {
            user.bio = bio.trim();
        }

        if (location !== undefined) {
            user.location = location.trim();
        }

        if (profilePicture !== undefined) {
            user.profilePicture = profilePicture;
        }

        await user.save();

        const updatedUser = await UserModel.findById(userId)
            .select("-password");

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// UPLOAD PROFILE PICTURE
// ==========================================

static uploadProfilePicture = async (req, res, next) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a profile picture"
            });
        }

        // Cloudinary URL
        const profilePicture = req.file.path;

        // Your authentication middleware stores the user ID in req.user.id
        const userId = req.user.id;

        // Update profile picture
        const user = await UserModel.findByIdAndUpdate(
            userId,
            {
                profilePicture: profilePicture
            },
            {
                new: true
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile picture uploaded successfully",
            profilePicture: user.profilePicture,
            user: user
        });

    } catch (error) {
        console.error("Profile picture upload error:", error);
        next(error);
    }
};

}


module.exports = AuthController;