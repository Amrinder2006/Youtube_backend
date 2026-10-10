
import ApiError from "../utlis/ApiError.js";
import { asyncHandler } from "../utlis/asyncHandler.js";

import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
export const VerifyJWT = asyncHandler(async (req, res,next) => {
  const token =
    req.cookies?.AccessToken ||
    req.header("Authorization")?.replace("Bearer", "");
  if (!token) throw new ApiError(401, "No Token Found");

  const decodetoken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
  if(!decodetoken) throw new ApiError(401,"Invalid Token")
    const user=await User.findById(decodetoken?._id).select("-password -refreshToken")
   if(!user) throw new ApiError(401,"Invalid Token")
    req.user=user;
next()
  
});
