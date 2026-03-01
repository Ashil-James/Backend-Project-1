import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  const logFile = path.join(process.cwd(), "debug.log");
  try {
    if (!localFilePath) return null;
    const resolvedPath = path.resolve(localFilePath);
    fs.appendFileSync(
      logFile,
      `\n[${new Date().toISOString()}] Attempting upload: ${resolvedPath}`
    );

    const response = await cloudinary.uploader.upload(resolvedPath, {
      resource_type: "auto",
    });

    fs.appendFileSync(
      logFile,
      `\n[${new Date().toISOString()}] Uploaded to: ${response.url}`
    );

    if (fs.existsSync(resolvedPath)) {
      try {
        fs.unlinkSync(resolvedPath);
        fs.appendFileSync(
          logFile,
          `\n[${new Date().toISOString()}] Unlinked successfully: ${resolvedPath}`
        );
      } catch (err) {
        fs.appendFileSync(
          logFile,
          `\n[${new Date().toISOString()}] Unlink FAILED: ${err.message}`
        );
      }
    }
    return response;
  } catch (error) {
    fs.appendFileSync(
      logFile,
      `\n[${new Date().toISOString()}] Cloudinary ERROR: ${error.message}`
    );
    const resolvedPath = localFilePath ? path.resolve(localFilePath) : null;
    if (resolvedPath && fs.existsSync(resolvedPath)) {
      try {
        fs.unlinkSync(resolvedPath);
        fs.appendFileSync(
          logFile,
          `\n[${new Date().toISOString()}] Unlinked after error: ${resolvedPath}`
        );
      } catch (err) {
        fs.appendFileSync(
          logFile,
          `\n[${new Date().toISOString()}] Unlink after error FAILED: ${err.message}`
        );
      }
    }
    return null;
  }
};

export { uploadOnCloudinary };
