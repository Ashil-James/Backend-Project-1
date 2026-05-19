import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  addToWatchHisotry,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .getAllVideos(getAllVideos)
  .post(
    verifyJWT,
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },

      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

router
  .route("/v/:videoId")
  .get(verifyJWT, getVideoById)
  .delete(verifyJWT, deleteVideo)
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router;
