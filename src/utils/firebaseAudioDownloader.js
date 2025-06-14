import { storage } from "../../firebaseConfig";
import { getDownloadURL, ref } from "firebase/storage";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";

/**
 * Gets the remote URL for an audio file from Firebase Storage.
 * @param {string} firebasePath - The path in Firebase Storage (e.g., 'whiteNoises/sound1.mp3')
 * @returns {Promise<string>} - The remote URL of the file
 */
export const getAudioUrl = async (firebasePath) => {
  try {
    const fileRef = ref(storage, firebasePath);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error("❌ Error getting audio URL from Firebase:", error);
    throw error;
  }
};

/**
 * Checks if a file exists in local storage.
 * @param {string} localFileName - The file name to check (e.g., 'sound1.mp3')
 * @returns {Promise<{exists: boolean, uri: string|null}>} - Object indicating if file exists and its URI
 */
export const checkLocalAudioFile = async (localFileName) => {
  const localUri = FileSystem.documentDirectory + localFileName;
  try {
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    return { exists: fileInfo.exists, uri: fileInfo.exists ? localUri : null };
  } catch (error) {
    console.error("❌ Error checking local file:", error);
    return { exists: false, uri: null };
  }
};

/**
 * Downloads an audio file from Firebase Storage and saves it to device storage.
 * @param {string} firebasePath - The path in Firebase Storage (e.g., 'whiteNoises/sound1.mp3')
 * @param {string} localFileName - The file name to save locally (e.g., 'sound1.mp3')
 * @returns {Promise<string>} - The local URI of the saved file
 */
export const downloadAudioFromFirebase = async (firebasePath, localFileName) => {
  try {
    // Get download URL from Firebase Storage
    const url = await getAudioUrl(firebasePath);

    // Define local file path
    const localUri = FileSystem.documentDirectory + localFileName;

    // Download and save the file
    const downloadRes = await FileSystem.downloadAsync(url, localUri);
    return downloadRes.uri;
  } catch (error) {
    console.error("❌ Error downloading audio from Firebase:", error);
    throw error;
  }
};

/**
 * Starts downloading a file in the background while returning the remote URL for immediate streaming.
 * @param {string} firebasePath - The path in Firebase Storage
 * @param {string} localFileName - The file name to save locally
 * @param {Function} onProgress - Optional callback for download progress updates
 * @param {Function} onComplete - Optional callback when download completes
 * @returns {Promise<{streamingUrl: string, localUri: string}>} - Object with streaming URL and future local URI
 */
export const streamAndDownloadAudio = async (firebasePath, localFileName, onProgress, onComplete) => {
  try {
    // Get the remote URL for streaming
    const streamingUrl = await getAudioUrl(firebasePath);
    
    // Define where the file will be saved locally
    const localUri = FileSystem.documentDirectory + localFileName;
    
    // Check if file already exists locally
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    
    if (fileInfo.exists) {
      // File already exists, no need to download
      if (onComplete) onComplete(localUri);
      return { streamingUrl, localUri };
    }
    
    // Start background download
    const downloadResumable = FileSystem.createDownloadResumable(
      streamingUrl,
      localUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        if (onProgress) onProgress(progress);
      }
    );
    
    // Start the download without awaiting it
    downloadResumable.downloadAsync()
      .then(({ uri }) => {
        if (onComplete) onComplete(uri);
      })
      .catch(error => {
        console.error("❌ Background download failed:", error);
      });
    
    // Return immediately with streaming URL
    return { streamingUrl, localUri };
  } catch (error) {
    console.error("❌ Error in stream and download:", error);
    throw error;
  }
};