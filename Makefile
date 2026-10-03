UUID := wallpaper-manager@giuseppe-compagnone.github.io
ZIP := outputs/$(UUID).shell-extension.zip
SOURCES := assignment.js fileScanner.js shellBackgrounds.js wallpaperController.js \
	wallpaper-manager.png COPYING locale

.PHONY: check translations pack install clean

translations:
	python3 tools/compile-translations.py

check:
	glib-compile-schemas --strict --dry-run extension/schemas
	test -f extension/locale/it/LC_MESSAGES/wallpaper-manager.mo
	test -f extension/locale/de/LC_MESSAGES/wallpaper-manager.mo
	test -f extension/locale/fr/LC_MESSAGES/wallpaper-manager.mo
	test -f extension/locale/es/LC_MESSAGES/wallpaper-manager.mo
	test -f extension/locale/pt_BR/LC_MESSAGES/wallpaper-manager.mo
	test -f extension/locale/ru/LC_MESSAGES/wallpaper-manager.mo
	test -f extension/locale/zh_CN/LC_MESSAGES/wallpaper-manager.mo
	test -f extension/locale/ja/LC_MESSAGES/wallpaper-manager.mo
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
