import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
  try {
      // console.log("MONGODB_URL =", process.env.MONGODB_URL);
        console.log("DB_NAME =", DB_NAME);
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`,
    );
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`,
    );
  } catch (err) {
    console.log("MongoDB conncection error", err);
    process.exit(1);
  }
};

export default connectDB;
