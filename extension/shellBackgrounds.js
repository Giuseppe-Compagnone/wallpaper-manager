// SPDX-License-Identifier: GPL-3.0-or-later

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import GLib from 'gi://GLib';

import {
    InjectionManager,
} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Background from 'resource:///org/gnome/shell/ui/background.js';
import * as WorkspaceAnimation from 'resource:///org/gnome/shell/ui/workspaceAnimation.js';
import * as WorkspaceModule from 'resource:///org/gnome/shell/ui/workspace.js';

export class ShellBackgrounds {
    constructor(getWallpaper, onDesktopManagerChanged) {
        this._getWallpaper = getWallpaper;
        this._onDesktopManagerChanged = onDesktopManagerChanged;
        this._records = new Map();
        this._pendingOwnSwaps = new Set();
    }

    enable() {
        this._injections = new InjectionManager();
        const shellBackgrounds = this;

        this._injections.overrideMethod(
            WorkspaceAnimation.WorkspaceGroup.prototype,
            '_init',
            original => function (workspace, monitor, movingWindow) {
                original.call(this, workspace, monitor, movingWindow);
                if (workspace && this._bgManager) {
                    shellBackgrounds._track(
                        this,
                        this._bgManager,
                        workspace.index(),
                        monitor.index
                    );
                }
            }
        );

        this._injections.overrideMethod(
            WorkspaceModule.Workspace.prototype,
            '_init',
            original => function (
                metaWorkspace, monitorIndex, overviewAdjustment) {
                original.call(
                    this, metaWorkspace, monitorIndex, overviewAdjustment
                );
                if (metaWorkspace && this._background?._bgManager) {
                    shellBackgrounds._track(
                        this,
                        this._background._bgManager,
                        metaWorkspace.index(),
                        monitorIndex
                    );
                }
            }
        );

        this._injections.overrideMethod(
            Background.BackgroundManager.prototype,
            '_swapBackgroundActor',
            original => function () {
                const ownSwap = shellBackgrounds._pendingOwnSwaps.delete(this);
                original.call(this);
                if (ownSwap)
                    return;

                const record = shellBackgrounds._records.get(this);
                if (record)
                    shellBackgrounds._applyRecord(record);
                else
                    shellBackgrounds._onDesktopManagerChanged(this);
            }
        );
    }

    disable() {
        this._injections?.clear();
        this._injections = null;

        for (const record of this._records.values()) {
            if (record.destroyId) {
                try {
                    record.owner.disconnect(record.destroyId);
                } catch (_error) {
                    // The actor may already be finalized.
                }
            }
            record.owner._wallpaperManagerBackground = null;
            record.manager._updateBackgroundActor();
        }
        this._records.clear();
        this._pendingOwnSwaps.clear();
        this._getWallpaper = null;
        this._onDesktopManagerChanged = null;
    }

    refresh() {
        for (const record of this._records.values())
            this._applyRecord(record);
    }

    setManagerBackground(manager, wallpaper) {
        if (!wallpaper || !manager.backgroundActor)
            return null;

        const background = new Meta.Background({
            meta_display: global.display,
        });
        background.set_file(
            Gio.File.new_for_path(wallpaper.path),
            wallpaper.style
        );

        const oldActor = manager.backgroundActor;
        const container = manager._container ?? oldActor.get_parent();
        if (!container || typeof manager._swapBackgroundActor !== 'function') {
            oldActor.content.set({background});
            return background;
        }

        if (manager._newBackgroundActor)
            manager._newBackgroundActor.destroy();

        const newActor = new Meta.BackgroundActor({
            meta_display: global.display,
            monitor: manager._monitorIndex,
            request_mode: manager._useContentSize
                ? Clutter.RequestMode.CONTENT_SIZE
                : Clutter.RequestMode.HEIGHT_FOR_WIDTH,
            x_expand: !manager._useContentSize,
            y_expand: !manager._useContentSize,
        });
        newActor.content.set({background});
        newActor.visible = oldActor.visible;

        const oldContent = oldActor.content;
        const newContent = newActor.content;
        newContent.vignette_sharpness = oldContent.vignette_sharpness;
        newContent.brightness = oldContent.brightness;

        container.add_child(newActor);
        if (manager._controlPosition) {
            const monitor = manager._layoutManager?.monitors?.[
                manager._monitorIndex
            ];
            if (monitor)
                newActor.set_position(monitor.x, monitor.y);
            container.set_child_below_sibling(newActor, null);
        }

        manager._newBackgroundActor = newActor;
        let loadedId = 0;
        const swap = () => {
            if (loadedId) {
                background.disconnect(loadedId);
                loadedId = 0;
            }
            if (manager._newBackgroundActor !== newActor)
                return GLib.SOURCE_REMOVE;

            this._pendingOwnSwaps.add(manager);
            manager._swapBackgroundActor();
            return GLib.SOURCE_REMOVE;
        };

        newActor.connect('destroy', () => {
            if (loadedId) {
                background.disconnect(loadedId);
                loadedId = 0;
            }
        });

        if (background.isLoaded) {
            GLib.idle_add(GLib.PRIORITY_DEFAULT, swap);
        } else {
            loadedId = background.connect('loaded', swap);
        }

        return background;
    }

    _track(owner, manager, workspaceIndex, monitorIndex) {
        const record = {
            owner,
            manager,
            workspaceIndex,
            monitorIndex,
            background: null,
            destroyId: 0,
        };
        record.destroyId = owner.connect('destroy', () => {
            this._records.delete(manager);
            record.destroyId = 0;
        });
        this._records.set(manager, record);
        this._applyRecord(record);
    }

    _applyRecord(record) {
        const wallpaper = this._getWallpaper(
            record.workspaceIndex,
            record.monitorIndex
        );
        if (!wallpaper) {
            if (record.background) {
                record.background = null;
                record.owner._wallpaperManagerBackground = null;
                record.manager._updateBackgroundActor();
            }
            return;
        }

        record.background = this.setManagerBackground(
            record.manager,
            wallpaper
        );
        record.owner._wallpaperManagerBackground = record.background;
    }
}
