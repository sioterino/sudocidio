/**
 * Registry of all furniture available in the game.
 * Defines furniture constraints for room placement and entity overlap rules.
 * 
 * @author System Architect
 */
import { RoomType } from './interfaces';

/**
 * Overlap constraint for furniture.
 * Defines what entities can be placed on top of the furniture.
 */
export enum OverlapType {
    /** No entities can be placed on this furniture */
    NONE = 0,
    /** Only NPCs (suspects/victims) can be placed on this furniture */
    NPC_ONLY = 1,
    /** Only weapons can be placed on this furniture */
    WEAPON_ONLY = 2,
    /** Both NPCs and weapons can be placed on this furniture */
    BOTH = 3,
}

/**
 * Size type for furniture pieces.
 * Standard furniture occupies 1 tile (32x32 pixels).
 * Large furniture occupies 2 tiles (64x32 or 32x64 pixels).
 */
export type FurnitureSize = '1x1' | '2x1' | '1x2';

/**
 * Orientation for multi-tile furniture.
 */
export type FurnitureOrientation = 'horizontal' | 'vertical';

/**
 * Furniture definition with placement constraints.
 */
export interface FurnitureDefinition {
    /** Unique identifier for this furniture type */
    id: string;
    /** Display name */
    name: string;
    /** Texture path(s) - single path for 1x1, array of [first, second] for multi-tile */
    texturePath: string | [string, string];
    /** Texture key(s) for Phaser */
    textureKey: string | [string, string];
    /** Size of the furniture */
    size: FurnitureSize;
    /** 
     * Room types where this furniture can be placed.
     * Use 0 to allow placement in ANY room.
     */
    allowedRooms: RoomType[] | 0;
    /** What entities can overlap with this furniture */
    overlap: OverlapType;
    /** Whether this furniture should be placed against walls */
    wallAligned: boolean;
    /** Weight for random selection (higher = more likely) */
    weight: number;
}

/**
 * Placed furniture instance on the map.
 */
export interface PlacedFurniture {
    furniture: FurnitureDefinition;
    /** Primary tile position (top-left for multi-tile) */
    tileX: number;
    tileY: number;
    /** Room ID where furniture is placed */
    roomId: number;
    /** Orientation for multi-tile furniture */
    orientation?: FurnitureOrientation;
}

/**
 * Registry of all available furniture.
 * Organized by categories for easier management.
 */
export const FURNITURE_REGISTRY: FurnitureDefinition[] = [
    // ══════════════════════════════════════════════════════════════════════════
    //  BEDROOM FURNITURE
    // ══════════════════════════════════════════════════════════════════════════
    {
        id: 'bed-v',
        name: 'cama',
        texturePath: ['/assets/furniture/32x64/bed-top.png', '/assets/furniture/32x64/bed-bottom.png'],
        textureKey: ['furniture_bed_top', 'furniture_bed_bottom'],
        size: '1x2',
        allowedRooms: [RoomType.BEDROOM],
        overlap: OverlapType.NPC_ONLY,
        wallAligned: true,
        weight: 10,
    },
    {
        id: 'bed-h',
        name: 'cama',
        texturePath: ['/assets/furniture/64x32/bed-left.png', '/assets/furniture/64x32/bed-right.png'],
        textureKey: ['furniture_bed_left', 'furniture_bed_right'],
        size: '2x1',
        allowedRooms: [RoomType.BEDROOM],
        overlap: OverlapType.NPC_ONLY,
        wallAligned: true,
        weight: 10,
    },
    {
        id: 'wardrobe',
        name: 'armário',
        texturePath: '/assets/furniture/wardrobe.png',
        textureKey: 'furniture_wardrobe',
        size: '1x1',
        allowedRooms: [RoomType.BEDROOM],
        overlap: OverlapType.NONE,
        wallAligned: true,
        weight: 8,
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  BATHROOM FURNITURE
    // ══════════════════════════════════════════════════════════════════════════
    {
        id: 'toilet',
        name: 'vaso sanitário',
        texturePath: '/assets/furniture/toilet.png',
        textureKey: 'furniture_toilet',
        size: '1x1',
        allowedRooms: [RoomType.BATHROOM],
        overlap: OverlapType.NONE,
        wallAligned: true,
        weight: 10,
    },
    {
        id: 'sink',
        name: 'pia',
        texturePath: '/assets/furniture/sink.png',
        textureKey: 'furniture_sink',
        size: '1x1',
        allowedRooms: [RoomType.BATHROOM],
        overlap: OverlapType.NONE,
        wallAligned: true,
        weight: 8,
    },
    {
        id: 'bathtub-v',
        name: 'banheira',
        texturePath: ['/assets/furniture/32x64/bathtub-top.png', '/assets/furniture/32x64/bathtub-bottom.png'],
        textureKey: ['furniture_bathtub_top', 'furniture_bathtub_bottom'],
        size: '1x2',
        allowedRooms: [RoomType.BATHROOM],
        overlap: OverlapType.NONE,
        wallAligned: true,
        weight: 5,
    },
    {
        id: 'bathtub-h',
        name: 'banheira',
        texturePath: ['/assets/furniture/64x32/bathtub-left.png', '/assets/furniture/64x32/bathtub-right.png'],
        textureKey: ['furniture_bathtub_left', 'furniture_bathtub_right'],
        size: '2x1',
        allowedRooms: [RoomType.BATHROOM],
        overlap: OverlapType.NONE,
        wallAligned: true,
        weight: 5,
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  KITCHEN FURNITURE
    // ══════════════════════════════════════════════════════════════════════════
    {
        id: 'fridge-v',
        name: 'geladeira',
        texturePath: ['/assets/furniture/32x64/fridge-top.png', '/assets/furniture/32x64/fridge-bottom.png'],
        textureKey: ['furniture_fridge_top', 'furniture_fridge_bottom'],
        size: '1x2',
        allowedRooms: [RoomType.KITCHEN],
        overlap: OverlapType.NONE,
        wallAligned: true,
        weight: 8,
    },
    {
        id: 'stove',
        name: 'fogão',
        texturePath: '/assets/furniture/stove.png',
        textureKey: 'furniture_stove',
        size: '1x1',
        allowedRooms: [RoomType.KITCHEN],
        overlap: OverlapType.NONE,
        wallAligned: true,
        weight: 10,
    },
    {
        id: 'kitchen-sink',
        name: 'pia de cozinha',
        texturePath: '/assets/furniture/kitchen-sink.png',
        textureKey: 'furniture_kitchen_sink',
        size: '1x1',
        allowedRooms: [RoomType.KITCHEN],
        overlap: OverlapType.NONE,
        wallAligned: true,
        weight: 8,
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  LIVING ROOM FURNITURE
    // ══════════════════════════════════════════════════════════════════════════
    {
        id: 'couch-h',
        name: 'sofá',
        texturePath: ['/assets/furniture/64x32/couch-left.png', '/assets/furniture/64x32/couch-right.png'],
        textureKey: ['furniture_couch_left', 'furniture_couch_right'],
        size: '2x1',
        allowedRooms: [RoomType.LIVING_ROOM],
        overlap: OverlapType.NPC_ONLY,
        wallAligned: false,
        weight: 10,
    },
    {
        id: 'armchair',
        name: 'poltrona',
        texturePath: '/assets/furniture/armchair.png',
        textureKey: 'furniture_armchair',
        size: '1x1',
        allowedRooms: [RoomType.LIVING_ROOM, RoomType.BEDROOM, RoomType.OFFICE],
        overlap: OverlapType.NPC_ONLY,
        wallAligned: false,
        weight: 5,
    },
    {
        id: 'bookshelf',
        name: 'estante',
        texturePath: '/assets/furniture/bookshelf.png',
        textureKey: 'furniture_bookshelf',
        size: '1x1',
        allowedRooms: [RoomType.LIVING_ROOM, RoomType.OFFICE, RoomType.BEDROOM],
        overlap: OverlapType.NONE,
        wallAligned: true,
        weight: 10,
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  OFFICE FURNITURE
    // ══════════════════════════════════════════════════════════════════════════
    {
        id: 'desk',
        name: 'escrivaninha',
        texturePath: '/assets/furniture/desk.png',
        textureKey: 'furniture_desk',
        size: '1x1',
        allowedRooms: [RoomType.OFFICE],
        overlap: OverlapType.WEAPON_ONLY,
        wallAligned: true,
        weight: 10,
    },
    {
        id: 'chair',
        name: 'cadeira',
        texturePath: '/assets/furniture/chair.png',
        textureKey: 'furniture_chair',
        size: '1x1',
        allowedRooms: [RoomType.OFFICE, RoomType.KITCHEN, RoomType.BEDROOM, RoomType.LIVING_ROOM],
        overlap: OverlapType.NPC_ONLY,
        wallAligned: false,
        weight: 8,
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  GARAGE FURNITURE
    // ══════════════════════════════════════════════════════════════════════════
    {
        id: 'car-v',
        name: 'carro',
        texturePath: ['/assets/furniture/32x64/car-top.png', '/assets/furniture/32x64/car-bottom.png'],
        textureKey: ['furniture_car_top', 'furniture_car_bottom'],
        size: '1x2',
        allowedRooms: [RoomType.GARAGE],
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 4,
    },
    {
        id: 'car-h',
        name: 'carro',
        texturePath: ['/assets/furniture/64x32/car-left.png', '/assets/furniture/64x32/car-right.png'],
        textureKey: ['furniture_car_left', 'furniture_car_right'],
        size: '2x1',
        allowedRooms: [RoomType.GARAGE],
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 4,
    },
    {
        id: 'tire',
        name: 'pneu',
        texturePath: '/assets/furniture/tire.png',
        textureKey: 'furniture_tire',
        size: '1x1',
        allowedRooms: [RoomType.GARAGE],
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 5,
    },
    {
        id: 'barrel',
        name: 'barril',
        texturePath: '/assets/furniture/barrel.png',
        textureKey: 'furniture_barrel',
        size: '1x1',
        allowedRooms: [RoomType.GARAGE, RoomType.YARD],
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 5,
    },
    {
        id: 'pallet',
        name: 'palete',
        texturePath: '/assets/furniture/pallet.png',
        textureKey: 'furniture_pallet',
        size: '1x1',
        allowedRooms: [RoomType.GARAGE, RoomType.YARD],
        overlap: OverlapType.WEAPON_ONLY,
        wallAligned: false,
        weight: 4,
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  YARD/GARDEN FURNITURE
    // ══════════════════════════════════════════════════════════════════════════
    {
        id: 'plant',
        name: 'planta',
        texturePath: '/assets/furniture/plant.png',
        textureKey: 'furniture_plant',
        size: '1x1',
        allowedRooms: 0,
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 6,
    },
    {
        id: 'daisy',
        name: 'margarida',
        texturePath: '/assets/furniture/daisy.png',
        textureKey: 'furniture_daisy',
        size: '1x1',
        allowedRooms: 0,
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 5,
    },
    {
        id: 'rose',
        name: 'rosa',
        texturePath: '/assets/furniture/rose.png',
        textureKey: 'furniture_rose',
        size: '1x1',
        allowedRooms: 0,
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 5,
    },
    {
        id: 'dead-flowerpot',
        name: 'vaso morto',
        texturePath: '/assets/furniture/dead-flowerpot.png',
        textureKey: 'furniture_dead_flowerpot',
        size: '1x1',
        allowedRooms: 0,
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 2,
    },
    {
        id: 'dry-flowerpot',
        name: 'vaso seco',
        texturePath: '/assets/furniture/dry-flowerpot.png',
        textureKey: 'furniture_dry_flowerpot',
        size: '1x1',
        allowedRooms: 0,
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 2,
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  UNIVERSAL FURNITURE (can go anywhere)
    // ══════════════════════════════════════════════════════════════════════════
    {
        id: 'table',
        name: 'mesa',
        texturePath: '/assets/furniture/table.png',
        textureKey: 'furniture_table',
        size: '1x1',
        allowedRooms: [RoomType.KITCHEN, RoomType.LIVING_ROOM, RoomType.BEDROOM], // any room
        overlap: OverlapType.WEAPON_ONLY,
        wallAligned: false,
        weight: 7,
    },
    {
        id: 'trashcan',
        name: 'lixeira',
        texturePath: '/assets/furniture/trashcan.png',
        textureKey: 'furniture_trashcan',
        size: '1x1',
        allowedRooms: [RoomType.YARD, RoomType.GARAGE], // any room
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 4,
    },
    {
        id: 'trashbin',
        name: 'cesto de lixo',
        texturePath: '/assets/furniture/trashbin.png',
        textureKey: 'furniture_trashbin',
        size: '1x1',
        allowedRooms: [RoomType.BATHROOM, RoomType.OFFICE, RoomType.KITCHEN],
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 3,
    },
    {
        id: 'trashbag',
        name: 'saco de lixo',
        texturePath: '/assets/furniture/trashbag.png',
        textureKey: 'furniture_trashbag',
        size: '1x1',
        allowedRooms: [RoomType.GARAGE, RoomType.YARD],
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 3,
    },
    {
        id: 'small-cardboardbox',
        name: 'caixa pequena',
        texturePath: '/assets/furniture/small-cardboardbox.png',
        textureKey: 'furniture_small_cardboardbox',
        size: '1x1',
        allowedRooms: [RoomType.GARAGE, RoomType.OFFICE],
        overlap: OverlapType.WEAPON_ONLY,
        wallAligned: false,
        weight: 4,
    },
    {
        id: 'big-cardboardbox',
        name: 'caixa grande',
        texturePath: '/assets/furniture/big-cardboardbox.png',
        textureKey: 'furniture_big_cardboardbox',
        size: '1x1',
        allowedRooms: [RoomType.GARAGE],
        overlap: OverlapType.NONE,
        wallAligned: false,
        weight: 4,
    },
];

/**
 * Get furniture definitions filtered by room type.
 */
export function getFurnitureForRoom(roomType: RoomType): FurnitureDefinition[] {
    return FURNITURE_REGISTRY.filter(f => 
        f.allowedRooms === 0 || 
        (Array.isArray(f.allowedRooms) && f.allowedRooms.indexOf(roomType) !== -1)
    );
}

/**
 * Get all texture keys from the furniture registry.
 */
export function getAllFurnitureTextureKeys(): { key: string; path: string }[] {
    const textures: { key: string; path: string }[] = [];
    
    for (const furniture of FURNITURE_REGISTRY) {
        if (Array.isArray(furniture.textureKey)) {
            const paths = furniture.texturePath as [string, string];
            textures.push({ key: furniture.textureKey[0], path: paths[0] });
            textures.push({ key: furniture.textureKey[1], path: paths[1] });
        } else {
            textures.push({ 
                key: furniture.textureKey, 
                path: furniture.texturePath as string 
            });
        }
    }
    
    return textures;
}
