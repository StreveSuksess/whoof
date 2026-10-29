# Whoof v56 — Play2Go deployment

Deployed 29 October 2026 through the ordinary authenticated Play2Go console.

- Public URL: http://31.76.24.157:8080/?v=56
- Play2Go service: 128980, `hermes-personal`, Ubuntu 26.04.
- Deployed source: `6a0666a`, tag `whoof-v56-2026-10-29`.
- Release: `/var/www/whoof-landing/releases/v56-6a0666a`.
- Active root: `/var/www/whoof-landing/current` (symlink).
- nginx configuration: `/etc/nginx/sites-available/whoof-landing`, enabled by a same-name symlink in `sites-enabled`.
- Server report: `/var/www/whoof-landing/deployment-v56.json`.

## Artifact

`tmp/deploy-v56/whoof-v56-runtime.tar` in the parent workspace contains `deploy.py` and `site.tar.gz`. Only compiled public runtime files were transferred: 497 files, 30,179,342 uncompressed bytes. Full-resolution active hero poses, app/owner/how artwork, lighting, fonts, models, video and hashed scripts are retained. Private materials, interviews, Memory Bank, credentials, databases and source documents were not uploaded.

Outer archive: 26,142,720 bytes.

```
cc64eade0255d8895a71310b4576a2c4d2aa7a65ee396baefc2318713b50884d  whoof-v56-runtime.tar
5d2a3a0d97c17aafda75f97134de71d240805295fe730416f6b4a49ff6fd1b1b  site.tar.gz
```

Transport recovery is in the private `StreveSuksess/whoof-landing-dist` repository, release `v56`. It was public only for the server download, then verified private. The older, larger `whoof-v56.tar` asset in that release was not installed. Server download is `/tmp/whoof-v56-runtime.tar`; installer staging is `/tmp/whoof56stage`.

## Hosting and verification

nginx serves the static release on its separate port 8080, with safe `try_files`, gzip for textual assets, one-year immutable caching for hashed `/_astro/` files, one-day media caching and normal byte ranges. No Node process is required. Existing 80/443 Hermes vhosts and unrelated services remain unchanged; only nginx was reloaded after successful `nginx -t`.

Verified on the server:

| Resource | Result |
| --- | --- |
| `/index.html` | 200, text/html, 45,995 bytes |
| `/whoof/hero-v24/landscape.json` | 200, application/json, 24,317 bytes |
| `/whoof/device.stl` | 200, application/octet-stream, 760,984 bytes |
| `/whoof/lighting/hero.hdr` | 200, application/octet-stream, 896,601 bytes |
| `/_astro/index.astro_astro_type_script_index_0_lang.BLruJD5G.js` | 200, application/javascript, 71,510 bytes, immutable cache |
| `/whoof/life-gallery/outside.mp4`, bytes 0–1023 | 206, video/mp4, correct Content-Range |

Served HTML/JSON/STL/HDR bytes matched the release checksums. `systemctl is-active nginx whoof-survey` returned active/active after deployment and again after final checks. `ufw`, `nc` and `nft` commands are unavailable; no firewall settings were changed.

External visual QA is **not confirmed**: this Mac's corporate security replaces the public IP response with a “Сайт заблокирован” page, category `unknown`. No bypass or exception request was attempted. Server checks do not prove external browser reachability. HTTPS/domain setup is not part of this deployment.

Native server proof: parent workspace `output/deploy/whoof-v56-server-check.png`. VNC was disconnected at completion.

## Rollback and future releases

To disable only this landing while retaining its files:

```sh
unlink /etc/nginx/sites-enabled/whoof-landing
nginx -t && systemctl reload nginx
```

For a future update, build the intended commit, audit runtime references, create a new checksummed release directory, verify it, then switch only `current` and validate/reload nginx if its configuration changes. Retain the previous release for rollback. The initial installer reserves a new namespace and must not be rerun blindly over an existing deployment.
