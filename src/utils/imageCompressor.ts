import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file significantly so it can be stored in localStorage
 * without exceeding browser quota limits.
 * Uses browser-image-compression with fallback to HTML5 Canvas.
 */
export async function compressImageFile(file: File): Promise<string> {
  const options = {
    maxSizeMB: 0.12, // ~120KB max
    maxWidthOrHeight: 800, // perfect for mobile jewelry inspection
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.72,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return await blobToBase64(compressedBlob);
  } catch (err) {
    console.warn('browser-image-compression failed, attempting canvas fallback:', err);
    return await compressWithCanvas(file, 800, 0.7);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Fallback compression using HTML5 Canvas
 */
function compressWithCanvas(file: File, maxDim = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
