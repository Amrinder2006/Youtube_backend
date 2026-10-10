import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config({ path: "./src/.env" });

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

const timestamp = Math.floor(Date.now() / 1000);
const signature = crypto
  .createHash("sha1")
  .update(`timestamp=${timestamp}${secret}`)
  .digest("hex");

const form = new FormData();
form.append("file", "https://res.cloudinary.com/demo/image/upload/sample.jpg");
form.append("api_key", key);
form.append("timestamp", String(timestamp));
form.append("signature", signature);

const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
  method: "POST",
  body: form,
});

console.log("STATUS:", res.status);
console.log("BODY:", await res.text());