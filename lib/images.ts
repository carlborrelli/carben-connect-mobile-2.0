import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress and resize an image before uploading to Firebase Storage
 *
 * - Resizes to max 1600px width (maintains aspect ratio)
 * - Compresses to 75% JPEG quality
 * - Reduces file size significantly for faster uploads
 *
 * @param uri - Local file URI of the image
 * @returns Promise with compressed image URI
 */
export async function compressForUpload(uri: string): Promise<string> {
  try {
    console.log('[Images] Compressing image:', uri);

    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1600 } }],
      {
        compress: 0.75,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    console.log('[Images] Compression complete:', result.uri);
    return result.uri;
  } catch (error) {
    console.error('[Images] Compression failed:', error);
    // Return original URI if compression fails
    return uri;
  }
}

/**
 * Compress image for thumbnail/preview (smaller size)
 *
 * @param uri - Local file URI of the image
 * @returns Promise with thumbnail URI
 */
export async function createThumbnail(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 400 } }],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('[Images] Thumbnail creation failed:', error);
    return uri;
  }
}
