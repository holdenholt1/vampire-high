# Dev Notes

## QR Code / Join Link Issue
The QR code uses `window.location.origin` which resolves to the preview URL during development.
Once published to manus.space, this will automatically resolve to the correct public URL.
The fix: publish the app so the QR code points to the live domain.
Additionally, we should also show the game code prominently so players can manually enter it.
