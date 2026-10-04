// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import Meta from 'gi://Meta';

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
                original.call(this);
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
        manager.backgroundActor.content.set({background});
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
