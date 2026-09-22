import sharp from "sharp";

/**
 * Optimizes, rotates, and clarifies an image buffer or base64 string.
 * - Respects EXIF orientation so mobile photos aren't flipped
 * - Applies subtle adaptive sharpening for clarity
 * - Compresses into high-quality JPEG (quality 85)
 * 
 * @param {Buffer|string} input - Image buffer or base64 string (with or without data URI prefix)
 * @returns {Promise<{ buffer: Buffer, dataUri: string, width: number, height: number, format: string, size: number }>}
 */
export const processCapturedImage = async (input) => {
  try {
    let inputBuffer;

    if (Buffer.isBuffer(input)) {
      inputBuffer = input;
    } else if (typeof input === "string") {
      // Check if it has a data URI scheme like data:image/jpeg;base64,...
      const base64Data = input.includes(",") ? input.split(",")[1] : input;
      inputBuffer = Buffer.from(base64Data, "base64");
    } else {
      throw new Error("Invalid input format for image processing: expected Buffer or string");
    }

    const processedBuffer = await sharp(inputBuffer)
      .rotate() // Automatically orient based on EXIF
      .sharpen({
        sigma: 1.0,
        m1: 1.0,
        m2: 2.0,
        x1: 2,
        y2: 10,
        y3: 20,
        m3: 0,
      })
      .jpeg({
        quality: 85,
        mozjpeg: true,
      })
      .toBuffer();

    const metadata = await sharp(processedBuffer).metadata();

    const dataUri = `data:image/jpeg;base64,${processedBuffer.toString("base64")}`;

    return {
      buffer: processedBuffer,
      dataUri,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: "jpeg",
      size: processedBuffer.length,
    };
  } catch (error) {
    console.error("Image processing error (sharp):", error);
    throw error;
  }
};
