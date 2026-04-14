import Random from '../../core/random.core';
import type { RoomGroup, GridCell } from '../../types/interfaces';

class RoomMerger {

    private static readonly MIN_ROOM_CELLS = 2;
    private static readonly MIN_ROOMS = 3;
    private static readonly MAX_ROOMS = 7;

    static merge(groups: RoomGroup[], rows: number, cols: number): RoomGroup[] {
    const targetCount = Math.min(this.MAX_ROOMS, Math.floor(groups.length / this.MIN_ROOM_CELLS));
    let mergesNeeded = groups.length - targetCount;
    let currentGroups = [...groups];

    while (mergesNeeded > 0) {
        const adjacent = this.findAdjacentPairs(currentGroups, rows, cols);
        if (adjacent.length === 0) break;

        // Mergear o par com MENOS cells combinadas → rooms equilibrados
        const pair = adjacent.reduce((best, curr) => {
            const currSize = curr[0].cells.length + curr[1].cells.length;
            const bestSize = best[0].cells.length + best[1].cells.length;
            return currSize < bestSize ? curr : best;
        });

        const [groupA, groupB] = pair;
        // Mergear o menor no maior
        if (groupA.cells.length >= groupB.cells.length)
            this.mergeGroups(currentGroups, groupA.id, groupB.id);
        else
            this.mergeGroups(currentGroups, groupB.id, groupA.id);

        mergesNeeded--;
    }

    return currentGroups.filter(g => g.cells.length > 0);
}

    private static fixUndersizedRooms(groups: RoomGroup[], rows: number, cols: number): RoomGroup[] {
        let changed = true;

        while (changed) {
            changed = false;

            const undersized = groups.find(g => g.cells.length < this.MIN_ROOM_CELLS);
            if (!undersized) break;

            if (groups.length <= this.MIN_ROOMS) break;

            const allPairs = this.findAdjacentPairs(groups, rows, cols);
            const neighbors = allPairs
                .filter(([a, b]) => a.id === undersized.id || b.id === undersized.id)
                .map(([a, b]) => a.id === undersized.id ? b : a);

            if (neighbors.length === 0) break;

            const target = neighbors.reduce((best, g) =>
                g.cells.length > best.cells.length ? g : best
            );

            this.mergeGroups(groups, target.id, undersized.id);
            groups = groups.filter(g => g.cells.length > 0);
            changed = true;
        }

        return groups;
    }

    private static findAdjacentPairs(groups: RoomGroup[], rows: number, cols: number): [RoomGroup, RoomGroup][] {
        const pairs: [RoomGroup, RoomGroup][] = [];
        const seen = new Set<string>();

        for (const group of groups) {
            for (const cell of group.cells) {
                const neighbors = this.getNeighbors(cell, rows, cols);

                for (const neighbor of neighbors) {
                    const neighborGroup = groups.find(g =>
                        g.cells.some(c => c.row === neighbor.row && c.col === neighbor.col)
                    );

                    if (neighborGroup && neighborGroup.id !== group.id) {
                        const key = [group.id, neighborGroup.id].sort().join(',');
                        if (!seen.has(key)) {
                            seen.add(key);
                            pairs.push([group, neighborGroup]);
                        }
                    }
                }
            }
        }

        return pairs;
    }

    private static getNeighbors(cell: GridCell, rows: number, cols: number): GridCell[] {
        const neighbors: GridCell[] = [];
        if (cell.col + 1 < cols) neighbors.push({ row: cell.row, col: cell.col + 1 });
        if (cell.row + 1 < rows) neighbors.push({ row: cell.row + 1, col: cell.col });
        return neighbors;
    }

    private static mergeGroups(groups: RoomGroup[], targetId: number, sourceId: number): void {
        const target = groups.find(g => g.id === targetId);
        const source = groups.find(g => g.id === sourceId);

        if (target && source) {
            target.cells.push(...source.cells);
            source.cells = [];
        }
    }
}

export default RoomMerger;