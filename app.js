// app.js - Main Application Controller
class MotionOverlayApp {
    constructor() {
        this.background = null;
        this.motionLayer = null;
        this.compositor = null;
        this.currentFrame = 0;
        this.isPlaying = false;
        this.animationId = null;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing Motion Overlay Pro...');
        
        // Initialize components
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        
        // Initialize modules
        this.gifLoader = new GifLoader();
        this.imageProcessor = new ImageProcessor();
        this.motionOverlay = new MotionOverlay();
        this.compositor = new Compositor();
        this.exportManager = new ExportManager();
        this.pathEditor = new PathEditor(this.canvas);
        this.uiManager = new UIManager(this);
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load example if needed
        await this.loadExample();
        
        console.log('App initialized successfully!');
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        if (this.background) {
            this.drawFrame();
        }
    }
    
    async loadBackground(file) {
        console.log('Loading background:', file.name);
        
        try {
            if (file.type === 'image/gif') {
                this.background = await this.gifLoader.loadGif(file);
            } else {
                this.background = await this.imageProcessor.loadImage(file);
            }
            
            // Initialize motion overlay with background
            this.motionOverlay.init(this.background);
            
            // Update UI
            this.uiManager.updateBackgroundInfo(this.background);
            
            // Draw first frame
            this.drawFrame();
            
            return true;
        } catch (error) {
            console.error('Error loading background:', error);
            this.uiManager.showError('Không thể tải file: ' + error.message);
            return false;
        }
    }
    
    drawFrame() {
        if (!this.background) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        const bgFrame = this.background.getFrame(this.currentFrame);
        if (bgFrame) {
            // Center the frame
            const x = (this.canvas.width - bgFrame.width) / 2;
            const y = (this.canvas.height - bgFrame.height) / 2;
            this.ctx.drawImage(bgFrame, x, y);
            
            // Draw motion overlay if active
            if (this.motionOverlay && this.motionOverlay.visible) {
                this.motionOverlay.draw(this.ctx, x, y, this.currentFrame);
            }
            
            // Draw path editor
            this.pathEditor.draw(this.ctx, x, y);
        }
    }
    
    play() {
        if (!this.background || this.isPlaying) return;
        
        this.isPlaying = true;
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        this.uiManager.updatePlayState(true);
    }
    
    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.uiManager.updatePlayState(false);
    }
    
    stop() {
        this.pause();
        this.currentFrame = 0;
        this.drawFrame();
        this.uiManager.updateTimeDisplay(0);
    }
    
    animate(timestamp) {
        if (!this.isPlaying) return;
        
        // Calculate next frame
        const fps = this.background.fps || 30;
        const frameTime = 1000 / fps;
        
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
        }
        
        const elapsed = timestamp - this.lastTimestamp;
        
        if (elapsed >= frameTime) {
            this.currentFrame = (this.currentFrame + 1) % this.background.totalFrames;
            this.drawFrame();
            this.lastTimestamp = timestamp;
            
            // Update UI
            this.uiManager.updateTimeDisplay(this.currentFrame);
        }
        
        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
    
    async export() {
        if (!this.background || !this.motionOverlay) {
            this.uiManager.showError('Vui lòng tải ảnh và tạo chuyển động trước');
            return;
        }
        
        try {
            this.uiManager.showExportProgress(0, 'Đang chuẩn bị xuất...');
            
            // Create compositor
            const frames = [];
            const totalFrames = this.background.totalFrames;
            
            for (let i = 0; i < totalFrames; i++) {
                // Update progress
                const progress = Math.round((i / totalFrames) * 100);
                this.uiManager.showExportProgress(progress, `Đang render frame ${i + 1}/${totalFrames}`);
                
                // Create frame canvas
                const frameCanvas = document.createElement('canvas');
                frameCanvas.width = this.background.width;
                frameCanvas.height = this.background.height;
                const frameCtx = frameCanvas.getContext('2d');
                
                // Draw background frame
                const bgFrame = this.background.getFrame(i);
                frameCtx.drawImage(bgFrame, 0, 0);
                
                // Draw motion overlay
                this.motionOverlay.draw(frameCtx, 0, 0, i);
                
                frames.push({
                    canvas: frameCanvas,
                    delay: this.background.getFrameDelay(i)
                });
                
                // Yield to prevent blocking
                if (i % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
            
            // Export as GIF
            this.uiManager.showExportProgress(95, 'Đang mã hóa GIF...');
            const blob = await this.exportManager.exportGif(frames);
            
            // Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `motion-overlay-${Date.now()}.gif`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.uiManager.showExportProgress(100, 'Xuất thành công!');
            
            setTimeout(() => {
                this.uiManager.hideExportProgress();
            }, 2000);
            
        } catch (error) {
            console.error('Export error:', error);
            this.uiManager.showError('Lỗi xuất file: ' + error.message);
            this.uiManager.hideExportProgress();
        }
    }
    
    setupEventListeners() {
        // File upload
        const fileInput = document.getElementById('file-input');
        const dropZone = document.querySelector('.drop-zone');
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.loadBackground(file);
        });
        
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                await this.loadBackground(file);
            }
        });
        
        // Playback controls
        document.getElementById('play-btn').addEventListener('click', () => this.play());
        document.getElementById('pause-btn').addEventListener('click', () => this.pause());
        document.getElementById('stop-btn').addEventListener('click', () => this.stop());
        
        // Export button
        document.getElementById('export-btn').addEventListener('click', () => this.export());
        
        // Timeline scrubber
        const scrubber = document.querySelector('.timeline-scrubber');
        scrubber.addEventListener('click', (e) => {
            const rect = scrubber.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = x / rect.width;
            this.currentFrame = Math.floor(percent * (this.background?.totalFrames || 1));
            this.drawFrame();
            this.uiManager.updateTimeDisplay(this.currentFrame);
        });
    }
    
    async loadExample() {
        // Load example GIF for demo
        try {
            const response = await fetch('https://i.giphy.com/media/3o7abAHdYvZdBNnGZq/giphy.gif');
            const blob = await response.blob();
            const file = new File([blob], 'example.gif', { type: 'image/gif' });
            await this.loadBackground(file);
        } catch (error) {
            console.log('Could not load example:', error);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MotionOverlayApp();
});
