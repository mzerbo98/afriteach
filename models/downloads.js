const mongoose = require("mongoose");

const downloadSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            default: Date.now
        },
        downloader: {
            type: mongoose.Types.ObjectId,
            ref: "User"
        },
        course: {
            type: mongoose.Types.ObjectId,
            ref: "Course"
        },
        ip_address: {
            type: String,
            trim: true,
        }
    }
);

mongoose.model("Download", downloadSchema);
