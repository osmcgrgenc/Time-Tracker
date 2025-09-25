'use client';

import React, { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  showSkeleton?: boolean;
  skeletonClassName?: string;
  containerClassName?: string;
  onLoadComplete?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder.svg',
  showSkeleton = true,
  skeletonClassName,
  containerClassName,
  className,
  onLoadComplete,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    onError?.();
  }, [currentSrc, fallbackSrc, onError]);

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {isLoading && showSkeleton && (
        <Skeleton 
          className={cn(
            'absolute inset-0 z-10',
            skeletonClassName
          )} 
        />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          hasError && 'grayscale',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

// Avatar component with optimized loading
export const OptimizedAvatar: React.FC<{
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ src, alt, size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <OptimizedImage
      src={src || '/images/default-avatar.svg'}
      alt={alt}
      width={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
      height={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
      className={cn(
        'rounded-full object-cover',
        sizeClasses[size],
        className
      )}
      fallbackSrc="/images/default-avatar.svg"
      priority={size === 'lg' || size === 'xl'}
    />
  );
};

// Logo component with optimized loading
export const OptimizedLogo: React.FC<{
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ variant = 'light', size = 'md', className }) => {
  const dimensions = {
    sm: { width: 120, height: 40 },
    md: { width: 180, height: 60 },
    lg: { width: 240, height: 80 }
  };

  return (
    <OptimizedImage
      src={`/images/logo-${variant}.svg`}
      alt="Verimly Logo"
      width={dimensions[size].width}
      height={dimensions[size].height}
      className={className}
      priority
      fallbackSrc="/images/logo-fallback.svg"
    />
  );
};

// Chart/Graph placeholder with optimized loading
export const OptimizedChartImage: React.FC<{
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}> = ({ src, alt, width, height, className }) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn('rounded-lg', className)}
      fallbackSrc="/images/chart-placeholder.svg"
      loading="lazy"
      quality={85}
    />
  );
};

// Background image with optimized loading
export const OptimizedBackgroundImage: React.FC<{
  src: string;
  alt: string;
  children: React.ReactNode;
  className?: string;
  overlay?: boolean;
}> = ({ src, alt, children, className, overlay = false }) => {
  return (
    <div className={cn('relative', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="100vw"
        priority
        quality={75}
      />
      {overlay && (
        <div className="absolute inset-0 bg-black/20" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Hook for image preloading
export const useImagePreloader = () => {
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (srcs: string[]): Promise<void> => {
    try {
      await Promise.all(srcs.map(preloadImage));
    } catch (error) {
      console.warn('Failed to preload some images:', error);
    }
  }, [preloadImage]);

  return { preloadImage, preloadImages };
};

// Image optimization utilities
export const ImageOptimizationUtils = {
  // Generate responsive image sizes
  generateSizes: (breakpoints: { [key: string]: number }) => {
    return Object.entries(breakpoints)
      .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}px`)
      .join(', ');
  },

  // Get optimal image quality based on device
  getOptimalQuality: () => {
    if (typeof window === 'undefined') return 75;
    
    const connection = (navigator as any).connection;
    if (connection) {
      if (connection.effectiveType === '4g') return 85;
      if (connection.effectiveType === '3g') return 65;
      if (connection.effectiveType === '2g') return 45;
    }
    
    return 75;
  },

  // Check if WebP is supported
  isWebPSupported: (): Promise<boolean> => {
    return new Promise((resolve) => {
      const webP = new window.Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  },

  // Get image format based on browser support
  getOptimalFormat: async (): Promise<'webp' | 'jpg'> => {
    const supportsWebP = await ImageOptimizationUtils.isWebPSupported();
    return supportsWebP ? 'webp' : 'jpg';
  }
};