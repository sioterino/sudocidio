import Random from '../../core/random.core';
import { type RoomGroup, RoomType, type GridCell } from '../../types/interfaces';

/**
 * Assigns room types (Quarto, Sala, etc.) to merged room groups.
 * Ensures each room gets a unique type by shuffling and distributing
 * all available room types across the final room groups.
 * 
 * @author System Architect
 * 
 * Guarantees
 * - No duplicate room types in a single map generation
 * - All 7 room types are used exactly once (when there are 7 rooms)
 * - When fewer than 7 rooms, a random subset is used
 * - LIVING_ROOM and OFFICE are never adjacent to each other
 * 
 * @see {@link RoomMerger} for room group creation
 * @see {@link TilemapBuilder} for pixel-level type application
 */
class RoomTypeAssigner {

    /**
     * Complete list of all available room types.
     * 
     * Used as the source pool for type assignment.
     * 
     * @constant
     * @private
     * @readonly
     */
    private static readonly ALL_ROOM_TYPES: RoomType[] = [
        RoomType.BEDROOM, RoomType.OFFICE, RoomType.BATHROOM, RoomType.KITCHEN, 
        RoomType.LIVING_ROOM, RoomType.GARAGE, RoomType.YARD
    ];

    /**
     * Assigns room types to all room groups.
     * Types are randomly shuffled and assigned to ensure uniqueness while
     * respecting adjacency constraints between LIVING_ROOM and OFFICE.
     * 
     * @param {RoomGroup[]} groups - Array of room groups to assign types to
     * @modifies RoomGroup[] groups - Sets the roomType property on each group
     * @returns void
     * 
     * @example
     * ```typescript
     * const groups = [...]; // 4 merged room groups
     * RoomTypeAssigner.assign(groups);
     * // Each group now has a unique room type with no LIVING_ROOM/OFFICE adjacency
     * ```
     */
    static assign(groups: RoomGroup[]): void {
        const shuffledTypes = this.shuffleWithAdjacencyConstraint(groups, [...this.ALL_ROOM_TYPES]);
        
        groups.forEach((group, index) => {
            if (index < shuffledTypes.length) 
                group.roomType = shuffledTypes[index];
        });
    }

    /**
     * Shuffles room types while ensuring LIVING_ROOM and OFFICE are not adjacent
     * in the actual grid layout (sharing any cell borders).
     * 
     * @private
     * @param {RoomGroup[]} groups - Room groups to check adjacency for
     * @param {RoomType[]} types - Room types to shuffle
     * @returns {RoomType[]} Shuffled types respecting the adjacency constraint
     */
    private static shuffleWithAdjacencyConstraint(groups: RoomGroup[], types: RoomType[]): RoomType[] {
        const maxAttempts = 100;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const shuffled = Random.shuffle([...types]);
            
            if (this.isValidAssignment(groups, shuffled))
                return shuffled;
        }
        
        // Fallback: if no valid shuffle found, use a constraint-solving approach
        return this.satisfyConstraints(groups, types);
    }

    /**
     * Checks if a type assignment would place LIVING_ROOM and OFFICE adjacent
     * in the actual grid layout.
     * 
     * @private
     * @param {RoomGroup[]} groups - Room groups with their cell positions
     * @param {RoomType[]} types - Proposed type assignment (parallel to groups array)
     * @returns {boolean} True if no adjacency violations exist
     */
    private static isValidAssignment(groups: RoomGroup[], types: RoomType[]): boolean {
        // Create a map from group ID to its assigned type
        const groupTypeMap = new Map<number, RoomType>();
        groups.forEach((group, index) => {
            if (index < types.length)
                groupTypeMap.set(group.id, types[index]);
        });
        
        // Check each pair of groups for adjacency
        for (let i = 0; i < groups.length; i++) {
            const groupA = groups[i];
            const typeA = groupTypeMap.get(groupA.id);
            if (!typeA) continue;
            
            for (let j = i + 1; j < groups.length; j++) {
                const groupB = groups[j];
                const typeB = groupTypeMap.get(groupB.id);
                if (!typeB) continue;
                
                // Only check if these types are the forbidden pair
                if (this.areAdjacentForbidden(typeA, typeB))
                    // Check if the groups are actually adjacent in the grid
                    if (this.areGroupsAdjacent(groupA, groupB))
                        return false;
            }
        }
        
        return true;
    }

    /**
     * Determines if two room groups share any adjacent cells.
     * 
     * @private
     * @param {RoomGroup} groupA - First room group
     * @param {RoomGroup} groupB - Second room group
     * @returns {boolean} True if any cell from groupA is adjacent to any cell from groupB
     */
    private static areGroupsAdjacent(groupA: RoomGroup, groupB: RoomGroup): boolean {
        // Create a set of positions in groupB for quick lookup
        const groupBSet = new Set<string>();
        groupB.cells.forEach(cell => {
            groupBSet.add(`${cell.row},${cell.col}`);
        });
        
        // Check each cell in groupA against groupB
        for (const cellA of groupA.cells) {
            // Check all four cardinal directions
            const neighbors = [
                { row: cellA.row - 1, col: cellA.col }, // up
                { row: cellA.row + 1, col: cellA.col }, // down
                { row: cellA.row, col: cellA.col - 1 }, // left
                { row: cellA.row, col: cellA.col + 1 }  // right
            ];
            
            for (const neighbor of neighbors)
                if (groupBSet.has(`${neighbor.row},${neighbor.col}`))
                    return true;
        }
        
        return false;
    }

    /**
     * Determines if two room types being adjacent violates constraints.
     * 
     * @private
     * @param {RoomType} type1 - First room type
     * @param {RoomType} type2 - Second room type
     * @returns {boolean} True if these types cannot be adjacent
     */
    private static areAdjacentForbidden(type1: RoomType, type2: RoomType): boolean {
        return (type1 === RoomType.LIVING_ROOM && type2 === RoomType.OFFICE) ||
               (type1 === RoomType.OFFICE && type2 === RoomType.LIVING_ROOM);
    }

    /**
     * Satisfies adjacency constraints using backtracking to ensure a valid assignment.
     * 
     * @private
     * @param {RoomGroup[]} groups - Room groups to assign types to
     * @param {RoomType[]} availableTypes - Available room types
     * @returns {RoomType[]} Valid type assignment
     */
    private static satisfyConstraints(groups: RoomGroup[], availableTypes: RoomType[]): RoomType[] {
        const assignment: (RoomType | null)[] = new Array(groups.length).fill(null);
        const usedTypes = new Set<RoomType>();
        
        const backtrack = (index: number): boolean => {
            if (index === groups.length)
                return true;
            
            // Try each unused type
            for (const type of availableTypes) {
                if (usedTypes.has(type)) continue;
                
                // Check if this assignment would create violations with already-assigned adjacent groups
                let valid = true;
                assignment[index] = type;
                
                // Check all previously assigned groups that are adjacent to this one
                for (let i = 0; i < index; i++)
                    if (assignment[i] && this.areAdjacentForbidden(type, assignment[i]!))
                        if (this.areGroupsAdjacent(groups[index], groups[i])) {
                            valid = false;
                            break;
                        }
                    
                
                
                if (valid) {
                    usedTypes.add(type);
                    if (backtrack(index + 1)) return true;
                    usedTypes.delete(type);
                }
                
                assignment[index] = null;
            }
            
            return false;
        };
        
        backtrack(0);
        
        // Fill any remaining unassigned indices with remaining types
        const remainingTypes = availableTypes.filter(t => !usedTypes.has(t));
        let remainingIndex = 0;
        for (let i = 0; i < assignment.length; i++)
            if (assignment[i] === null && remainingIndex < remainingTypes.length)
                assignment[i] = remainingTypes[remainingIndex++];
        
        return assignment as RoomType[];
    }
}

export default RoomTypeAssigner;