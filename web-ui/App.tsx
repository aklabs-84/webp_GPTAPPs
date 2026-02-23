
import React, { useState, useEffect, useCallback } from 'react';
import { Download, Trash2, Settings, Zap, Github, Image as ImageIcon, Info, HelpCircle, ShieldCheck, MousePointerClick, Layers, ChevronRight } from 'lucide-react';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import { Dropzone } from './components/Dropzone';
import { ImageCard } from './components/ImageCard';
import { ConvertedImage, ConversionOptions } from './types';
import { convertFileToWebP } from './services/imageService';

const App: React.FC = () => {
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [quality, setQuality] = useState(0.8);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const handleFilesAdded = async (files: File[]) => {
    setIsProcessing(true);
    
    // Create placeholders for the UI
    const newItems: ConvertedImage[] = files.map(file => ({
      id: uuidv4(),
      originalName: file.name,
      originalSize: file.size,
      webpBlob: new Blob(),
      webpUrl: '',
      webpSize: 0,
      width: 0,
      height: 0,
      status: 'processing'
    }));

    setImages(prev => [...newItems, ...prev]);

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const placeholder = newItems[i];

      try {
        const { blob, width, height } = await convertFileToWebP(file, { quality });
        
        setImages(prev => prev.map(img => 
          img.id === placeholder.id 
            ? {
                ...img,
                webpBlob: blob,
                webpUrl: URL.createObjectURL(blob),
                webpSize: blob.size,
                width,
                height,
                status: 'completed'
              }
            : img
        ));
      } catch (error) {
        console.error('Conversion failed:', error);
        setImages(prev => prev.map(img => 
          img.id === placeholder.id 
            ? { ...img, status: 'error' }
            : img
        ));
      }
    }
    
    setIsProcessing(false);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.webpUrl) URL.revokeObjectURL(img.webpUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach(img => {
      if (img.webpUrl) URL.revokeObjectURL(img.webpUrl);
    });
    setImages([]);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const completedImages = images.filter(img => img.status === 'completed');
    
    if (completedImages.length === 0) return;

    completedImages.forEach(img => {
      const fileName = img.originalName.replace(/\.[^/.]+$/, "") + ".webp";
      zip.file(fileName, img.webpBlob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `converted_images_${new Date().getTime()}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const completedCount = images.filter(img => img.status === 'completed').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-semibold mb-4">
          <Zap size={16} /> Client-Side Processing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
          WebP 마스터
        </h1>
        <p className="text-xl text-blue-200/80 font-medium mb-6">
          "서버 업로드 없이 브라우저 내에서 안전하고 빠르게 이미지를 WebP로 변환하는 초경량 도구입니다."
        </p>
        <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
          웹 사이트 속도를 높이는 가장 효율적인 방법을 경험하세요. 
          사용자의 모든 데이터는 기기 외부로 유출되지 않습니다.
        </p>
      </header>

      {/* Intro Guide Section */}
      <section className="mb-12">
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-400 transition-colors mb-4 ml-auto"
        >
          {showGuide ? '가이드 숨기기' : '도움말 및 특징 보기'}
          <HelpCircle size={16} />
        </button>

        {showGuide && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* How to Use */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-blue-400">
                <MousePointerClick size={20} /> 사용 방법
              </h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">1</span>
                  <span><strong>파일 업로드</strong>: 변환하고 싶은 이미지를 드래그하거나 중앙 영역을 클릭하여 선택하세요.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">2</span>
                  <span><strong>품질 설정</strong>: 우측 '변환 설정' 슬라이더를 통해 파일 용량과 화질의 균형을 맞추세요.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">3</span>
                  <span><strong>결과 확인</strong>: 변환 리스트에서 용량 감소율과 미리보기를 실시간으로 확인하세요.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">4</span>
                  <span><strong>저장하기</strong>: 개별 다운로드 버튼 또는 'ZIP 다운로드'를 눌러 결과물을 저장하세요.</span>
                </li>
              </ul>
            </div>

            {/* Features */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-emerald-400">
                <ShieldCheck size={20} /> 주요 특징
              </h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-3">
                  <Zap size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>100% 클라이언트 사이드</strong>: 이미지가 서버로 업로드되지 않아 개인정보가 완벽히 보호됩니다.</span>
                </li>
                <li className="flex gap-3">
                  <Layers size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>강력한 일괄 변환</strong>: 수십 장의 이미지를 동시에 업로드하고 한 번에 WebP로 변환할 수 있습니다.</span>
                </li>
                <li className="flex gap-3">
                  <Info size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>효율적인 압축</strong>: 고품질을 유지하면서도 JPG/PNG 대비 최대 80% 이상의 용량을 절감합니다.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-[18px] flex-shrink-0 flex justify-center text-emerald-500 mt-0.5 font-bold">₩</div>
                  <span><strong>완전 무료 & 무제한</strong>: 사용량 제한이나 비용 결제 없이 브라우저에서 즉시 사용 가능합니다.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Main Controls */}
      <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 mb-8 shadow-2xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <Dropzone onFilesAdded={handleFilesAdded} />
          </div>
          
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 bg-gray-950 rounded-2xl border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-blue-500" />
                  <span className="font-semibold">변환 설정</span>
                </div>
                <span className="text-sm font-bold text-blue-400">{Math.round(quality * 100)}%</span>
              </div>
              
              <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">품질 (Quality)</label>
              <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.05" 
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-1"
              />
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>낮은 용량</span>
                <span>고품질</span>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                * 품질이 높을수록 선명하지만 파일 용량이 커집니다. 
                <br />* 보통 0.8(80%)이 가장 효율적입니다.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={downloadAll}
                disabled={completedCount === 0}
                className="w-full py-4 bg-white text-gray-950 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Download size={20} /> {completedCount}개 파일 ZIP 다운로드
              </button>
              <button 
                onClick={clearAll}
                disabled={images.length === 0}
                className="w-full py-3 bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all text-sm"
              >
                <Trash2 size={18} /> 모두 삭제
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Image Grid */}
      {images.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ImageIcon className="text-blue-500" />
              변환 리스트 ({images.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map(image => (
              <ImageCard 
                key={image.id} 
                image={image} 
                onRemove={removeImage}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {images.length === 0 && !isProcessing && (
        <div className="py-20 flex flex-col items-center justify-center text-gray-600">
          <div className="p-6 bg-gray-900/50 rounded-full mb-4">
             <ImageIcon size={48} className="opacity-20" />
          </div>
          <p>리스트가 비어있습니다. 이미지를 추가해보세요!</p>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-24 pt-12 border-t border-gray-900">
        {/* AKLABS Promotion Card */}
        <div className="flex justify-center mb-12">
          <a 
            href="https://litt.ly/aklabs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full max-w-xl bg-white rounded-[2.5rem] p-6 flex items-center justify-between group hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-blue-500/5"
          >
            <div className="pl-4">
              <h4 className="text-[#1a1c24] text-xl font-bold mb-1">
                나만의 AI 웹앱을 만들고 싶다면?
              </h4>
              <p className="text-[#5b5fff] text-lg font-bold">
                아크랩스에서 AI 마스터가 되어보세요
              </p>
            </div>
            <div className="w-14 h-14 bg-[#12141c] rounded-2xl flex items-center justify-center group-hover:bg-[#5b5fff] transition-colors duration-300">
              <ChevronRight className="text-white w-8 h-8" />
            </div>
          </a>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-6 mb-4 font-medium">
            <a href="#" className="hover:text-blue-400 transition-colors">이용 약관</a>
            <a href="#" className="hover:text-blue-400 transition-colors">개인정보 처리방침</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
              <Github size={16} /> GitHub
            </a>
          </div>
          <p className="opacity-60">&copy; 2024 WebP Master. All rights reserved. 100% Client-side Processing.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
