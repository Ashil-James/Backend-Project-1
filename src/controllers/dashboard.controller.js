import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  /*
        1. Get current user id
        2. Aggregate videos:
            - total videos
            - total views
            - collect video ids
        3. Aggregate subscriptions:
            - total subscribers
        4. Aggregate likes:
            - likes on user's videos
        5. Return combined stats
    */

  const channelId = req.user._id;

  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      $groupby: {
        _id: null,
        totalVideos: {
          $sum: 1,
        },
        totalViews: {
          $sum: "$views",
        },
        videoIds: {
          $push: "$_id",
        },
      },
    },
  ]);

  const stats = videoStats[0] || {
    totalVideos: 0,
    totalViews: 0,
    videoIds: [],
  };

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  const totalLikes = await Like.countDocuments({
    video: {
      $in: stats.videoIds,
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos: stats.totalVideos,
        totalViews: stats.total,
        totalSubscribers,
        totalLikes,
      },

      "Stats Fetched Successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  /*
        1. Get current user id
        2. Find videos whose owner = current user
        3. Sort newest first
        4. Return videos
    */

  const channelId = req.user._id;

  const videos = await Video.find({
    owner: channelId,
  }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
