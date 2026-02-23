
import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Fixed: Explicitly cast Array.from result to File[] to ensure the 'file' parameter in filter is not 'unknown'
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(file => 
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      onFilesAdded(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Fixed: Explicitly cast Array.from result to File[] to ensure the 'file' parameter in filter is not 'unknown'
      const files = (Array.from(e.target.files) as File[]).filter(file => 
        file.type.startsWith('image/')
      );
      onFilesAdded(files);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 
        transition-all duration-300 flex flex-col items-center justify-center gap-4
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-gray-700 hover:border-blue-500 hover:bg-gray-900'}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        multiple
        accept="image/*"
      />
      
      <div className={`p-4 rounded-full transition-transform duration-300 ${isDragging ? 'scale-110 bg-blue-500' : 'bg-gray-800 group-hover:bg-blue-600'}`}>
        <Upload className="w-8 h-8 text-white" />
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">이미지 파일을 드래그하거나 클릭하세요</h3>
        <p className="text-gray-400 text-sm">
          JPG, PNG, GIF 이미지들을 한 번에 여러 장 업로드할 수 있습니다.
        </p>
      </div>

      <div className="flex gap-2 mt-4 text-xs text-gray-500 uppercase tracking-widest">
        <span className="px-2 py-1 bg-gray-800 rounded">JPG</span>
        <span className="px-2 py-1 bg-gray-800 rounded">PNG</span>
        <span className="px-2 py-1 bg-gray-800 rounded">GIF</span>
        <span className="px-2 py-1 bg-gray-800 rounded">WEBP</span>
      </div>
    </div>
  );
};
