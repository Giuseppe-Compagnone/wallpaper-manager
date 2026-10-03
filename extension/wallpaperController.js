// SPDX-License-Identifier: GPL-3.0-or-later

import GDesktopEnums from 'gi://GDesktopEnums';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {imageForSlot, orderImages} from './assignment.js';
import {listImageFiles} from './fileScanner.js';
import {ShellBackgrounds} from './shellBackgrounds.js';

const RELOAD_DELAY_MS = 250;

export class WallpaperController {
    constructor(settings) {
        this._settings = settings;
        this._paths = [];
        this._desktopBackgrounds = new Map();
        this._scanGeneration = 0;
        this._reloadSourceId = 0;
        this._warnedEmpty = false;
    }

    enable() {
        this._shellBackgrounds = new ShellBackgrounds(
            (workspaceIndex, monitorIndex) =>
                this._wallpaperFor(workspaceIndex, monitorIndex),
            manager => this._applyToDesktopManager(manager)
        );
        this._shellBackgrounds.enable();

        this._settings.connectObject(
            'changed::wallpaper-folder', () => this._scheduleReload(),
            'changed::shuffle', () => this._scheduleReload(),
            'changed::shuffle-seed', () => this._scheduleReload(),
            'changed::fit-mode', () => this._refreshBackgrounds(),
            this
        );
        Main.layoutManager.connectObject(
            'monitors-changed', () => this._scheduleReload(),
            this
        );
        global.workspace_manager.connectObject(
            'workspace-switched', () => this._applyDesktopBackgrounds(),
            'notify::n-workspaces', () => this._refreshBackgrounds(),
            this
        );

        this._reloadImages();
    }

    disable() {
        if (this._reloadSourceId) {
            GLib.source_remove(this._reloadSourceId);
            this._reloadSourceId = 0;
        }
        this._scanCancellable?.cancel();
        this._scanCancellable = null;

        this._folderMonitor?.disconnectObject(this);
        this._folderMonitor?.cancel();
        this._folderMonitor = null;
        this._settings?.disconnectObject(this);
        Main.layoutManager.disconnectObject(this);
        global.workspace_manager.disconnectObject(this);

        this._shellBackgrounds?.disable();
        this._shellBackgrounds = null;
        this._restoreDesktopBackgrounds();

        this._desktopBackgrounds.clear();
        this._paths = [];
        this._settings = null;
    }

    _scheduleReload() {
        if (this._reloadSourceId) {
            GLib.source_remove(this._reloadSourceId);
            this._reloadSourceId = 0;
        }
        this._reloadSourceId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            RELOAD_DELAY_MS,
            () => {
                this._reloadSourceId = 0;
                this._reloadImages();
                return GLib.SOURCE_REMOVE;
            }
        );
    }

    _reloadImages() {
        const generation = ++this._scanGeneration;
        this._scanCancellable?.cancel();
        this._scanCancellable = new Gio.Cancellable();
        this._watchFolder();

        const folder = this._settings.get_string('wallpaper-folder');
        if (!folder) {
            this._paths = [];
            this._refreshBackgrounds();
            return;
        }

        listImageFiles(folder, this._scanCancellable)
            .then(paths => {
                if (!this._settings || generation !== this._scanGeneration)
                    return;

                this._paths = orderImages(
                    paths,
                    this._settings.get_boolean('shuffle'),
                    this._settings.get_uint('shuffle-seed')
                );
                this._warnedEmpty = false;
                if (this._paths.length === 0)
                    this._notifyEmptyFolder();
                this._refreshBackgrounds();
            })
            .catch(error => {
                if (error.matches?.(
                    Gio.IOErrorEnum,
                    Gio.IOErrorEnum.CANCELLED
                ))
                    return;

                console.error(
                    `Wallpaper Manager: ${error.message}\n${error.stack ?? ''}`
                );
                Main.notify(
                    'Wallpaper Manager',
                    'The selected wallpaper folder could not be read.'
                );
            });
    }

    _watchFolder() {
        this._folderMonitor?.disconnectObject(this);
        this._folderMonitor?.cancel();
        this._folderMonitor = null;

        const folder = this._settings.get_string('wallpaper-folder');
        if (!folder)
            return;

        try {
            this._folderMonitor = Gio.File.new_for_path(folder)
                .monitor_directory(Gio.FileMonitorFlags.NONE, null);
            this._folderMonitor.connectObject(
                'changed', () => this._scheduleReload(),
                this
            );
        } catch (error) {
            console.debug(`Wallpaper Manager: ${error.message}`);
        }
    }

    _refreshBackgrounds() {
        this._shellBackgrounds?.refresh();
        if (this._paths.length === 0) {
            this._restoreDesktopBackgrounds();
            this._desktopBackgrounds.clear();
            return;
        }
        this._applyDesktopBackgrounds();
    }

    _applyDesktopBackgrounds() {
        if (this._paths.length === 0)
            return;

        for (const manager of Main.layoutManager._bgManagers ?? [])
            this._applyToDesktopManager(manager);
    }

    _applyToDesktopManager(manager) {
        if (!this._shellBackgrounds || this._paths.length === 0)
            return;

        const monitorIndex = manager._monitorIndex;
        if (!Number.isInteger(monitorIndex))
            return;

        const workspaceIndex =
            global.workspace_manager.get_active_workspace_index();
        const wallpaper = this._wallpaperFor(workspaceIndex, monitorIndex);
        const background = this._shellBackgrounds.setManagerBackground(
            manager,
            wallpaper
        );
        if (background)
            this._desktopBackgrounds.set(manager, background);
    }

    _restoreDesktopBackgrounds() {
        for (const manager of this._desktopBackgrounds.keys())
            manager._updateBackgroundActor();
    }

    _wallpaperFor(workspaceIndex, monitorIndex) {
        const monitorCount = Main.layoutManager.monitors.length;
        const path = imageForSlot(
            this._paths,
            workspaceIndex,
            monitorIndex,
            monitorCount
        );
        if (!path)
            return null;

        const style = this._settings.get_string('fit-mode') === 'fit'
            ? GDesktopEnums.BackgroundStyle.SCALED
            : GDesktopEnums.BackgroundStyle.ZOOM;
        return {path, style};
    }

    _notifyEmptyFolder() {
        if (this._warnedEmpty)
            return;

        this._warnedEmpty = true;
        Main.notify(
            'Wallpaper Manager',
            'No supported images were found in the selected folder.'
        );
    }
}
