// js/compositor.js
class Compositor {
    constructor() {
        this.layers = [];
        this.blendModes = {
            normal: 'source-over',
            add: 'lighter',
            multiply: 'multiply',
            screen: 'screen'
        };
    }
    
    addLayer(layer) {
        this.layers.push(layer);
    }
    
    removeLayer(layerId) {
        this.layers = this.layers.filter(layer => layer.id !== layerId);
    }
    
    async renderFrame(background, overlay, frameIndex) {
        const canvas = document.createElement('canvas');
        canvas.width = background.width;
        canvas.height = background.height;
        const ctx = canvas.getContext('2d');
        
        // Draw background frame
        const bgFrame = background.getFrame(frameIndex);
        if (bgFrame) {
            ctx.drawImage(bgFrame, 0, 0);
        }
        
        // Draw overlay
        if (overlay && overlay.visible) {
            overlay.draw(ctx, 0, 0, frameIndex);
        }
        
        return canvas;
    }
    
    async renderAnimation(background, overlay, totalFrames) {
        const frames = [];
        
        for (let i = 0; i < totalFrames; i++) {
            const frameCanvas = await this.renderFrame(background, overlay, i);
            const delay = background.getFrameDelay(i);
            
            frames.push({
                canvas: frameCanvas,
                delay: delay
            });
            
            // Yield to prevent blocking
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        return frames;
    }
}
