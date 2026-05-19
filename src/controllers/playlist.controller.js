import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  /*
        1. Get name and description
        2. Validate fields
        3. Create playlist
        4. Set owner = current user
        5. Return playlist
    */

  const { name, description } = req.body;

  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, "Name and Description are required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  /*
        1. Get userId
        2. Validate ObjectId
        3. Check if user exists
        4. Find playlists whose owner = userId
        5. Sort newest first
        6. Return playlists
    */

  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const playlists = await Playlist.find({
    owner: userId,
  }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User playlists fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  /*
        1. Get playlistId and videoId
        2. Validate ObjectIds
        3. Check playlist exists
        4. Check video exists
        5. Check ownership
        6. Push video into playlist.videos
        7. Return updated playlist
    */

  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Ids");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "Unauthorized to modify the playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: videoId,
      },
    },

    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  /*
        1. Get playlistId and videoId
        2. Validate ObjectIds
        3. Check playlist exists
        4. Check ownership
        5. Remove video from videos array
        6. Return updated playlist
    */

  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Ids");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to modify the playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },

    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  /*
        1. Get playlistId
        2. Validate ObjectId
        3. Find playlist
        4. Check if playlist exists
        5. Check ownership
        6. Delete playlist
        7. Return response
    */

  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to modify the playlist");
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist delted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, "Name and description are required");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to modify the playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },

    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

const getPlaylistsById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist id");
  }

  const playlist = await Playlist.findById(playlistId).populate(
    "videos",
    "title thumbnail duration views"
  );

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistsById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
