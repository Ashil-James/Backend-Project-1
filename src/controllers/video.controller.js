import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { upload } from "../middlewares/multer.middleware.js";
import { getLikedVideos } from "./like.controller.js";
import { getWatchHistory } from "./user.controller.js";

const getAllVideos = asyncHandler(async (req, res) => {
  /*
        1. Parse page and limit
        2. Build match object dynamically
        3. Add search filter if query exists
        4. Add user filter if userId exists
        5. Aggregate:
            - match
            - lookup owner
            - unwind owner
            - sort
        6. Paginate
        7. Return results
    */

  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const match = {
    isPublished: true,
  };

  if (query) {
    match.$or = [
      {
        title: {
          $regex: query,
          $options: "i",
        },
      },

      {
        description: {
          $regex: query,
          $options: "i",
        },
      },
    ];
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user id");
    }

    match.owner = new mongoose.Types.ObjectId(userId);
  }

  const aggregate = Video.aggregate([
    {
      $match: match,
    },

    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignfield: "_id",
        as: "owner",

        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    {
      $unwind: "$owner",
    },

    {
      $sort: {
        [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1,
      },
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const videos = await Video.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and Description are required");
  }

  const videoFileLocalPath = req.files?.videoFiles?.[0].path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video File and thumbnail are required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile || !thumbnail) {
    throw new ApiError(500, "Error uploading files");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullName, avatar"
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  /*
        1. Get videoId
        2. Get title and description
        3. Get thumbnail local path
        4. Validate videoId
        5. Find video
        6. Check exists
        7. Check ownership
        8. Upload new thumbnail if provided
        9. Update fields
        10. Return updated video
    */

  const { videoId } = req.params;
  const { title, description } = req.body;

  const thumbnailLocalPath = req.file?.path;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to update video");
  }

  const updateFields = {};

  if (title?.trim()) {
    updateFields.title = title;
  }

  if (description?.trim()) {
    updateFields.description = description;
  }

  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
      throw new ApiError(500, "Error uploading thumbnail");
    }

    updateFields.thumbnail = thumbnail.url;
  }

  const updatedVideo = await Video.findByIdAndDelete(
    videoId,
    {
      $set: updateFields,
    },

    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to delete the video");
  }

  // Delete Cloudinary Video
  await deleteFromCloudinary(video.videoFile.public_id, "video");

  //Delete Cloudinaru Thumbnail

  await deleteFromCloudinary(video.thumbnail.public_id, "image");

  //Delete comments
  await Comment.deleteMany({
    video: videoId,
  });

  //Delete likes
  await Like.deleteMany({
    video: videoId,
  });

  //Remove Video From playlist
  await Playlist.updateMany(
    {},
    {
      $pull: {
        videos: videoId,
      },
    }
  );

  //Remove from Watch History
  await User.updateMany(
    {},
    {
      $pull: {
        getWatchHistory: videoId,
      },
    }
  );

  // remove videoDocument
  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  /*
        1. Get videoId
        2. Validate ObjectId
        3. Find video
        4. Check exists
        5. Check ownership
        6. Toggle isPublished
        7. Save/update
        8. Return updated video
    */

  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video status toggled successfully"));
});

const addToWatchHisotry = asyncHandler(async (req, res) => {
  /*
        1. Get videoId
        2. Validate ObjectId
        3. Check video exists
        4. Increment views
        5. Add to watchHistory
        6. Return response
    */

  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");

    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    // Increment the views

    await Video.findByIdAndUpdate(videoId, {
      $inc: {
        views: 1,
      },
    });

    // Add to Watch History

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: {
        watchHistory: videoId,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "video added to watch history"));
  }
});

export {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  addToWatchHisotry,
};
