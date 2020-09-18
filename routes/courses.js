var express = require("express");
var router = new express.Router();
const ctrlCourses = require('../controllers/courses');

/* GET users listing. */
router.get("/:id/stream", ctrlCourses.stream);
router.get("/:id/download", ctrlCourses.download);

module.exports = router;
