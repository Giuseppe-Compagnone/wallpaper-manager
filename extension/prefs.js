// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class WallpaperManagerPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const signalIds = [];
        const iconTheme = Gtk.IconTheme.get_for_display(
            Gdk.Display.get_default()
        );
        const iconPath = this.dir.get_path();
        if (!iconTheme.get_search_path().includes(iconPath))
            iconTheme.add_search_path(iconPath);

        const page = new Adw.PreferencesPage({
            title: _('Wallpaper Manager'),
            icon_name: 'wallpaper-manager',
        });
        const sourceGroup = new Adw.PreferencesGroup({
            title: _('Wallpapers'),
            description: _(
                'Every image is used once before the list repeats.'
            ),
        });

        const folderRow = new Adw.ActionRow({
            title: _('Image folder'),
            subtitle: this._folderLabel(settings),
        });
        const folderButton = new Gtk.Button({
            label: _('Choose…'),
            valign: Gtk.Align.CENTER,
        });
        folderButton.connect('clicked', () => {
            const dialog = new Gtk.FileDialog({
                title: _('Choose a wallpaper folder'),
                modal: true,
            });
            dialog.select_folder(window, null, (source, result) => {
                try {
                    const folder = source.select_folder_finish(result);
                    const path = folder.get_path();
                    if (path)
                        settings.set_string('wallpaper-folder', path);
                } catch (error) {
                    if (!error.matches(
                        Gtk.DialogError,
                        Gtk.DialogError.DISMISSED
                    ))
                        console.error(`${_('Wallpaper Manager')}: ${error.message}`);
                }
            });
        });
        folderRow.add_suffix(folderButton);
        sourceGroup.add(folderRow);

        signalIds.push(settings.connect('changed::wallpaper-folder', () => {
            folderRow.subtitle = this._folderLabel(settings);
        }));

        const shuffleRow = new Adw.SwitchRow({
            title: _('Shuffle images'),
            subtitle: _(
                'The random order stays stable until you reshuffle it.'
            ),
        });
        settings.bind(
            'shuffle',
            shuffleRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        sourceGroup.add(shuffleRow);

        const reshuffleRow = new Adw.ActionRow({
            title: _('Reshuffle now'),
            subtitle: _(
                'Create a new assignment for monitors and workspaces.'
            ),
        });
        const reshuffleButton = new Gtk.Button({
            label: _('Reshuffle'),
            valign: Gtk.Align.CENTER,
            sensitive: settings.get_boolean('shuffle'),
        });
        reshuffleButton.connect('clicked', () => {
            const seed = settings.get_uint('shuffle-seed');
            settings.set_uint(
                'shuffle-seed',
                seed === 0xffffffff ? 1 : seed + 1
            );
        });
        signalIds.push(settings.connect('changed::shuffle', () => {
            reshuffleButton.sensitive = settings.get_boolean('shuffle');
        }));
        reshuffleRow.add_suffix(reshuffleButton);
        sourceGroup.add(reshuffleRow);

        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('Appearance'),
        });
        const fitRow = new Adw.ComboRow({
            title: _('Wallpaper scaling'),
            model: Gtk.StringList.new([
                _('Fill and crop'),
                _('Fit with borders'),
            ]),
            selected: settings.get_string('fit-mode') === 'fit' ? 1 : 0,
        });
        fitRow.connect('notify::selected', () => {
            settings.set_string(
                'fit-mode',
                fitRow.selected === 1 ? 'fit' : 'zoom'
            );
        });
        appearanceGroup.add(fitRow);

        const infoGroup = new Adw.PreferencesGroup({
            title: _('Assignment order'),
            description: _(
                'Workspace 1 · monitor 1, workspace 1 · monitor 2, '
                + 'then workspace 2, and so on.'
            ),
        });

        page.add(sourceGroup);
        page.add(appearanceGroup);
        page.add(infoGroup);
        window.add(page);
        window.set_default_size(680, 540);

        window.connect('close-request', () => {
            for (const signalId of signalIds)
                settings.disconnect(signalId);
            return false;
        });
    }

    _folderLabel(settings) {
        return settings.get_string('wallpaper-folder') || _('No folder selected');
    }
}
