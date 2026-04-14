/**
 * Registry of all NPCs (suspects, victims) and weapons available in the game.
 * 
 * @author System Architect
 */

export type Role = 'suspect' | 'murderer' | 'victim';

export interface Weapon {
    name: string;
    texturePath: string;
    textureKey: string;
    isKillingWeapon: boolean;
}

export interface Suspect {
    id: string;
    name: string;
    role: Role;
    weapon: Weapon | null;
    texturePath: string;
    textureKey: string;
}

export interface Victim {
    id: string;
    name: string;
    role: Role;
    texturePath: string;
    textureKey: string;
}

export interface PlacedEntity {
    entity: Suspect | Victim | Weapon;
    tileX: number;
    tileY: number;
    roomId: number;
    type: 'suspect' | 'victim' | 'weapon';
}

export interface GameEntities {
    suspects: PlacedEntity[];
    victim: PlacedEntity;
    weapons: PlacedEntity[];
    murderer: Suspect;
    killingWeapon: Weapon;
}

/**
 * Registry of all available weapons.
 */
export const WEAPONS_REGISTRY: Omit<Weapon, 'isKillingWeapon'>[] = [
    { name: 'vela', texturePath: '/assets/weapons/candle.png', textureKey: 'weapon_candle' },
    { name: 'banana', texturePath: '/assets/weapons/banana.png', textureKey: 'weapon_banana' },
    { name: 'pedra', texturePath: '/assets/weapons/stone.png', textureKey: 'weapon_stone' },
    { name: 'machado', texturePath: '/assets/weapons/axe.png', textureKey: 'weapon_axe' },
    { name: 'arco', texturePath: '/assets/weapons/bow.png', textureKey: 'weapon_bow' },
    { name: 'death note', texturePath: '/assets/weapons/deathnote.png', textureKey: 'weapon_deathnote' },
    { name: 'granada', texturePath: '/assets/weapons/grenade.png', textureKey: 'weapon_grenade' },
    { name: 'pistola', texturePath: '/assets/weapons/gun.png', textureKey: 'weapon_gun' },
    { name: 'martelo', texturePath: '/assets/weapons/hammer.png', textureKey: 'weapon_hammer' },
    { name: 'faca', texturePath: '/assets/weapons/knife.png', textureKey: 'weapon_knife' },
    { name: 'frigideira', texturePath: '/assets/weapons/pan.png', textureKey: 'weapon_pan' },
    { name: 'veneno', texturePath: '/assets/weapons/poison.png', textureKey: 'weapon_poison' },
    { name: 'corda', texturePath: '/assets/weapons/rope.png', textureKey: 'weapon_rope' },
    { name: 'pá', texturePath: '/assets/weapons/shovel.png', textureKey: 'weapon_shovel' },
    { name: 'lança', texturePath: '/assets/weapons/spear.png', textureKey: 'weapon_spear' },
    { name: 'grampeador', texturePath: '/assets/weapons/stapler.png', textureKey: 'weapon_stapler' },
    { name: 'fita', texturePath: '/assets/weapons/tape.png', textureKey: 'weapon_tape' },
    { name: 'chave inglesa', texturePath: '/assets/weapons/wrench.png', textureKey: 'weapon_wrench' },
];

/**
 * Registry of all available suspects.
 * Naming convention: S[gender][skin]-[letter]
 * S = Suspect, F = Female, M = Male
 * W = White, A = Asian, B = Black
 */
export const SUSPECTS_REGISTRY: Omit<Suspect, 'role' | 'weapon'>[] = [
    // Female White
    { id: 'SFW-A', name: 'Amanda', texturePath: '/assets/npcs/SFW-A.png', textureKey: 'suspect_SFW-A' },
    { id: 'SFW-B', name: 'Bianca', texturePath: '/assets/npcs/SFW-B.png', textureKey: 'suspect_SFW-B' },
    { id: 'SFW-C', name: 'Clara', texturePath: '/assets/npcs/SFW-C.png', textureKey: 'suspect_SFW-C' },
    // Female Asian
    { id: 'SFA-D', name: 'Diana', texturePath: '/assets/npcs/SFA-D.png', textureKey: 'suspect_SFA-D' },
    { id: 'SFA-E', name: 'Eliana', texturePath: '/assets/npcs/SFA-E.png', textureKey: 'suspect_SFA-E' },
    { id: 'SFA-F', name: 'Fernanda', texturePath: '/assets/npcs/SFA-F.png', textureKey: 'suspect_SFA-F' },
    // Female Black
    { id: 'SFB-G', name: 'Gabriela', texturePath: '/assets/npcs/SFB-G.png', textureKey: 'suspect_SFB-G' },
    { id: 'SFB-H', name: 'Helena', texturePath: '/assets/npcs/SFB-H.png', textureKey: 'suspect_SFB-H' },
    { id: 'SFB-I', name: 'Isabela', texturePath: '/assets/npcs/SFB-I.png', textureKey: 'suspect_SFB-I' },
    // Male White
    { id: 'SMW-A', name: 'André', texturePath: '/assets/npcs/SMW-A.png', textureKey: 'suspect_SMW-A' },
    { id: 'SMW-B', name: 'Bruno', texturePath: '/assets/npcs/SMW-B.png', textureKey: 'suspect_SMW-B' },
    { id: 'SMW-C', name: 'Carlos', texturePath: '/assets/npcs/SMW-C.png', textureKey: 'suspect_SMW-C' },
    // Male Asian
    { id: 'SMA-D', name: 'Daniel', texturePath: '/assets/npcs/SMA-D.png', textureKey: 'suspect_SMA-D' },
    { id: 'SMA-E', name: 'Eduardo', texturePath: '/assets/npcs/SMA-E.png', textureKey: 'suspect_SMA-E' },
    { id: 'SMA-F', name: 'Felipe', texturePath: '/assets/npcs/SMA-F.png', textureKey: 'suspect_SMA-F' },
    // Male Black
    { id: 'SMB-G', name: 'Gustavo', texturePath: '/assets/npcs/SMB-G.png', textureKey: 'suspect_SMB-G' },
    { id: 'SMB-H', name: 'Henrique', texturePath: '/assets/npcs/SMB-H.png', textureKey: 'suspect_SMB-H' },
    { id: 'SMB-I', name: 'Igor', texturePath: '/assets/npcs/SMB-I.png', textureKey: 'suspect_SMB-I' },
];

/**
 * Registry of all available victims.
 * Naming convention: [gender][skin]
 * F = Female, M = Male
 * W = White, A = Asian, B = Black
 */
export const VICTIMS_REGISTRY: Omit<Victim, 'role'>[] = [
    // Female
    { id: 'FW', name: 'Valquíria', texturePath: '/assets/npcs/victims/FW.png', textureKey: 'victim_FW' },
    { id: 'FA', name: 'Victória', texturePath: '/assets/npcs/victims/FA.png', textureKey: 'victim_FA' },
    { id: 'FB', name: 'Valentina', texturePath: '/assets/npcs/victims/FB.png', textureKey: 'victim_FB' },
    // Male
    { id: 'MW', name: 'Valmor', texturePath: '/assets/npcs/victims/MW.png', textureKey: 'victim_MW' },
    { id: 'MA', name: 'Victor', texturePath: '/assets/npcs/victims/MA.png', textureKey: 'victim_MA' },
    { id: 'MB', name: 'Vinícius', texturePath: '/assets/npcs/victims/MB.png', textureKey: 'victim_MB' },
];
