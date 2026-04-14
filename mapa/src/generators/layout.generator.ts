import Random from '../core/random.core';
import type { Layout, RoomGroup } from '../types/interfaces';

class LayoutGenerator {

    private static readonly VALID_LAYOUTS: [number, number][] = [
        [3, 4], [4, 3],   // 12 cells → até 6 rooms
        [4, 4],           // 16 cells → até 7 rooms (capped)
        [3, 5], [5, 3],   // 15 cells → até 7 rooms
        [4, 5], [5, 4],   // 20 cells → até 7 rooms (capped)
    ];

    static generate(): Layout {
        const [cols, rows] = Random.pick(this.VALID_LAYOUTS);

        const maxCellWidth = Math.floor(19 / cols);
        const maxCellHeight = Math.floor(19 / rows);

        // Mínimo de 2, mas força cells menores pra caber mais rooms
        const cellWidth = Random.int(2, Math.min(maxCellWidth, 4));
        const cellHeight = Random.int(2, Math.min(maxCellHeight, 4));

        return { cols, rows, cellWidth, cellHeight };
    }

    static createInitialGroups(rows: number, cols: number): RoomGroup[] {
        const groups: RoomGroup[] = [];

        for (let row = 0; row < rows; row++)
            for (let col = 0; col < cols; col++)
                groups.push({
                    id: row * cols + col,
                    cells: [{ row, col }],
                    roomType: null as any
                });

        return groups;
    }
}

export default LayoutGenerator;