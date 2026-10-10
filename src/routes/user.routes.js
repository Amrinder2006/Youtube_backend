import { Router } from "express";
import {
  registeruser,
  loginuser,
  logoutUser,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.js";
import {VerifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registeruser,
);

router.route("/login").post(loginuser);

//secure Routes

router.route("/logout").post(VerifyJWT, logoutUser);

export default router;
