#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "$0")"
make install

printf '%s\n' \
  'Wallpaper Manager è stato installato.' \
  'Su Wayland, esci dalla sessione e rientra; poi abilitalo dall’app Estensioni.'
