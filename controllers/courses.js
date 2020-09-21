const fs = require('fs');
const paths = require('path');
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

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
            console.log('course stream error', err);
            res.status(404).send('Course stream error');
        } else {
            const token = req.query.token;
            const ip = req.ip;
            let userId;
            if (token) {
                jwt.verify(token, accessTokenSecret, (err, user) => {
                    if (err) {
                        console.log('token error');
                        userId = null;
                    } else {
                        userId = user._id;
                    }
                });
            }
            
            const view = new View();
            view.viewer = userId;
            view.course = courseId;
            view.ip_address = ip;
            view.save(function(err){
                console.log('view save error', err);
            });
        
            const path = paths.join(__dirname + course.videoUrl);
            const stat = fs.statSync(path)
            const fileSize = stat.size
            const range = req.headers.range
        
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-")
                const start = parseInt(parts[0], 10)
                const end = parts[1]
                ? parseInt(parts[1], 10)
                : fileSize-1
        
                const chunksize = (end-start)+1
                const file = fs.createReadStream(path, {start, end})
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                }
        
                res.writeHead(206, head)
                file.pipe(res)
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                }
                res.writeHead(200, head)
                fs.createReadStream(path).pipe(res)
            }
        }
    });
}


const download = (req, res) => {
    const id = req.params.id;
    const path = paths.join(__dirname + '/../files/courses/videos/' + id + '.mp4');
    res.download(path);
}

module.exports = {
    stream,
    download
}