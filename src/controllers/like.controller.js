import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  /*
        1. Get videoId
        2. Validate ObjectId
        3. Check if video exists
        4. Check if user already liked video
        5. If like exists:
            remove it
        Else:
            create it
        6. Return response
    */

  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const exsistingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (exsistingLike) {
    await Like.findByIdAndDelete(exsistingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video unliked toggled successfully"));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video like toggled successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  /*
        1. Get commentId
        2. Validate ObjectId
        3. Check if comment exists
        4. Check if user already liked comment
        5. If already liked:
            remove like
        Else:
            create like
        6. Return response 
    */

  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(404, "Invalid CommentId");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const exsistingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (exsistingLike) {
    await Like.findByIdAndDelete(exsistingLike._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment unliked toggled successfully"));
  }

  await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment liked toggled successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid TweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet Not Found");
  }

  const exsistingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (exsistingLike) {
    await Like.findByIdAndDelete(exsistingLike._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet unliked toggled successfully"));
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet liked toggled successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  /*
        1. Find likes where likedBy = current user
        2. Only keep likes having video field
        3. Lookup video details
        4. Unwind video
        5. Return videos
    */

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: {
          $exists: true,
        },
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },

    {
      $unwind: "$video",
    },

    {
      $lookup: {
        from: "users",
        localField: "video.owner",
        foreignField: "_id",
        as: "video.owner",
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
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked Videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
