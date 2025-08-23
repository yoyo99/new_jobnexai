/**
 * Image optimization utilities for JobNexAI
 * Provides optimized image loading and format detection
 */

// Check if browser supports WebP
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Check if browser supports AVIF
export const supportsAVIF = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

// Generate optimized image URLs based on browser support
export const getOptimizedImageUrl = async (
  originalUrl: string,
  width?: number,
  height?: number
): Promise<string> => {
  // In a real application, this would call your image optimization service
  // For now, we'll return the original URL with potential query parameters
  const url = new URL(originalUrl, window.location.origin);
  
  if (width) url.searchParams.set('w', width.toString());
  if (height) url.searchParams.set('h', height.toString());
  
  // Check for modern format support
  const [webpSupported, avifSupported] = await Promise.all([
    supportsWebP(),
    supportsAVIF()
  ]);
  
  if (avifSupported) {
    url.searchParams.set('format', 'avif');
  } else if (webpSupported) {
    url.searchParams.set('format', 'webp');
  }
  
  return url.toString();
};

// Generate responsive image srcSet
export const generateSrcSet = async (
  baseUrl: string,
  sizes: number[] = [640, 768, 1024, 1280, 1920]
): Promise<string> => {
  const srcSetEntries = await Promise.all(
    sizes.map(async (size) => {
      const optimizedUrl = await getOptimizedImageUrl(baseUrl, size);
      return `${optimizedUrl} ${size}w`;
    })
  );
  
  return srcSetEntries.join(', ');
};

// Preload critical images
export const preloadImage = (src: string, priority: boolean = false): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  
  if (priority) {
    link.setAttribute('fetchpriority', 'high');
  }
  
  document.head.appendChild(link);
};

// Image size optimization based on device
export const getOptimalImageSize = (): { width: number; height: number } => {
  const { innerWidth, innerHeight, devicePixelRatio } = window;
  
  // Calculate optimal size based on viewport and pixel ratio
  const optimalWidth = Math.min(innerWidth * devicePixelRatio, 1920);
  const optimalHeight = Math.min(innerHeight * devicePixelRatio, 1080);
  
  return {
    width: Math.round(optimalWidth),
    height: Math.round(optimalHeight)
  };
};

// Lazy loading observer configuration
export const createImageObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px 0px',
    threshold: 0.01,
    ...options
  };
  
  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, defaultOptions);
};

// Image compression utility (for uploaded files)
export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          // Fallback: create a basic blob from canvas data
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          fetch(dataUrl).then(res => res.blob()).then(resolve)
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Performance metrics for image loading
export const trackImagePerformance = (
  src: string,
  startTime: number = performance.now()
): void => {
  const img = new Image();
  
  img.onload = () => {
    const loadTime = performance.now() - startTime;
    
    // Send performance data to analytics
    if ('web-vitals' in window) {
      console.log(`Image loaded: ${src} in ${loadTime.toFixed(2)}ms`);
      
      // You can integrate with your analytics service here
      // analytics.track('image_load_time', { src, loadTime });
    }
  };
  
  img.src = src;
};