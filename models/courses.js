const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        level: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        language: {
            type: String,
            required: true,
            trim: true,
        },
        thumbnailUrl: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);