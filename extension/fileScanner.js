// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const ATTRIBUTES = 'standard::name,standard::type';
const BATCH_SIZE = 64;

const IMAGE_EXTENSIONS = new Set([
    '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.tif', '.tiff', '.webp',
]);

function enumerateChildrenAsync(folder, cancellable) {
    return new Promise((resolve, reject) => {
        folder.enumerate_children_async(
            ATTRIBUTES,
            Gio.FileQueryInfoFlags.NONE,
            GLib.PRIORITY_DEFAULT,
            cancellable,
            (source, result) => {
                try {
                    resolve(source.enumerate_children_finish(result));
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

function nextFilesAsync(enumerator, cancellable) {
    return new Promise((resolve, reject) => {
        enumerator.next_files_async(
            BATCH_SIZE,
            GLib.PRIORITY_DEFAULT,
            cancellable,
            (source, result) => {
                try {
                    resolve(source.next_files_finish(result));
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

function closeAsync(enumerator) {
    return new Promise(resolve => {
        enumerator.close_async(
            GLib.PRIORITY_DEFAULT,
            null,
            (source, result) => {
                try {
                    source.close_finish(result);
                } catch (error) {
                    console.debug(`Wallpaper Manager: ${error.message}`);
                }
                resolve();
            }
        );
    });
}

export async function listImageFiles(folderPath, cancellable) {
    const folder = Gio.File.new_for_path(folderPath);
    const enumerator = await enumerateChildrenAsync(folder, cancellable);
    const paths = [];

    try {
        while (true) {
            const infos = await nextFilesAsync(enumerator, cancellable);
            if (infos.length === 0)
                break;

            for (const info of infos) {
                if (info.get_file_type() !== Gio.FileType.REGULAR)
                    continue;

                const name = info.get_name();
                const dot = name.lastIndexOf('.');
                const extension = dot >= 0 ? name.slice(dot).toLowerCase() : '';
                if (IMAGE_EXTENSIONS.has(extension))
                    paths.push(folder.get_child(name).get_path());
            }
        }
    } finally {
        await closeAsync(enumerator);
    }

    return paths;
}
