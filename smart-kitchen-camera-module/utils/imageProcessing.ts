/**
 * Image Preprocessing Pipeline
 */

export interface ProcessedImage {
    base64: string;
    width: number;
    height: number;
    sizeKB: number;
}

export interface PreprocessOptions {
    maxWidth?: number;       // Max width, default 1920
    maxHeight?: number;      // Max height, default 1080
    quality?: number;        // Compression quality 0-1, default 0.85
    autoEnhance?: boolean;   // Auto enhance, default true
    targetSizeKB?: number;   // Target size, default 500KB
}

/**
 * Preprocess a single image
 */
export async function preprocessImage(
    imageFile: File | Blob,
    options: PreprocessOptions = {}
): Promise<ProcessedImage> {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.85,
        autoEnhance = true,
        targetSizeKB = 500
    } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
        }

        img.onload = () => {
            // 1. Calculate scale ratio
            let { width, height } = img;
            const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            canvas.width = width;
            canvas.height = height;

            // 2. Draw and apply enhancement
            ctx.drawImage(img, 0, 0, width, height);

            if (autoEnhance) {
                applyAutoEnhance(ctx, width, height);
            }

            // 3. Compress to target size
            let currentQuality = quality;
            let base64 = canvas.toDataURL('image/jpeg', currentQuality);
            let sizeKB = getBase64SizeKB(base64);

            // Iteratively compress until target size
            while (sizeKB > targetSizeKB && currentQuality > 0.3) {
                currentQuality -= 0.1;
                base64 = canvas.toDataURL('image/jpeg', currentQuality);
                sizeKB = getBase64SizeKB(base64);
            }

            // Clean up object URL
            URL.revokeObjectURL(img.src);

            resolve({
                base64: base64.split(',')[1],  // Remove data:image/jpeg;base64, prefix
                width,
                height,
                sizeKB
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };

        img.src = URL.createObjectURL(imageFile);
    });
}

/**
 * Auto enhance: adjust brightness, contrast
 */
function applyAutoEnhance(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Calculate average brightness
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
        totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = totalBrightness / (data.length / 4);

    // Adjust brightness if too dark
    const brightnessAdjust = avgBrightness < 100 ? 1.3 : avgBrightness > 200 ? 0.9 : 1;

    // Contrast enhancement
    const contrastFactor = 1.1;

    for (let i = 0; i < data.length; i += 4) {
        // Brightness adjustment
        data[i] = clamp(data[i] * brightnessAdjust);
        data[i + 1] = clamp(data[i + 1] * brightnessAdjust);
        data[i + 2] = clamp(data[i + 2] * brightnessAdjust);

        // Contrast adjustment
        data[i] = clamp((data[i] - 128) * contrastFactor + 128);
        data[i + 1] = clamp((data[i + 1] - 128) * contrastFactor + 128);
        data[i + 2] = clamp((data[i + 2] - 128) * contrastFactor + 128);
    }

    ctx.putImageData(imageData, 0, 0);
}

function clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
}

function getBase64SizeKB(base64: string): number {
    return Math.round((base64.length * 3) / 4 / 1024);
}
