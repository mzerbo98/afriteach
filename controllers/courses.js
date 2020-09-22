const fs = require("fs");
const paths = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const TEACHER_ROLE = "TEACHER";

require("../models/users");
require("../models/courses");
require("../models/views");
require("../models/downloads");

const User = mongoose.model("User");
const Course = mongoose.model("Course");
const View = mongoose.model("View");
const Download = mongoose.model("Download");


const stream = (req, res) => {
    const courseId = req.params.id;
    Course.findById(courseId, function(err, course){
        if (err) {
            res.status(404).json({
                message: "Course stream error",
                error: err
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
            
            const view = new View();
            view.viewer = userId;
            view.course = courseId;
            view.ipAddress = ip;
            view.save();
        
            const path = paths.join(process.cwd() + course.videoUrl);
            const stat = fs.statSync(new String(path));
            const fileSize = stat.size;
            const range = req.headers.range;
        
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1]
                ? parseInt(parts[1], 10)
                : fileSize-1;
        
                const chunksize = (end-start)+1;
                const file = fs.createReadStream(new String(path), {start, end});
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
                fs.createReadStream(new String(path)).pipe(res);
            }
        }
    });
}

const publish = (req, res) => {
    const token = req.query.token;
    const ip = req.ip;
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
}

const download = (req, res) => {
    const id = req.params.id;
    const path = paths.join(__dirname + "/../files/courses/videos/" + id + ".mp4");
    res.download(path);
}

module.exports = {
    stream,
    download,
    publish
}