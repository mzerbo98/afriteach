const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { v1: uuidv1 } = require("uuid");

const escapeStringRegexp = require("escape-string-regexp");
const { throws } = require("assert");
const ThumbnailGenerator =  require("video-thumbnail-generator").default;

const TEACHER_ROLE = "TEACHER";
const THUMBNAIL_PATH = "files/courses/img/";
const VIDEO_PATH = "files/courses/videos/";

require("../models/users");
require("../models/courses");
require("../models/views");
require("../models/downloads");

const User = mongoose.model("User");
const Course = mongoose.model("Course");
const View = mongoose.model("View");
const Download = mongoose.model("Download");


const upload = (req, res) => {
    const token = req.query.token;
    let userId;
    if (token) {
        jwt.verify(token, process.env.JWT_TOKEN || "secret", (err, user) => {
            if (err) {
                res.status(403).json({
                    message: "Token auth error",
                    error: err
                });
            } else {
                if (user.role.toUpperCase() === TEACHER_ROLE) {
                    userId = user._id;
                    if (!req.files || Object.keys(req.files).length === 0 || !req.files.video) {
                        return res.status(400).json({
                            message: "No files were uploaded."
                        });
                    }
                    
                    let vid = req.files.video;
                    const name = uuidv1();
                    const  path = VIDEO_PATH + name + vid.name.substr(vid.name.lastIndexOf("."));
                
                    vid.mv(path, function(err) {
                        if (err) {
                            return res.status(500).json({
                                message: "upload error",
                                error: err
                            });
                        }
                        const tg = new ThumbnailGenerator({
                            sourcePath: "./" + path,
                            thumbnailPath: THUMBNAIL_PATH
                        });
                        tg.generateOneByPercentCb(10, (err, result) => {
                            if (err) {
                                return res.json({
                                    message: "File uploaded!",
                                    videoUrl: path,
                                    thumbnailUrl: null,
                                    thumbnailError: err
                                });
                            }
                            return res.json({
                                message: "File uploaded!",
                                videoUrl: path,
                                thumbnailUrl: THUMBNAIL_PATH + result
                            });
                          });
                    });
                } else {
                    res.status("403").json({
                        message: "Only Teachers can publish"
                    });
                }
            }
        });
    } else {
        res.status(403).send("Auth token required");
    }
};

const stream = (req, res) => {
    const courseId = req.params.id;
    Course.findById(courseId, function(err, course){
        if (err) {
            res.status(404).json({
                message: "Course stream error",
                error: err
            });
        } else {
            if (!course) {
                res.status(404).json({
                    message: "Course not found"
                });
            } else {
                const token = req.query.token;
                const ip = req.ip;
                let userId;
                if (token) {
                    jwt.verify(token, process.env.JWT_TOKEN || "secret", (err, user) => {
                        if (err) {
                            userId = null;
                        } else {
                            userId = user._id;
                        }
                    });
                }
                
                const path =  course.videoUrl;
                if (!path) {
                    return res.status(404).json({
                        message: "Video not found"
                    });
                }
                
                const view = new View();
                view.viewer = userId;
                view.course = courseId;
                view.ipAddress = ip;
                view.save();
            
                /*eslint-disable */
                const stat = fs.statSync("./" + path);
                /*eslint-enable */
                const fileSize = stat.size;
                const range = req.headers.range;
            
                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1]
                    ? parseInt(parts[1], 10)
                    : fileSize-1;
            
                    const chunksize = (end-start)+1;
                    /*eslint-disable */
                    const file = fs.createReadStream("./" + path, {start, end});
                    /*eslint-enable */
                    const head = {
                        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                        "Accept-Ranges": "bytes",
                        "Content-Length": chunksize,
                        "Content-Type": "video/mp4",
                    };
            
                    res.writeHead(206, head);
                    file.pipe(res);
                } else {
                    const head = {
                        "Content-Length": fileSize,
                        "Content-Type": "video/mp4",
                    };
                    res.writeHead(200, head);
                    /*eslint-disable */
                    fs.createReadStream("./" + path).pipe(res);
                    /*eslint-enable */
                }
            }
        }
    });
};

const publish = (req, res) => {
    const token = req.query.token;
    let userId;
    if (token) {
        jwt.verify(token, process.env.JWT_TOKEN || "secret", (err, user) => {
            if (err) {
                res.status(403).json({
                    message: "Token auth error",
                    error: err
                });
            } else {
                if (user.role.toUpperCase() === TEACHER_ROLE) {
                    userId = user._id;
                    if (
                        req.body.title &&
                        req.body.subject &&
                        req.body.language &&
                        req.body.videoUrl
                        ) {
                        const course = new Course();
                        course.title = req.body.title;
                        course.subject = req.body.subject;
                        course.level = req.body.level;
                        course.country = req.body.country;
                        course.description = req.body.description;
                        course.language = req.body.language;
                        course.thumbnailUrl = req.body.thumbnailUrl;
                        course.videoUrl = req.body.videoUrl;
                        course.owner = userId;
                        course.save(function(err, c){
                            if (err) {
                                res.status(400).send({
                                    message: "Course Publishing error",
                                    error: err
                                });
                            }
                            else {
                                delete c.videoUrl;
                                res.json(c);
                            }
                        });
                    } else {
                        return res.status(400).json({ message: "Title, Subject, Language and Video are required." });
                    }
                } else {
                    res.status("403").json({
                        message: "Only Teachers can publish"
                    });
                }
            }
        });
    } else {
        res.status(403).send("Auth token required");
    }
};

const download = (req, res) => {
    const courseId = req.params.id;
    Course.findById(courseId, function(err, course){
        if (err) {
            res.status(404).json({
                message: "Course download error",
                error: err
            });
        } else {
            if (course) {
                const token = req.query.token;
                const ip = req.ip;
                let userId;
                if (token) {
                    jwt.verify(token, process.env.JWT_TOKEN || "secret", (err, user) => {
                        if (err) {
                            userId = null;
                        } else {
                            userId = user._id;
                        }
                    });
                }
                
                const path =  course.videoUrl;
                if (!path) {
                    return res.status(404).json({
                        message: "Video not found"
                    });
                }
                
                const download = new Download();
                download.downloader = userId;
                download.course = courseId;
                download.ipAddress = ip;
                download.save();
            
                /*eslint-disable */
                res.download("./" + path);
                /*eslint-enable */
            } else {
                res.status(404).json({
                    message: "Course not found"
                });
            }
        }    
    });
};

const thumbnail = (req, res) => {
    const courseId = req.params.id;
    Course.findById(courseId, function(err, course){
        if (err) {
            res.status(404).json({
                message: "Course thumbnail error",
                error: err
            });
        } else {
            if (course) {
                const path =  course.thumbnailUrl;
                if (!path) {
                    return res.status(404).json({
                        message: "Thumbnail not found"
                    });
                }
                /*eslint-disable */
                res.download("./" + path);
                /*eslint-enable */
            } else {
                res.status(404).json({
                    message: "Course not found"
                });
            }
        }    
    });
};

const findById = (req, res) => {
    const id = req.params.id;
    Course.findById(id, function(err, course){
        if (err) {
            return res.status(500).json({
                message: "Database Error",
                error: err
            });
        } else {
            if (course) {
                return res.json(course);
            } else {
                return res.status(404).json({
                    message: "Course not found",
                    data: course
                });
            }
        }
    });
};

/*eslint complexity: ["error", 10]*/
const find = (req, res) => {
    let text = req.query.query || req.body.query;
    const skip = req.query.skip || req.body.skip || 0;
    const limit = req.query.limit || req.body.limit || 4;
    if (text) {
        text = escapeStringRegexp(text);
        /*eslint-disable */
        text = new RegExp(text, "i");
        /*eslint-enable */
    }
    let query = Course.find();
    if (text) {
        query = query.or([
            {title: { $regex: text }},
            {level: { $regex: text }},
            {country: { $regex: text }},
            {subject: { $regex: text }},
            {description: { $regex: text }}
        ]);
    }
    query
        .skip(Number(skip))
        .limit(Number(limit))
        .sort({updatedAt: -1})
        .exec(function(err, courses){
            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err
                });
            } else {
                return res.json(courses);
            }
        });
};

module.exports = {
    stream,
    download,
    publish,
    upload,
    thumbnail,
    find,
    findById
};
