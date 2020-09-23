const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();


const dbURL  = process.env.MONGODB_URL;


mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

mongoose.connection.on("connected", () => {
  //console.log(`Mongoose connected to ${dbURL}`);
});

const gracefulShutdown = (msg, callback) => {
  mongoose.connection.close(() => {
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
