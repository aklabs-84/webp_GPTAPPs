
export interface ConvertedImage {
  id: string;
  originalName: string;
  originalSize: number;
  webpBlob: Blob;
  webpUrl: string;
  webpSize: number;
  width: number;
  height: number;
  status: 'processing' | 'completed' | 'error';
}

export interface ConversionOptions {
  quality: number;
}
