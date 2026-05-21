const mongoose = require("mongoose");

// connects to mongo and exits if it fails
async function initDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  }
}

module.exports = initDB;
