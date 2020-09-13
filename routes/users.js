var express = require("express");
var router = new express.Router();
const ctrlUsers = require("../controllers/users");

/* Endpoint Register*/
router.post("/register", ctrlUsers.register);

/* Endpoint Login */
router.post("/login", ctrlUsers.login);

module.exports = router;
