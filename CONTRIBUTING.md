# Contributing

Thank you for contributing to Wallpaper Manager.

## Before opening an issue

Please include:

- Linux distribution and version;
- GNOME Shell version from `gnome-shell --version`;
- Wayland or X11 session type;
- number and arrangement of monitors;
- whether dynamic workspaces are enabled;
- exact reproduction steps;
- relevant GNOME Shell journal messages.

Do not attach private wallpapers unless you have permission to redistribute
them. A minimal test image or a description of its dimensions is sufficient.

## Development workflow

1. Create a focused branch.
2. Keep `extension/extension.js` as a small lifecycle entry point.
3. Put new behavior in the module responsible for that lifecycle.
4. Clean up every signal, source, monitor, actor, and override in `disable()`.
5. Avoid synchronous file I/O in GNOME Shell.
6. Add or update tests for pure assignment behavior.
7. Run `make check` and `make pack`.
8. Test the generated ZIP in a fresh GNOME Shell session.

## Translations

User-visible strings are marked with gettext in `extension/prefs.js` and the
controller. Add or update translations in `po/<locale>.po`, then compile the
catalogs with:

```bash
make translations
```

The generated files under `extension/locale/` are part of the distributable
extension and must be included in release commits. The English source strings
remain the fallback when a locale is incomplete.

## Code style

- Use four spaces and no tab indentation in JavaScript.
- Use semicolons.
- Prefer early returns over deep nesting.
- Keep functions small and responsibilities explicit.
- Do not add network access, telemetry, or bundled wallpapers.
- Do not claim compatibility with an untested GNOME Shell release.

## Release testing

Test desktop backgrounds, overview previews, workspace animations,
preferences, folder monitoring, multiple monitors, dynamic workspaces, and the
disable/enable cycle.

GNOME's review guidelines are the final authority for code submitted to
extensions.gnome.org.
