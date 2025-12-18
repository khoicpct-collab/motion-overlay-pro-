// js/path-editor.js
class PathEditor {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.points = [];
        this.isDrawing = false;
        this.currentTool = 'pen';
        
        this.setupCanvasEvents();
    }
    
    setupCanvasEvents() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
    }
    
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.startDrawing(x, y);
    }
    
    onMouseMove(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.addPoint(x, y);
    }
    
    onMouseUp() {
        if (this.isDrawing) {
            this.endDrawing();
        }
    }
    
    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.startDrawing(x, y);
    }
    
    onTouchMove(e) {
        e.preventDefault();
        if (!this.isDrawing) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.addPoint(x, y);
    }
    
    onTouchEnd(e) {
        e.preventDefault();
        if (this.isDrawing) {
            this.endDrawing();
        }
    }
    
    startDrawing(x, y) {
        this.isDrawing = true;
        this.points = [{ x, y }];
        
        // Show direction arrows at starting point
        this.showDirectionArrows(x, y);
    }
    
    addPoint(x, y) {
        if (!this.isDrawing) return;
        
        this.points.push({ x, y });
        this.drawPreview();
    }
    
    endDrawing() {
        if (this.points.length < 2) {
            this.clear();
            return;
        }
        
        this.isDrawing = false;
        
        // Convert points to smooth path
        const path = this.createSmoothPath(this.points);
        
        // Create mask from path
        const mask = this.createMaskFromPath(path);
        
        // Hide direction arrows
        this.hideDirectionArrows();
        
        // Notify app about new mask
        if (window.app && window.app.motionOverlay) {
            window.app.motionOverlay.setMask(mask);
        }
        
        console.log('Path completed with', this.points.length, 'points');
    }
    
    drawPreview() {
        // This will be drawn in the main app draw loop
    }
    
    draw(ctx, offsetX, offsetY) {
        if (this.points.length < 2) return;
        
        ctx.save();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Draw path
        ctx.beginPath();
        ctx.moveTo(offsetX + this.points[0].x, offsetY + this.points[0].y);
        
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(offsetX + this.points[i].x, offsetY + this.points[i].y);
        }
        
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = '#ffffff';
        this.points.forEach(point => {
            ctx.beginPath();
            ctx.arc(offsetX + point.x, offsetY + point.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    createSmoothPath(points) {
        // Simple path smoothing
        if (points.length < 3) return points;
        
        const smoothed = [points[0]];
        
        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];
            
            smoothed.push({
                x: (prev.x + curr.x + next.x) / 3,
                y: (prev.y + curr.y + next.y) / 3
            });
        }
        
        smoothed.push(points[points.length - 1]);
        return smoothed;
    }
    
    createMaskFromPath(path) {
        // For demo, create a circular mask around path center
        if (path.length === 0) return null;
        
        // Calculate center
        let sumX = 0, sumY = 0;
        path.forEach(p => {
            sumX += p.x;
            sumY += p.y;
        });
        
        const centerX = sumX / path.length;
        const centerY = sumY / path.length;
        
        // Calculate approximate radius
        let maxDist = 0;
        path.forEach(p => {
            const dx = p.x - centerX;
            const dy = p.y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            maxDist = Math.max(maxDist, dist);
        });
        
        return {
            x: centerX,
            y: centerY,
            radius: maxDist,
            type: 'circle'
        };
    }
    
    showDirectionArrows(x, y) {
        // This would create 8 direction arrows around the point
        // For now, we'll just log
        console.log('Show direction arrows at', x, y);
    }
    
    hideDirectionArrows() {
        console.log('Hide direction arrows');
    }
    
    clear() {
        this.points = [];
        this.isDrawing = false;
        this.hideDirectionArrows();
    }
}
