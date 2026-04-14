export type PieceType = 'SUSPECT' | 'WEAPON';

export interface Piece {
  id: string;      
  type: PieceType;
}

export interface Cell {
  x: number;
  y: number;
  roomId: string;   
  pieceId?: string; 
}

export interface Room {
  id: string;
  name: string;
  cells: { x: number; y: number }[]; 
}

export interface BoardState {
  cells: Cell[];
  availablePieces: Piece[]; 
}

export interface MatchState {
  matchId: string;
  players: string[]; 
  board: BoardState; 
  hiddenAnswer: {    
    killerId: string;
    weaponId: string;
    roomId: string;
  };
}