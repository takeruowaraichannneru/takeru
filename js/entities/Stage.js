export default class Stage {
    constructor(gameWidth, gameHeight) {
        // Create a central platform
        this.platforms = [
            {
                x: gameWidth * 0.2,
                y: gameHeight * 0.65,
                width: gameWidth * 0.6,
                height: 20,
                color: '#0f3460'
            }
        ];
    }

    draw(ctx) {
        ctx.fillStyle = this.platforms[0].color;
        this.platforms.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.width, p.height);

            // Highlight top edge
            ctx.fillStyle = '#e94560';
            ctx.fillRect(p.x, p.y, p.width, 2);
        });
    }
}
