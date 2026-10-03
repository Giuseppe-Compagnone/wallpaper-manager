#!/usr/bin/env python3
"""Compile the extension's gettext catalogs into GNOME .mo files."""

from pathlib import Path

from babel.messages import mofile, pofile


ROOT = Path(__file__).resolve().parents[1]
PO_DIR = ROOT / "po"
LOCALE_DIR = ROOT / "extension" / "locale"


def main():
    for po_path in sorted(PO_DIR.glob("*.po")):
        locale = po_path.stem
        with po_path.open("r", encoding="utf-8") as source:
            catalog = pofile.read_po(source)

        output_dir = LOCALE_DIR / locale / "LC_MESSAGES"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / "wallpaper-manager.mo"
        with output_path.open("wb") as output:
            mofile.write_mo(output, catalog)
        print(f"compiled {po_path.relative_to(ROOT)} -> {output_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
