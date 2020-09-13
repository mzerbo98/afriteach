const passport = require("passport");
const mongoose = require("mongoose");

require("../models/users");
const User = mongoose.model("User");

const register = (req, res) => {
  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.role ||
    !req.body.password
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }
  const user = new User();
  user.name = req.body.name;
  user.email = req.body.email;
  user.role = req.body.role;
  user.setPassword(req.body.password);
  user.save((err) => {
    if (err) {
      res.status(400).json(err);
    } else {
      const token = user.generateJWT();
      res.status(200).json(token);
    }
  });
};

const login = (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: "All fields are required!" });
  }
  passport.authenticate("local", (err, user, info) => {
    let token;
    if (err) {
      return res.status(400).json(err);
    }
    if (user) {
      token = user.generateJWT();
      res.status(200).json(token);
    } else {
      res.status(401).json(info);
    }
  })(req, res);
};

module.exports = {
  register,
  login,
};
