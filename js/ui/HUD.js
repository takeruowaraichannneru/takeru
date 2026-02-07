export default class HUD {
    constructor(gameWidth, gameHeight) {
        this.width = gameWidth;
        this.height = gameHeight;
    }

    draw(ctx, players) {
        const p1 = players[0];
        const p2 = players[1];

        // Panel Backgrounds
        this.drawPlayerPanel(ctx, p1, 100, this.height - 100);
        this.drawPlayerPanel(ctx, p2, this.width - 300, this.height - 100);
    }

    drawPlayerPanel(ctx, player, x, y) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, 200, 80);

        // Border matching player color
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, 200, 80);

        // Percentage
        ctx.fillStyle = this.getPercentageColor(player.percentage);
        ctx.font = 'bold 40px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(player.percentage)}%`, x + 100, y + 50);

        // Stocks (Circles for simplicity)
        for (let i = 0; i < player.stocks; i++) {
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(x + 20 + (i * 20), y - 15, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getPercentageColor(percentage) {
        if (percentage < 50) return '#ffffff';
        if (percentage < 100) return '#ffd700'; // Yellow
        return '#ff4d4d'; // Red
    }
}
