// HD image optimizer for email broadcasts
// Resizes to 2x Retina max-width (1200px) and applies high quality canvas compression
// Dramatically reduces byte size (up to 95%) while preserving crystal clear HD fidelity

export interface ImageOptimizationResult {
    blob: Blob;
    file: File;
    previewUrl: string;
    dataUrl: string;
    originalSize: number;
    optimizedSize: number;
    width: number;
    height: number;
    compressionRatio: number;
}

export async function optimizeEmailImage(file: File): Promise<ImageOptimizationResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const maxDim = 1200;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas rendering context unavailable'));
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                const isPng = file.type === 'image/png';
                const outputType = isPng ? 'image/png' : 'image/jpeg';
                const quality = isPng ? undefined : 0.90;

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Image optimization failed'));
                            return;
                        }
                        const ext = isPng ? '.png' : '.jpg';
                        const cleanName = file.name.replace(/\.[^.]+$/, '') + ext;
                        const optimizedFile = new File([blob], cleanName, {
                            type: outputType,
                        });
                        const previewUrl = URL.createObjectURL(blob);
                        const dataUrl = canvas.toDataURL(outputType, quality);
                        const ratio = Math.round((1 - blob.size / file.size) * 100);

                        resolve({
                            blob,
                            file: optimizedFile,
                            previewUrl,
                            dataUrl,
                            originalSize: file.size,
                            optimizedSize: blob.size,
                            width,
                            height,
                            compressionRatio: Math.max(0, ratio),
                        });
                    },
                    outputType,
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to parse image file'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });
}

export function formatBytes(bytes: number, decimals: number = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
