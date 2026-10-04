# Wallpaper Manager

<p align="center">
  <img src="extension/wallpaper-manager.png"
       alt="Wallpaper Manager icon" width="192" height="192">
</p>

Wallpaper Manager is a GNOME Shell extension that assigns a different local
wallpaper to every physical monitor and workspace. It uses the images in the
selected folder before repeating any image.

The extension also updates the desktop, the Activities overview, and the
background shown while switching workspaces.

## Features

- A separate wallpaper for every monitor/workspace pair.
- Alphabetical or shuffled image order.
- Fair reshuffling: every image can reach every slot over time.
- Smooth fade transition when wallpapers change.
- Optional automatic reshuffling at a configurable interval.
- Automatic refresh when images are added to or removed from the folder.
- **Fill and crop** or **Fit with borders** scaling.
- Italian, German, French, Spanish, Brazilian Portuguese, Russian, Simplified
  Chinese, and Japanese translations, selected from the GNOME system language.
- Works entirely offline and does not include or upload your wallpapers.

## Requirements

- GNOME Shell 46 (Ubuntu 24.04 LTS).
- Wayland or X11.
- A folder containing supported image files.

## Supported image formats

Wallpaper Manager reads image files directly inside the selected folder:

- BMP
- GIF
- JPEG/JPG
- PNG
- TIFF
- WebP

Subdirectories are not scanned.

## Installation

### GNOME Extensions

Open the [Wallpaper Manager page on GNOME Extensions](https://extensions.gnome.org/extension/11140/wallpaper-manager/)
and install the version available for your GNOME release.

### GitHub release or Actions artifact

You can also download the latest ZIP from the
[latest GitHub release](https://github.com/Giuseppe-Compagnone/wallpaper-manager/releases/latest).

To install an artifact from a specific build:

1. Open the [Build and release workflow](https://github.com/Giuseppe-Compagnone/wallpaper-manager/actions/workflows/build-release.yml).
2. Open a successful run and download `wallpaper-manager-<commit>`.
3. Extract the downloaded archive and install the extension ZIP inside it:

```bash
gnome-extensions install --force \
  wallpaper-manager@giuseppe-compagnone.github.io.shell-extension.zip
```

After installation, open the GNOME **Extensions** application and enable
**Wallpaper Manager**. If GNOME does not show the extension immediately on
Wayland, log out and back in; your open applications do not need to be closed.

## Configuration

Open the GNOME **Extensions** application, find **Wallpaper Manager**, and
open its preferences.

| Setting | Description |
| --- | --- |
| Image folder | Folder containing the wallpapers. |
| Shuffle images | Uses a stable shuffled order instead of alphabetical order. |
| Reshuffle now | Immediately creates a new assignment. |
| Automatic shuffle | Periodically creates a new assignment. It requires Shuffle images. |
| Automatic shuffle interval | Minutes between automatic reshuffles, from 1 to 1440. The default is 60 minutes. |
| Wallpaper scaling | Choose Fill and crop or Fit with borders. |

Changes are applied automatically. The folder is monitored while the
extension is enabled, so adding or removing an image does not require a
restart.

## How wallpapers are assigned

Images are assigned by workspace and monitor:

1. workspace 1, monitor 1;
2. workspace 1, monitor 2;
3. workspace 2, monitor 1;
4. workspace 2, monitor 2;
5. and so on.

If there are more slots than images, the list repeats only after all images
have been used. With shuffle enabled, reshuffling changes the stable order and
the cycle is balanced so that images are not permanently excluded from the
first workspace or any other slot.

## Privacy

Wallpaper Manager only reads the folder selected in its preferences. It does
not:

- connect to the internet;
- execute external programs;
- collect telemetry or analytics;
- read unrelated files; or
- include or redistribute your wallpapers.

## Troubleshooting

### The extension does not appear

Open the GNOME **Extensions** application and check that **Wallpaper Manager**
is enabled. On Wayland, log out and back in after installing or updating it.

### Wallpapers do not change

Check that the selected folder still exists, contains supported image files,
and that the files are directly inside the folder rather than in a
subdirectory.

### Preferences do not open

Run this command to open the preferences and show any error:

```bash
gnome-extensions prefs wallpaper-manager@giuseppe-compagnone.github.io
```

### The wrong image appears on a monitor

Check the monitor order in **Settings → Displays**. Assignments follow the
monitor order reported by GNOME, not necessarily the physical left-to-right
order.

## License

Wallpaper Manager is licensed under the
[GNU General Public License version 3 or later](LICENSE).
