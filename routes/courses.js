var express = require("express");
var router = new express.Router();
const ctrlCourses = require("../controllers/courses");

/* GET users listing. */
router.get("/:id/stream", ctrlCourses.stream);
router.get("/:id/download", ctrlCourses.download);
router.get("/:id/thumbnail", ctrlCourses.thumbnail);
router.get("/:id/", ctrlCourses.findById);
router.post("/", ctrlCourses.publish);
router.get("/", ctrlCourses.find);
router.post("/upload", ctrlCourses.upload);

module.exports = router;
