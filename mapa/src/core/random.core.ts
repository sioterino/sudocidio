import * as ROT from 'rot-js';

/**
 * Core random number generation utility using ROT.js deterministic RNG.
 * 
 * Provides seed management and type-safe random operations for consistent
 * procedural generation across the entire application.
 * 
 * @author System Architect
 * 
 * @example
 * ```typescript
 * const seed = Random.seed('my-map');
 * const value = Random.int(1, 100);
 * const shuffled = Random.shuffle([1, 2, 3, 4]);
 * ```
 */
class Random {

    /**
     * Initializes the RNG with a deterministic or random seed.
     * 
     * Converts string seeds to numeric hashes for consistent generation.
     * 
     * @param seed - Optional string or number seed. If undefined, generates random seed.
     * @returns The normalized numeric seed used for generation.
     * 
     * @example
     * ```typescript
     * const seed = Random.seed('dungeon42'); // Returns hashed value
     * const randomSeed = Random.seed(); // Returns random number between 0-999999
     * ```
     */
    static seed(seed?: string | number): number {

        if (seed === undefined) {
            const newSeed = Math.floor(Math.random() * 1_000_000);
            ROT.RNG.setSeed(newSeed);
            return newSeed;
        }
        
        const numericSeed = typeof seed === 'string' ? this.hashString(seed) : seed;
        
        ROT.RNG.setSeed(numericSeed);
        return numericSeed;

    }

    /**
     * Generates a random integer between min and max (inclusive).
     * 
     * Uses ROT.js's uniform distribution for deterministic results when seeded.
     * 
     * @param min - Minimum integer value (inclusive)
     * @param max - Maximum integer value (inclusive)
     * @returns Random integer in range [min, max]
     * 
     * @throws {Error} If min > max
     * 
     * @example
     * ```typescript
     * const diceRoll = Random.int(1, 6);  // Returns 1-6
     * const roomSize = Random.int(4, 7);  // Returns 4,5,6, or 7
     * ```
     */
    static int(min: number, max: number): number {
        if (min > max)
            throw new Error(`<Random.int> min (${min}) cannot be greater than max (${max})`);
            
        return Math.floor(ROT.RNG.getUniform() * (max - min + 1)) + min;
    }

    /**
     * Generates a random floating-point number between 0 (inclusive) and 1 (exclusive).
     * 
     * @returns Random float in range [0, 1)
     * 
     * @example
     * ```typescript
     * const chance = Random.float();
     * if (chance < 0.3) console.log('30% chance triggered');
     * ```
     */
    static float(): number { return ROT.RNG.getUniform(); }

    /**
     * Randomly selects an element from an array.
     * 
     * @template T - The type of elements in the array
     * @param array - Source array to pick from
     * @returns A random element from the array
     * @throws {Error} If array is empty
     * 
     * @example
     * ```typescript
     * const colors = ['red', 'green', 'blue'];
     * const selected = Random.pick(colors); // Returns 'red', 'green', or 'blue'
     * ```
     */
    static pick<T>(array: T[]): T {
        if (array.length === 0)
            throw new Error('<Random.pick> Cannot pick from empty array');

        return array[Math.floor(this.float() * array.length)];
    }

    /**
     * Returns a new array with elements randomly shuffled using Fisher-Yates algorithm.
     * 
     * Does not modify the original array.
     * 
     * @template T - The type of elements in the array
     * @param array - Source array to shuffle
     * @returns A new array with elements in random order
     * 
     * @example
     * ```typescript
     * const original = [1, 2, 3, 4];
     * const shuffled = Random.shuffle(original);
     * // shuffled could be [3, 1, 4, 2], original remains unchanged
     * ```
     */
    static shuffle<T>(array: T[]): T[] {

        const shuffled = [...array];

        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.float() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;

    }
    
    /**
     * Converts a string to a numeric hash using djb2 algorithm.
     * 
     * Provides deterministic seed values for string-based seeds.
     * 
     * @param str - Input string to hash
     * @returns Positive integer hash value
     * 
     * @internal This method is used internally for seed normalization
     * 
     * @example
     * ```typescript
     * // "hello" always produces same hash
     * const hash1 = Random.hashString('hello');
     * const hash2 = Random.hashString('hello');
     * console.log(hash1 === hash2); // true
     * ```
     */
    private static hashString(str: string): number {

        let hash = 0;
        
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }

        return Math.abs(hash);

    }
}

export default Random