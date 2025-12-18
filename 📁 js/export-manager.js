// js/export-manager.js
class ExportManager {
    constructor() {
        this.worker = null;
        this.isExporting = false;
    }
    
    async exportGif(frames, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const gif = new GIF({
                    workers: 4,
                    quality: options.quality || 10,
                    width: frames[0].canvas.width,
                    height: frames[0].canvas.height,
                    workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
                });
                
                // Add frames to GIF
                frames.forEach(frame => {
                    gif.addFrame(frame.canvas, {
                        delay: frame.delay,
                        copy: true
                    });
                });
                
                gif.on('finished', blob => {
                    resolve(blob);
                });
                
                gif.on('progress', progress => {
                    // You can update progress UI here
                    console.log('GIF progress:', progress);
                });
                
                gif.render();
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async exportMp4(frames, options = {}) {
        // Note: MP4 export requires FFmpeg.wasm and is heavier
        // This is a placeholder for future implementation
        throw new Error('MP4 export not implemented in browser version');
    }
    
    async exportPngSequence(frames, options = {}) {
        // Export as ZIP of PNG files
        const JSZip = window.JSZip;
        if (!JSZip) {
            throw new Error('JSZip library required for PNG sequence export');
        }
        
        const zip = new JSZip();
        
        frames.forEach((frame, index) => {
            const dataUrl = frame.canvas.toDataURL('image/png');
            const base64Data = dataUrl.split(',')[1];
            zip.file(`frame-${String(index).padStart(4, '0')}.png`, base64Data, { base64: true });
        });
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        return zipBlob;
    }
}
