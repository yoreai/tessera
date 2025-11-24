// Upload fire safety data to Vercel Blob
// Usage: BLOB_READ_WRITE_TOKEN=your_token node upload-blob.js

import { put } from "@vercel/blob";
import { readFile } from "fs/promises";

async function uploadData() {
  try {
    console.log("📤 Uploading corrected_fire_alarms.csv to Vercel Blob...");
    
    const filePath = "../../notebooks/project_3_data_story_final/data/corrected_fire_alarms.csv";
    const fileContent = await readFile(filePath, "utf-8");
    
    const blob = await put("fire-safety/corrected_fire_alarms.csv", fileContent, {
      access: "public",
    });

    console.log("✅ Upload successful!");
    console.log("📍 Blob URL:", blob.url);
    console.log("");
    console.log("Next steps:");
    console.log("1. Copy this URL");
    console.log("2. Update app/api/data/route.ts with the URL");
    console.log("3. Redeploy to Vercel");
    
    return blob.url;
  } catch (error) {
    console.error("❌ Upload failed:", error);
    process.exit(1);
  }
}

uploadData();

