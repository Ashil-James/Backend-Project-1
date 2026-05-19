import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const addComment = asyncHandler(async (req, res) => {
  /*
        1. Get videoId
        2. Get content
        3. Validate ObjectId
        4. Validate content
        5. Check if video exists
        6. Create comment
        7. Return response
    */

  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  if (!content?.trim()) {
    throw new ApiError(404, "Content is Mandatory");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Not Found");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  /*
        1. Get commentId
        2. Get new content
        3. Validate ObjectId
        4. Validate content
        5. Find comment
        6. Check if comment exists
        7. Check ownership
        8. Update comment
        9. Return response
    */

  const { commentId } = req.params;
  const { newContent } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  if (!newContent?.trim()) {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment Not Found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized Access");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },

    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated Successfuly"));
});

const deleteComment = asyncHandler(async (req, res) => {
  /*
        1. Get commentId
        2. Validate ObjectId
        3. Find comment
        4. Check if comment exists
        5. Check ownership
        6. Delete comment
        7. Return response
    */

  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to delete the comment");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

const getVideoComments = asyncHandler(async (req, res) => {
  /*
        1. Get videoId
        2. Get page and limit
        3. Validate ObjectId
        4. Check if video exists
        5. Build aggregation pipeline
        6. Paginate aggregation
        7. Return response
    */

  const { videoId } = req.params;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (!isValidObjectId) {
    throw new ApiError(400, "Invalid video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const aggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },

    {
      $lookup: {
        from: "users",
        localFiled: "owner",
        foreignField: "_id",
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
        createdAt: -1,
      },
    },
  ]);

  const options = {
    page,
    limit,
  };

  const comments = await Comment.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(
      new ApiResponse(200, comments, "Video Comments Fetched Successfully")
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
