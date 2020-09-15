const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

let dbURL = "mongodb://localhost/AfriteachDB";
if (process.env.NODE_ENV === "production") {
  dbURL = process.env.MONGODB_URL;
}

mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on("connected", () => {
  console.log(`Mongoose connected to ${dbURL}`);
});

mongoose.connection.on("error", (err) => {
  console.log("Mongoose connection error: ", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});
const gracefulShutdown = (msg, callback) => {
  mongoose.connection.close(() => {
    console.log(`Mongoose disconnected through ${msg}`);
    callback();
  });
};
// from nodemon restarts
process.once("SIGUSR2", () => {
  gracefulShutdown("nodemon restart", () => {
    process.kill(process.pid, "SIGUSR2");
  });
});
// App termination
process.on("SIGINT", () => {
  gracefulShutdown("App Termination", () => {
    process.exit(0);
  });
});
// Heroku App Termination
process.on("SIGTERM", () => {
  process.exit(0);
});
require("./users");
require("./courses");
