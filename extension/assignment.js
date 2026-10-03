// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Return a stable ordering. When shuffling is enabled, the same seed always
 * produces the same order so workspaces do not change unexpectedly.
 */
export function orderImages(paths, shuffle = false, seed = 1) {
    const ordered = [...paths].sort((a, b) => a.localeCompare(b));

    if (!shuffle)
        return ordered;

    let state = seed >>> 0;
    const random = () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x100000000;
    };

    for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    }

    return ordered;
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
