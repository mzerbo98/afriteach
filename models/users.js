const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      required: true,
      min: 5,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      min: 2,
    },
    lastName: {
      type: String,
      required: true,
      min: 2,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    salt: String,
    hash: String,
  },
  { timestamps: true }
);
userSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex");
};

userSchema.methods.validPassword = function (password) {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex");

  return this.hash === hash;
};

userSchema.methods.generateJWT = function () {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 2);
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
      exp: parseInt(expiry.getTime() / 1000, 10),
    },
    process.env.JWT_TOKEN
  );
};

mongoose.model("User", userSchema);
