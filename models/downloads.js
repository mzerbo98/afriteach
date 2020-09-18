const mongoose = require("mongoose");

const viewSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
            default: Date.now
        },
        userId: {
            type: String,
        },
        videoId: {
            type: String,
            required: true,
        },
        ip_address: {
            type: String,
            trim: true,
        }
    }
);