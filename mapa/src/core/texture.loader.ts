import { Scene } from 'phaser';
import { RoomType, RoomTypeMetaMap } from '../types/interfaces';
import { WEAPONS_REGISTRY, SUSPECTS_REGISTRY, VICTIMS_REGISTRY } from '../types/npc.registry';
import { getAllFurnitureTextureKeys } from '../types/furniture.registry';

class TextureLoader {
    constructor(private scene: Scene) {}

    loadAll(): void {
        this.loadRooms();
        this.loadWeapons();
        this.loadSuspects();
        this.loadVictims();
        this.loadFurniture();
    }

    private loadRooms(): void {
        const roomTypes = [RoomType.BEDROOM, RoomType.OFFICE, RoomType.BATHROOM, RoomType.KITCHEN, RoomType.LIVING_ROOM, RoomType.GARAGE, RoomType.YARD];
        
        roomTypes.forEach(roomType => {
            const meta = RoomTypeMetaMap[roomType];
            this.scene.load.image(`tile_${roomType}`, meta.texturePath);
        });
    }

    private loadWeapons(): void {
        WEAPONS_REGISTRY.forEach(weapon => {
            this.scene.load.image(weapon.textureKey, weapon.texturePath);
        });
    }

    private loadSuspects(): void {
        SUSPECTS_REGISTRY.forEach(suspect => {
            this.scene.load.image(suspect.textureKey, suspect.texturePath);
        });
    }

    private loadVictims(): void {
        VICTIMS_REGISTRY.forEach(victim => {
            this.scene.load.image(victim.textureKey, victim.texturePath);
        });
    }

    private loadFurniture(): void {
        const textures = getAllFurnitureTextureKeys();
        textures.forEach(({ key, path }) => {
            this.scene.load.image(key, path);
        });
    }
}

export default TextureLoader
