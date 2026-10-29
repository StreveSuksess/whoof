# Whoof v58 — entry readiness deployed

29 October 2026. Public URL: http://31.76.24.157:8080/?v=58

Source checkpoint 7db9baa, tag whoof-v58-2026-10-29; local QA in QA-v58.md. Current symlink points to /var/www/whoof-landing/releases/v58-7db9baa. Previous complete release /var/www/whoof-landing/releases/v57-401973d is retained, as is v56. Report: /var/www/whoof-landing/deployment-v58.json.

The 368640-byte compiled package contains index.html, current _astro chunks and our checksummed updater. Existing nginx8080 follows the atomic current symlink; no restart/reload, application backend, credentials, DNS, billing or unrelated service/configuration changes were required. The updater asserted expected v57, checked nginx configuration/services and patch digest, copied the old complete release, overlaid the checked runtime, switched atomically and verified served content. Failure would restore v57.

```
9049835d7c0a443368a0ac1f71d886f2d24f659453fa7cc23115a303fbde722d  whoof-v58.tar
cc9bcfd560e31a4b9951afdf2637c47640d7f096ee00c82ed054bd47cebb5b86  patch.tar.gz
```

Ordinary VNC confirmed the exact outer checksum before execution. Server-side HTTP checks: HTML49335bytes, CSS89921bytes, entryJS88410bytes, existing mobile puppy39948bytes, STL760984bytes, HDR896601bytes and wordmark2763bytes all200, exact release digests and correct MIME types. nginx and whoof-survey remain active. The deployment report's inherited URL query was normalized from v57 to v58 after successful installation; this did not change served runtime.

Compiled transport: StreveSuksess/whoof-landing-dist releasev58. Temporarily public for this compiled download only, restored PRIVATE and verified before activation. No Memory Bank, research, source documents, private data or credentials uploaded. Local manifest/updater/package: parent workspace tmp/deploy-v58; server stage /tmp/whoof58stage. Proof: parent output/deploy/whoof-v58-server-check.png.

For rollback, atomically replace only current with a fresh temporary symlink to the retained v57 directory; nginx follows it. Do not rerun the one-shot updater after v58 exists. Public-IP browsing from this Mac remains corporate-blocked, so server bytes/services and local native visuals are verified separately; no public-origin visual-success claim. Actual phone/browser and BFCache validation remain open.
