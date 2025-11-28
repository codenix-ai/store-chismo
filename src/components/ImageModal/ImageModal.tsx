'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Zoom } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import toast from 'react-hot-toast';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  productName?: string;
}

export function ImageModal({ isOpen, onClose, images, initialIndex = 0, productName = 'Producto' }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          swiper?.slidePrev();
          break;
        case 'ArrowRight':
          swiper?.slideNext();
          break;
        case 'z':
        case 'Z':
          setIsZoomed(!isZoomed);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, swiper, isZoomed, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${productName}-imagen-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Imagen descargada');
    } catch (error) {
      toast.error('Error al descargar la imagen');
    }
  };

  const handleShare = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${productName} - Imagen`,
          text: `Mira esta imagen de ${productName}`,
          url: imageUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(imageUrl);
        toast.success('URL copiada al portapapeles');
      } catch (error) {
        toast.error('Error al copiar URL');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-white font-medium">{productName}</h3>
            <span className="text-white text-sm opacity-75">
              {currentIndex + 1} / {images.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Zoom Toggle */}
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-all duration-200 text-white"
              aria-label={isZoomed ? 'Reducir zoom' : 'Hacer zoom'}
            >
              {isZoomed ? <ZoomOut className="w-4 h-4 text-black" /> : <ZoomIn className="w-4 h-4 text-black" />}
            </button>

            {/* Share */}
            <button
              onClick={() => handleShare(images[currentIndex])}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-all duration-200 text-white"
              aria-label="Compartir imagen"
            >
              <Share2 className="w-4 h-4 text-black" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-all duration-200 text-white"
              aria-label="Cerrar galería"
            >
              <X className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Swiper */}
      <div className="w-full h-full flex items-center justify-center p-4 pt-20 pb-16">
        <Swiper
          modules={[Navigation, Pagination, Zoom]}
          spaceBetween={20}
          slidesPerView={1}
          navigation={{
            prevEl: '.modal-swiper-button-prev',
            nextEl: '.modal-swiper-button-next',
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          zoom={isZoomed}
          initialSlide={initialIndex}
          onSwiper={setSwiper}
          onSlideChange={swiper => setCurrentIndex(swiper.activeIndex)}
          className="w-full h-full max-w-5xl max-h-full"
        >
          {images.map((imageUrl, index) => (
            <SwiperSlide key={index}>
              <div className="swiper-zoom-container w-full h-full flex items-center justify-center">
                <Image
                  src={imageUrl}
                  alt={`${productName} - Imagen ${index + 1}`}
                  width={1200}
                  height={1200}
                  className="max-w-full max-h-full object-contain"
                  quality={95}
                  priority={Math.abs(index - initialIndex) <= 1}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Buttons */}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black to-transparent p-4">
        <div className="flex items-center justify-center">
          <div className="text-white text-sm opacity-75 text-center">
            <p>Usa las flechas del teclado para navegar • Z para zoom • ESC para cerrar</p>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {/* You can add a loading state here if needed */}
    </div>
  );
}
