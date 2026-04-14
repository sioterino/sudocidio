import { Scene } from 'phaser';

class CameraController {

    constructor(
        private scene: Scene,
        private getLayer: () => Phaser.Tilemaps.TilemapLayer | null
    ) {}

    centerMap(mapWidth: number, mapHeight: number): void {
        const layer = this.getLayer();
        if (!layer) return;

        const screenW = this.scene.cameras.main.width;
        const screenH = this.scene.cameras.main.height;
        const mapPixelsW = mapWidth * 16;
        const mapPixelsH = mapHeight * 16;

        const scaleX = (screenW * 0.85) / mapPixelsW;
        const scaleY = (screenH * 0.85) / mapPixelsH;
        const scale = Math.min(scaleX, scaleY, 4);

        layer.setScale(scale);
        layer.setPosition(
            (screenW - mapPixelsW * scale) / 2,
            (screenH - mapPixelsH * scale) / 2
        );

        this.scene.cameras.main.setBounds(0, 0, screenW, screenH);
        this.scene.cameras.main.setScroll(0, 0);
    }

}

export default CameraController