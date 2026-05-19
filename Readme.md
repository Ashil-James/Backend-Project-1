# VideoTube Backend API

A professional Node.js backend for a video-sharing platform. The API supports user authentication, video publishing, comments, likes, playlists, subscriptions, tweets, dashboard analytics, watch history, and media uploads through Cloudinary.

## Features

- User registration and login with JWT-based authentication
- Access token and refresh token flow with secure HTTP-only cookies
- Avatar, cover image, video, and thumbnail uploads using Multer and Cloudinary
- Video publishing, updating, deleting, listing, and publish-status toggling
- Channel profile, subscriber, subscription, and watch-history support
- Comments, likes, playlists, and tweet-style community posts
- Dashboard endpoints for channel statistics and channel videos
- Centralized API response, error, and async-handler utilities
- MongoDB data modeling with Mongoose

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT, bcrypt
- **File Uploads:** Multer
- **Media Storage:** Cloudinary
- **Utilities:** cookie-parser, cors, dotenv
- **Development:** Nodemon, Prettier

## Project Structure

```txt
src/
  controllers/       Request handlers and business logic
  db/                MongoDB connection setup
  middlewares/       Authentication and file-upload middleware
  models/            Mongoose schemas and models
  routes/            API route definitions
  utils/             API error/response helpers and Cloudinary utilities
  app.js             Express app configuration
  constants.js       Application constants
  index.js           Application entry point
public/
  temp/              Temporary local upload storage
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- MongoDB Atlas account or local MongoDB instance
- Cloudinary account

### Installation

1. Clone the repository.

```bash
git clone <repository-url>
cd BackendProject-1
```

2. Install dependencies.

```bash
npm install
```

3. Create an environment file.

```bash
cp .env.sample .env
```

4. Update `.env` with your local values.

```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=<your-access-token-secret>
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=<your-refresh-token-secret>
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
```

The application connects to the `videotube` database using the configured `MONGODB_URI`.

### Run the Server

```bash
npm run dev
```

The server starts on the configured `PORT`, or `8000` by default.

## API Base URL

```txt
http://localhost:8000/api/v1
```

## Authentication

Protected routes require a valid access token. After login, the API sets `accessToken` and `refreshToken` cookies. Clients should send requests with credentials enabled.

For multipart routes, send data as `multipart/form-data`.

## API Endpoints

### Health Check

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/healthcheck` | Check API health |

### Users

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/user/register` | No | Register a user with `avatar` and optional `coverImage` |
| POST | `/user/login` | No | Log in with username/email and password |
| POST | `/user/logout` | Yes | Log out the current user |
| POST | `/user/refresh-token` | No | Generate a new access token |
| POST | `/user/change-password` | Yes | Change current user password |
| GET | `/user/current-user` | Yes | Get authenticated user details |
| PATCH | `/user/update-account` | Yes | Update full name and email |
| PATCH | `/user/avatar` | Yes | Update avatar image |
| PATCH | `/user/cover-image` | Yes | Update cover image |
| GET | `/user/c/:username` | Yes | Get a user's channel profile |
| GET | `/user/history` | Yes | Get watch history |

### Videos

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/video` | No | Get videos with pagination, search, sort, and user filters |
| POST | `/video` | Yes | Publish a video with `videoFile` and `thumbnail` uploads |
| GET | `/video/v/:videoId` | Yes | Get video details |
| PATCH | `/video/v/:videoId` | Yes | Update video title, description, or thumbnail |
| DELETE | `/video/v/:videoId` | Yes | Delete a video |
| PATCH | `/video/toggle/publish/:videoId` | Yes | Toggle video publish status |

### Comments

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/comments/:videoId` | Yes | Get paginated comments for a video |
| POST | `/comments/:videoId` | Yes | Add a comment to a video |
| PATCH | `/comments/c/:commentId` | Yes | Update a comment |
| DELETE | `/comments/c/:commentId` | Yes | Delete a comment |

### Likes

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/like/toggle/v/:videoId` | Yes | Like or unlike a video |
| POST | `/like/toggle/c/:commentId` | Yes | Like or unlike a comment |
| POST | `/like/toggle/t/:tweetId` | Yes | Like or unlike a tweet |
| GET | `/like/videos` | Yes | Get videos liked by the current user |

### Playlists

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/playlist` | Yes | Create a playlist |
| GET | `/playlist/:playlistId` | Yes | Get playlist details |
| PATCH | `/playlist/:playlistId` | Yes | Update playlist details |
| DELETE | `/playlist/:playlistId` | Yes | Delete a playlist |
| PATCH | `/playlist/add/:videoId/:playlistId` | Yes | Add a video to a playlist |
| PATCH | `/playlist/remove/:videoId/:playlistId` | Yes | Remove a video from a playlist |
| GET | `/playlist/user/:userId` | Yes | Get playlists created by a user |

### Subscriptions

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/subscriptions/c/:channelId` | Yes | Get subscribers of a channel |
| POST | `/subscriptions/c/:channelId` | Yes | Subscribe or unsubscribe from a channel |
| GET | `/subscriptions/u/:subscriberId` | Yes | Get channels subscribed to by a user |

### Tweets

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/tweets` | Yes | Create a tweet |
| GET | `/tweets/user/:userId` | Yes | Get tweets by user |
| PATCH | `/tweets/:tweetId` | Yes | Update a tweet |
| DELETE | `/tweets/:tweetId` | Yes | Delete a tweet |

### Dashboard

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/dashboard/stats` | Yes | Get channel statistics |
| GET | `/dashboard/videos` | Yes | Get videos owned by the channel |

## Common Request Fields

### Register User

```txt
fullName
email
username
password
avatar       file, required
coverImage   file, optional
```

### Login

```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password"
}
```

Use either `email` or `username` with `password`.

### Publish Video

```txt
title
description
videoFile    file, required
thumbnail    file, required
```

### Create Playlist

```json
{
  "name": "My Playlist",
  "description": "Playlist description"
}
```

### Create Comment or Tweet

```json
{
  "content": "Your content here"
}
```

## Development Notes

- Uploaded files are stored temporarily on disk and then uploaded to Cloudinary.
- Authentication middleware reads the JWT from cookies or the authorization header.
- API responses are returned through shared `ApiResponse` and `ApiError` utility classes.
- The project uses ES modules, so import/export syntax is used throughout the codebase.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with Nodemon |

## License

This project is licensed under the ISC License.
