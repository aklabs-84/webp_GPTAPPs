
import React from 'react';
import { Download, Trash2, CheckCircle, Loader2, Info } from 'lucide-react';
import { ConvertedImage } from '../types';
import { formatBytes } from '../services/imageService';

interface ImageCardProps {
  image: ConvertedImage;
  onRemove: (id: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onRemove }) => {
  const reduction = image.status === 'completed' 
    ? Math.round(((image.originalSize - image.webpSize) / image.originalSize) * 100)
    : 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group hover:border-gray-600 transition-colors">
      <div className="aspect-square bg-gray-950 relative overflow-hidden flex items-center justify-center">
        {image.status === 'completed' ? (
          <img 
            src={image.webpUrl} 
            alt={image.originalName} 
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs text-gray-500">변환 중...</span>
          </div>
        )}
        
        {image.status === 'completed' && (
          <div className="absolute top-2 right-2 flex gap-2">
            <div className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <CheckCircle size={12} /> {reduction}% 감소
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-medium text-gray-200 truncate w-2/3" title={image.originalName}>
            {image.originalName}
          </h4>
          <button 
            onClick={() => onRemove(image.id)}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">원본 용량</span>
            <span className="text-gray-300">{formatBytes(image.originalSize)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">변환 용량</span>
            <span className={`font-semibold ${image.webpSize < image.originalSize ? 'text-green-400' : 'text-gray-300'}`}>
              {image.status === 'completed' ? formatBytes(image.webpSize) : '...'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">해상도</span>
            <span className="text-gray-300">{image.width} x {image.height}</span>
          </div>
        </div>

        {image.status === 'completed' && (
          <a
            href={image.webpUrl}
            download={image.originalName.replace(/\.[^/.]+$/, "") + ".webp"}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          >
            <Download size={16} /> 다운로드
          </a>
        )}
      </div>
    </div>
  );
};
