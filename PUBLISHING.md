# Publishing checklist

The upload bundle is generated with:

```bash
make clean
make pack
```

Before the first upload:

1. Read and understand the extension code and accept responsibility for
   maintaining it. Then manually remove the AI-maintainership notice at the
   top of `extension/extension.js`. GNOME explicitly requires this decision
   from the submitting maintainer.
2. Create the `Giuseppe-Compagnone/wallpaper-manager` repository on GitHub,
   push the local `main` branch, and verify that the `url` in
   `extension/metadata.json` resolves correctly.
3. Run `make check`, install the generated ZIP, and test the desktop,
   Activities overview, workspace animation, preferences and disable/enable
   cycle on GNOME Shell 46.
4. Inspect the ZIP and confirm that it contains only runtime files, the schema
   and the license.
5. Sign in to https://extensions.gnome.org, choose **Add yours**, upload the
   ZIP from `outputs/`, and provide screenshots without copyrighted artwork.

The UUID is intentionally tied to the configured GitHub account:
`wallpaper-manager@giuseppe-compagnone.github.io`. It must not be changed after
the first public upload.
