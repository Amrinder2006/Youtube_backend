import { asyncHandler } from "../utlis/asyncHandler.js";
import ApiError from "../utlis/ApiError.js";
import { User } from "../models/user.models.js";
import uploadcloud from "../utlis/Cloudinary.js";
import ApiResponse from "../utlis/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessRefreshToken = async (user_id) => {
  try {
    const user = await User.findById(user_id);
    if (!user) throw new ApiError(409, "No valid user");
    const AccessToken = user.GenerateAccessToken();
    const RefreshToken = user.GenerateRefreshToken();
    user.refreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });
    return { AccessToken, RefreshToken };
  } catch (error) {
    console.log("Error", error);
  }
};
const registeruser = asyncHandler(async (req, resp) => {
  const { fullName, username, password, email } = req.body;
  if (
    [fullName, username, email, password].some(
      (field) => !field || field?.trim() === "",
    )
  ) {
    throw new ApiError(404, "All Field not present");
  }
  const existed = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existed) throw new ApiError(409, "Already Existed User");
  console.log("Avatar", req.files?.avatar[0]);
  const avatarPath = req.files?.avatar[0]?.path;
  const coverImagePath = req.files?.coverImage?.[0]?.path;
  if (!avatarPath) throw new ApiError(500, "No Avatar Image");
  console.log(avatarPath);
  console.log(coverImagePath);
  const avatar = await uploadcloud(avatarPath);
  console.log(avatar);
  const coverImage = await uploadcloud(coverImagePath);
  if (!avatar) throw new ApiError(500, "Server Error Occurs");
  console.log("Avatar", avatar);

  const user = await User.create({
    username,
    email,
    password,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createduser = await User.findById(user?._id).select(
    "-password -refreshToken",
  );

  if (!createduser) throw new ApiError(500, "No New User Created");
  console.log("Done");
  return resp
    .status(201)
    .json(new ApiResponse(201, createduser, "User Created"));
});

const loginuser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username && !email) throw new ApiError(409, "Invalid Credentials");

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) throw new ApiError(409, "No user Found");
  const isPass = await user.isPasswordCorrect(password);
  if (!isPass) throw new ApiError(409, "Password Not Matched");
  const { AccessToken, RefreshToken } = await generateAccessRefreshToken(
    user._id,
  );
  const loggedin = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("AccessToken", AccessToken, options)
    .cookie("RefreshToken", RefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedin, AccessToken, RefreshToken },
        "User Logged in",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(201)
    .clearCookie("AccessToken", undefined)
    .clearCookie("RefreshToken", undefined)
    .json(new ApiResponse(201, user, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingrefresh = req.cookies.RefreshToken || req.body.RefreshToken;
  if (!incomingrefresh) throw new ApiError(401, "No Refresh Token Found");

  try {
    const decodedtoken = jwt.verify(
      incomingrefresh,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decodedtoken?._id);
    if (!user) throw new ApiError(401, "Invalid Refresh Token");
    if (incomingrefresh !== user?.refreshToken) {
      throw new ApiError(401, "Unmatched or Expired Refresh Token");
    }
    const { AccessToken, RefreshToken } =await  generateAccessRefreshToken(user?._id);
    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("AccessToken", AccessToken, options)
      .cookie("RefreshToken", RefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { AccessToken, RefreshToken },
          "Refresh Token Refreshed",
        ),
      );
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
});
export { registeruser, loginuser, logoutUser,refreshAccessToken };
