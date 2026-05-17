import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  /*
        1. Get channelId
        2. Validate ObjectId
        3. Prevent self-subscription
        4. Check if channel(user) exists
        5. Check if subscription already exists
        6. If exists:
            unsubscribe
        Else:
            subscribe
        7. Return response
    */

  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  if (channelId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel not Found");
  }

  const exsistingSubscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (exsistingSubscription) {
    await Subscription.findByIdAndDelete(exsistingSubscription._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Channel unsubscribed sucessfully"));
  }

  await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Channel subscribed sucessfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  /*
        1. Get channelId
        2. Validate ObjectId
        3. Check if channel exists
        4. Find subscriptions where channel = channelId
        5. Lookup subscriber details
        6. Return subscribers
    */

  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel doesnt exsist");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
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
      $unwind: "$subscriber",
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "Channel Subscribers fetched Sucessfully"
      )
    );
});

//controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  /*
        1. Get subscriberId
        2. Validate ObjectId
        3. Check if subscriber exists
        4. Find subscriptions where subscriber = subscriberId
        5. Lookup channel details
        6. Unwind channel
        7. Return channels
    */

  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Subscriber Id");
  }

  const subscriber = await User.findById(subscriberId);

  if (!subscriber) {
    throw new ApiError(404, "Subscriber doesnt exsist");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
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
      $unwind: "$channel",
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched sucessfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
