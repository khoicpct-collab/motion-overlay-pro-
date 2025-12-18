// js/motion-overlay.js
class MotionOverlay {
    constructor() {
        this.particles = [];
        this.effects = [];
        this.mask = null;
        this.visible = true;
        this.opacity = 1.0;
        this.blendMode = 'normal';
        
        // Default settings
        this.settings = {
            particleCount: 200,
            particleSize: { min: 2, max: 8 },
            speed: 1.0,
            direction: { x: 1, y: 0 },
            spread: 0.5,
            lifetime: 100,
            color: '#6366f1'
        };
    }
    
    init(background) {
        this.background = background;
        this.createParticles();
    }
    
    createParticles() {
        this.particles = [];
        
        const { width, height } = this.background;
        
        for (let i = 0; i < this.settings.particleCount; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * this.settings.speed * 2,
                vy: (Math.random() - 0.5) * this.settings.speed * 2,
                size: this.settings.particleSize.min + 
                      Math.random() * (this.settings.particleSize.max - this.settings.particleSize.min),
                color: this.settings.color,
                life: this.settings.lifetime,
                maxLife: this.settings.lifetime
            });
        }
    }
    
    update(frameIndex) {
        // Update particles based on current frame
        this.particles.forEach(particle => {
            // Apply direction
            particle.x += particle.vx + this.settings.direction.x * this.settings.speed;
            particle.y += particle.vy + this.settings.direction.y * this.settings.speed;
            
            // Boundary check
            if (particle.x < 0 || particle.x > this.background.width) {
                particle.vx *= -0.8;
                particle.x = Math.max(0, Math.min(particle.x, this.background.width));
            }
            
            if (particle.y < 0 || particle.y > this.background.height) {
                particle.vy *= -0.8;
                particle.y = Math.max(0, Math.min(particle.y, this.background.height));
            }
            
            // Apply mask if exists
            if (this.mask && !this.isPointInMask(particle.x, particle.y)) {
                this.resetParticle(particle);
            }
            
            // Update lifetime
            particle.life--;
            if (particle.life <= 0) {
                this.resetParticle(particle);
            }
        });
    }
    
    resetParticle(particle) {
        particle.x = Math.random() * this.background.width;
        particle.y = Math.random() * this.background.height;
        particle.life = particle.maxLife;
    }
    
    isPointInMask(x, y) {
        if (!this.mask) return true;
        
        // Simple circle mask for demo
        const centerX = this.mask.x || this.background.width / 2;
        const centerY = this.mask.y || this.background.height / 2;
        const radius = this.mask.radius || Math.min(this.background.width, this.background.height) / 3;
        
        const dx = x - centerX;
        const dy = y - centerY;
        return dx * dx + dy * dy <= radius * radius;
    }
    
    draw(ctx, offsetX = 0, offsetY = 0, frameIndex = 0) {
        if (!this.visible) return;
        
        // Update particles for this frame
        this.update(frameIndex);
        
        // Save context state
        ctx.save();
        
        // Apply blend mode
        ctx.globalCompositeOperation = this.blendMode;
        ctx.globalAlpha = this.opacity;
        
        // Draw particles
        this.particles.forEach(particle => {
            ctx.fillStyle = particle.color;
            
            // Calculate particle alpha based on lifetime
            const alpha = particle.life / particle.maxLife;
            ctx.globalAlpha = this.opacity * alpha;
            
            ctx.beginPath();
            ctx.arc(
                offsetX + particle.x,
                offsetY + particle.y,
                particle.size,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });
        
        // Restore context
        ctx.restore();
    }
    
    setDirection(angle) {
        const rad = angle * Math.PI / 180;
        this.settings.direction = {
            x: Math.cos(rad),
            y: Math.sin(rad)
        };
    }
    
    setMask(maskData) {
        this.mask = maskData;
    }
}
