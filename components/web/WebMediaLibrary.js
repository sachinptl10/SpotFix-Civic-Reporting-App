/**
 * Web-compatible implementation of expo-media-library.
 * In desktop/mobile web browsers, saving to library downloads the photo/video.
 */
export const requestPermissionsAsync = async () => {
  return { status: 'granted', granted: true, canAskAgain: true };
};

export const getPermissionsAsync = async () => {
  return { status: 'granted', granted: true, canAskAgain: true };
};

export const saveToLibraryAsync = async (uri) => {
  if (typeof window !== 'undefined' && uri) {
    try {
      const a = document.createElement('a');
      a.href = uri;
      a.download = `spotfix_report_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.warn('[WebMediaLibrary] Download failed:', err);
    }
  }
  return true;
};

export const createAssetAsync = async (uri) => {
  await saveToLibraryAsync(uri);
  return { id: `asset_${Date.now()}`, uri };
};

export const createAlbumAsync = async (albumName, asset) => {
  return { id: `album_${Date.now()}`, title: albumName };
};

export default {
  requestPermissionsAsync,
  getPermissionsAsync,
  saveToLibraryAsync,
  createAssetAsync,
  createAlbumAsync,
};
