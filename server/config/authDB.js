const mongoose = require("mongoose");

const connectDB = async () => {
  try {
await mongoose.connect(
  "mongodb+srv://recipeUser:recipe123@cluster0.oczyss3.mongodb.net/?appName=Cluster0"
);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("DB connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
