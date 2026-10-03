# Wallpaper Manager

<p align="center">
  <img src="extension/wallpaper-manager.png"
       alt="Wallpaper Manager icon" width="192" height="192">
</p>

Wallpaper Manager is a GNOME Shell extension that assigns a different local
image to every physical monitor and workspace.

It treats each monitor/workspace pair as an independent wallpaper slot and
uses every image in the selected folder before repeating the list. The correct
wallpaper is visible on the desktop, in the Activities overview, and during
workspace-switch animations.

Wallpaper Manager works entirely offline. It does not bundle wallpapers,
connect to remote services, collect analytics, or share user data.

## Features

- A different wallpaper for every monitor and workspace.
- Correct backgrounds in the Activities overview and workspace animations.
- Alphabetical or stable shuffled ordering.
- Automatic refresh when images are added to or removed from the folder.
- **Fill and crop** and **Fit with borders** scaling modes.
- Images repeat only after every available image has been assigned.
- No network access, telemetry, subprocesses, or bundled artwork.
- Native GNOME preferences built with GTK 4 and Libadwaita.
- Preferences and notifications translated according to the system language.

## Compatibility

| Component | Supported version |
| --- | --- |
| GNOME Shell | 46 |
| Ubuntu | 24.04 LTS |
| Display server | Wayland, with the same code path available on X11 |

Only GNOME Shell versions listed in `extension/metadata.json` are claimed as
supported. Additional versions should be added only after testing their Shell
internals, overview, and workspace animation APIs.

## Supported image formats

Wallpaper Manager reads regular files located directly inside the selected
folder with one of these extensions:

- BMP
- GIF
- JPEG/JPG
- PNG
- TIFF
- WebP

Subdirectories are not scanned.

## How assignment works

Images are sorted alphabetically by full path unless shuffling is enabled.
The extension then assigns them in this order:

1. workspace 1, monitor 1;
2. workspace 1, monitor 2;
3. workspace 2, monitor 1;
4. workspace 2, monitor 2;
5. and so on.

Internally, the slot is calculated as:

```text
slot = workspaceIndex * monitorCount + monitorIndex
image = images[slot modulo imageCount]
```

For example, with two monitors and five images:

| Workspace | Monitor 1 | Monitor 2 |
| --- | --- | --- |
| 1 | Image A | Image B |
| 2 | Image C | Image D |
| 3 | Image E | Image A |

The shuffled order is deterministic for a given seed. Pressing **Reshuffle**
increments the seed and creates a new stable assignment.

## Installation

### Install a release ZIP

Download the release archive and run:

```bash
gnome-extensions install --force \
  wallpaper-manager@giuseppe-compagnone.github.io.shell-extension.zip
```

On Wayland, log out and back in after installing a new extension. Then open
the GNOME **Extensions** application and enable **Wallpaper Manager**.

### Install from source

Required build tools:

- `gnome-extensions`
- `glib-compile-schemas`
- Node.js 18 or newer, used only for tests
- GNU Make
- Python Babel, only when rebuilding translation catalogs

Build and install the extension:

```bash
make check
make install
```

The install target creates the extension ZIP and installs it for the current
user. Log out and back in on Wayland before enabling it.

To rebuild `.mo` files after editing a `.po` file, install the Python Babel
package provided by your distribution and run `make translations`.

## Configuration

Open the Extensions application, find **Wallpaper Manager**, and select its
preferences button.

Available settings:

| Setting | Description |
| --- | --- |
| Image folder | Local folder containing the wallpapers. |
| Shuffle images | Uses a stable pseudo-random order instead of alphabetical order. |
| Reshuffle now | Generates a new shuffled assignment. |
| Wallpaper scaling | Fills and crops the image, or fits it with borders. |

Changes are applied automatically. The folder is monitored while the extension
is active, so adding or removing an image does not require restarting GNOME
Shell.

## Localization

Wallpaper Manager follows the language configured for the GNOME session. No
language selector is needed: gettext automatically selects the closest
available catalog and falls back to English when a translation is unavailable.

The release currently includes Italian, German, French, Spanish, Brazilian
Portuguese, Russian, Simplified Chinese, and Japanese catalogs. English is the
source-language fallback.

## Architecture

The extension deliberately avoids generating large composite images. Each
GNOME background actor receives the file assigned to its own monitor and
workspace.

| File | Responsibility |
| --- | --- |
| `extension/extension.js` | Minimal GNOME lifecycle entry point. |
| `extension/wallpaperController.js` | Settings, folder monitoring, assignment, and desktop updates. |
| `extension/shellBackgrounds.js` | Overview and workspace-animation integration. |
| `extension/fileScanner.js` | Asynchronous folder enumeration and image filtering. |
| `extension/assignment.js` | Pure ordering and slot-assignment functions. |
| `extension/prefs.js` | GTK 4/Libadwaita preferences window. |
| `extension/wallpaper-manager.png` | Preferences and marketplace icon. |
| `extension/schemas/` | GSettings schema. |
| `extension/locale/` | Compiled gettext catalogs loaded by GNOME. |
| `po/` | Source translations and the gettext template. |

Folder enumeration is asynchronous to avoid blocking GNOME Shell. Method
overrides are managed with GNOME's `InjectionManager` and are fully restored
when the extension is disabled.

## Development

Run all checks:

```bash
make check
```

This validates the GSettings schema, checks JavaScript syntax, and runs the
assignment tests.

Build the distributable archive:

```bash
make clean
make pack
```

The resulting file is written to:

```text
outputs/wallpaper-manager@giuseppe-compagnone.github.io.shell-extension.zip
```

Inspect its contents before distributing it:

```bash
unzip -l outputs/*.shell-extension.zip
unzip -t outputs/*.shell-extension.zip
```

### Testing inside GNOME Shell

After changing extension code, GNOME Shell must load a fresh module instance.
On Wayland, log out and back in. A nested test session can also be started on
GNOME 48 and earlier with:

```bash
dbus-run-session gnome-shell --nested --wayland
```

Useful logs from the main session can be inspected with:

```bash
journalctl --user -f -o cat | grep -i 'wallpaper manager'
```

Test at least these scenarios before a release:

- one and multiple physical monitors;
- more workspaces than wallpapers;
- more wallpapers than workspace/monitor slots;
- Activities overview previews;
- keyboard and touchpad workspace animations;
- dynamic workspace creation and removal;
- adding and deleting files in the selected folder;
- changing scaling and shuffle settings;
- disable/enable and logout/login cycles;
- opening and closing the preferences window repeatedly.

## Repository layout

```text
wallpaper-manager/
├── extension/          Runtime extension and GSettings schema
├── po/                 Gettext source catalogs
├── tools/              Translation build helper
├── tests/              Pure JavaScript tests
├── Makefile            Check, package, and install targets
├── MARKETPLACE.md      Suggested GNOME Extensions listing text
├── PUBLISHING.md       Pre-release and EGO upload checklist
├── CONTRIBUTING.md     Contribution and testing guidelines
└── README.md
```

Generated archives, local work files, and wallpapers are ignored by Git and
must not be committed.

## Icon

The canonical icon is
[`extension/wallpaper-manager.png`](extension/wallpaper-manager.png).
It is an original 512 × 512 RGBA image with a transparent background. The
preferences window loads it from the extension's private icon search path, and
the same file can be uploaded as the extension icon on extensions.gnome.org.

## Privacy and permissions

Wallpaper Manager only accesses the local folder explicitly selected by the
user. It does not:

- connect to the internet;
- execute external programs;
- use telemetry or analytics;
- read unrelated user files;
- include or redistribute the user's wallpapers.

## Known limitations

- Only files directly inside the selected folder are scanned.
- One scaling mode applies to every monitor.
- GNOME Shell 46 is currently the only declared compatible release.
- Workspace assignments follow workspace indices; reordering workspaces also
  changes which image belongs to each position.

## Troubleshooting

### The extension does not appear after installation

Log out and back in, especially on Wayland. Confirm that the extension folder
name matches its UUID:

```text
~/.local/share/gnome-shell/extensions/
wallpaper-manager@giuseppe-compagnone.github.io/
```

### No wallpaper changes

Open preferences and confirm that the selected folder exists and contains a
supported image format. The files must be directly inside the folder.

### Preferences do not open

Run the preferences command from a terminal and inspect its output:

```bash
gnome-extensions prefs wallpaper-manager@giuseppe-compagnone.github.io
```

### The wrong image appears on a monitor

Check GNOME's monitor order in **Settings → Displays**. Assignment uses the
monitor indices provided by GNOME Shell, not the physical left-to-right order.

## Publishing

See [`PUBLISHING.md`](PUBLISHING.md) for the release checklist and
[`MARKETPLACE.md`](MARKETPLACE.md) for the proposed store description.

GNOME extension submissions must follow the official
[review guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html).

## Contributing

Bug reports and contributions are welcome. Please read
[`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting changes.

## License

Wallpaper Manager is licensed under the GNU General Public License,
version 3 or later. See [`LICENSE`](LICENSE).
