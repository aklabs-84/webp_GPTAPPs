
import { ConversionOptions } from '../types';

/**
 * Converts a file to WebP format in the browser.
 */
export const convertFileToWebP = (
  file: File,
  options: ConversionOptions
): Promise<{ blob: Blob; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                width: img.width,
                height: img.height,
              });
            } else {
              reject(new Error('Conversion to WebP failed'));
            }
          },
          'image/webp',
          options.quality
        );
      };
      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
};

/**
 * Utility to format byte sizes.
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
