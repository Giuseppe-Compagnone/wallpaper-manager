UUID := wallpaper-manager@giuseppe-compagnone.github.io
ZIP := outputs/$(UUID).shell-extension.zip
SOURCES := assignment.js fileScanner.js shellBackgrounds.js wallpaperController.js COPYING

.PHONY: check pack install clean

check:
	glib-compile-schemas --strict --dry-run extension/schemas
	node --check extension/extension.js
	node --check extension/fileScanner.js
	node --check extension/prefs.js
	node --check extension/shellBackgrounds.js
	node --check extension/wallpaperController.js
	node --test

pack: check
	mkdir -p outputs
	gnome-extensions pack --force --out-dir=outputs \
		$(foreach source,$(SOURCES),--extra-source=$(source)) extension

install: pack
	gnome-extensions install --force $(ZIP)

clean:
	rm -f $(ZIP)
	rm -f extension/schemas/gschemas.compiled
