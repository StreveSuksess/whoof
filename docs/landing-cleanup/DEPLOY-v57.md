# Whoof v57 — mobile fixes deployed

29 October2026. Public URL: http://31.76.24.157:8080/?v=57

- Source checkpoint401973d, tagwhoof-v57-2026-10-29. Local verification: QA-v57.md.
- Current symlink: /var/www/whoof-landing/current → /var/www/whoof-landing/releases/v57-401973d.
- Previous complete release retained: /var/www/whoof-landing/releases/v56-6a0666a.
- Server report: /var/www/whoof-landing/deployment-v57.json.

The368,640byte compiled update contains only index.html, current _astro assets and our checksummed updater. The updater verifies the expected v56 current target, active nginx/survey services and nginx configuration, copies the full previous static release to a new versioned directory, overlays the checked compiled files and atomically switches current. HTTP content digests are checked after activation; failure restores the previous symlink. No nginx restart/reload or unrelated service/configuration change was required for this update.

```
4de6cbc87109520bd218a028bfd81d693e4dc754d860a152b3cbc423e666ed09  whoof-v57.tar
4ae20b9bb2b00522703da90557bdebba8fc6afd00405e2072e680610aee75130  patch.tar.gz
```

Native ordinary VNC verified the outer SHA before executing the own updater. New HTML46,751bytes, CSS87,635bytes, entry JS82,110bytes, mobile puppy39,948bytes, original STL760,984bytes and HDR896,601bytes each returned200 with exact release digests and correct MIME types. nginx and whoof-survey remain active.

Transport: private StreveSuksess/whoof-landing-dist releasev57. The compiled release was temporarily public for the VPS download, then repository visibility was restored to PRIVATE and verified before activation. No project Memory Bank, research, credentials, source documents or databases were uploaded. Local package/manifest/updater: parent workspace tmp/deploy-v57/. Server stage: /tmp/whoof57stage.

For rollback on the VPS, create an unused temporary symlink to the retainedv56 directory and atomically replace only /var/www/whoof-landing/current. The existing nginx vhost follows current; retain both releases. Do not rerun the reserved one-shot updater against an already-installedv57 release.

Proof: parent workspace output/deploy/whoof-v57-server-check.png. VNC disconnected and temporary local4341/4342 fixtures stopped. Public-IP browsing from this Mac remains corporate-blocked as documented forv56; no bypass or public-origin visual-success claim. Actual phone/browser confirmation remains open.
