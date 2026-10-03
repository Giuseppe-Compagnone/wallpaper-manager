// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Return a stable ordering. When shuffling is enabled, the same seed always
 * produces the same order so workspaces do not change unexpectedly.
 */
export function orderImages(paths, shuffle = false, seed = 1) {
    const ordered = [...paths].sort((a, b) => a.localeCompare(b));

    if (!shuffle || ordered.length < 2)
        return ordered;

    // Keep one shuffled base order for each complete image cycle. Rotating
    // that order by one position per seed gives every image every slot once
    // per cycle, while the base order changes between cycles.
    const normalizedSeed = Math.max(1, seed >>> 0);
    const cycle = Math.floor((normalizedSeed - 1) / ordered.length);
    const rotation = (normalizedSeed - 1) % ordered.length;
    let state = (cycle + 0x9e3779b9) >>> 0;
    const random = () => {
        state = Math.imul(state ^ (state >>> 16), 0x21f0aaad);
        state = Math.imul(state ^ (state >>> 15), 0x735a2d97);
        return ((state ^ (state >>> 15)) >>> 0) / 0x100000000;
    };

    for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    }

    return [
        ...ordered.slice(rotation),
        ...ordered.slice(0, rotation),
    ];
}

/**
 * Assign images row-by-row: all monitors of workspace 0, then workspace 1,
 * and so on. Modulo is used only after every available image was consumed.
 */
export function imagesForWorkspace(paths, workspaceIndex, monitorCount) {
    if (paths.length === 0 || monitorCount <= 0)
        return [];

    const offset = workspaceIndex * monitorCount;
    return Array.from(
        {length: monitorCount},
        (_, monitorIndex) => paths[(offset + monitorIndex) % paths.length]
    );
}

/**
 * Return the image assigned to one workspace/monitor slot.
 */
export function imageForSlot(
    paths, workspaceIndex, monitorIndex, monitorCount) {
    if (paths.length === 0 || monitorCount <= 0 || monitorIndex < 0)
        return null;

    const index = workspaceIndex * monitorCount + monitorIndex;
    return paths[index % paths.length];
}
