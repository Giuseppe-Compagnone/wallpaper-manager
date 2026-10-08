// SPDX-License-Identifier: GPL-3.0-or-later

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {WallpaperController} from './wallpaperController.js';

export default class WallpaperManagerExtension extends Extension {
    enable() {
        this._controller = new WallpaperController(
            this.getSettings(),
            text => this.gettext(text)
        );
        this._controller.enable();
    }

    disable() {
        this._controller?.disable();
        this._controller = null;
    }
}
