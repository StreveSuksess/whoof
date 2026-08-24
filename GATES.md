# 验收门册（固化的门命令）

> readable-source.md §7.0 的教训:只存在于 shell 历史里的门命令等于没有门。
> 本册是本仓库全部判据的**唯一权威清单**;每条命令都可直接复制执行。
> 绿灯会随输入过期——重抓镜像、重切 port、改动 src 之后,相关门必须重跑。

## 0. 一键静态门(不起服务)

```sh
node scripts/run-gates.mjs
```

依次执行下面 §1–§4,全绿退出 0。

## 1. 镜像门(mirror/ 自己的门)

```sh
node scripts/verify-mirror.mjs --mirror mirror --allow-missing mirror/external.txt
# 需要对线上抽样回源时(低频,勿滥用):
node scripts/verify-mirror.mjs --mirror mirror --allow-missing mirror/external.txt --resample 8
```

## 2. port 层字节门

```sh
node scripts/extract-source.mjs --slices scripts/slices.config.mjs --check
```

## 3. 覆盖账与分类门(源码化的符号层判据)

```sh
node scripts/verify-coverage.mjs   # 切片∪vendor 无缝铺满 _pretty + worker 字节复用
node scripts/verify-decls.mjs      # port↔src 全量分类:前向/目标/单射/反向
node scripts/verify-zerodep.mjs    # scripts/ 零依赖、门不 import 工具
```

映射变更流程:改 `docs/rename-overrides.json` → `node tools/build-rename-map.mjs` →
重跑 `verify-decls`。**门只读 rename-map.json 与两侧文本,不跑构建器。**

## 4. 自包含门(静态半)

```sh
node scripts/verify-standalone.mjs
```

## 5. 运行时门(需要起服务)

构建(过期的产物照样伺服——先构建再伺服):

```sh
cd src && npm run build && cd ..
```

双侧伺服(端口由 lib/ports.mjs 定:26001=mirror, 26002=rebuild):

```sh
node scripts/serve.mjs --side mirror  --root mirror   --origin-host oryzo.ai --stub-ext-hosts static.cloudflareinsights.com &
node scripts/serve.mjs --side rebuild --root src/dist --origin-host oryzo.ai --stub-ext-hosts static.cloudflareinsights.com &
```

CLEAN 门(全滚动走查;两侧都要跑):

```sh
node scripts/probe.mjs http://127.0.0.1:26002/ --walk 14
node scripts/probe.mjs http://127.0.0.1:26001/ --walk 14
```

像素巡航门(section 锚点 + 三相确定性驱动,详见 scripts/verify-walk.mjs 头注):

```sh
# 先建自比带宽(镜像 vs 镜像),实测 2026-08-24:全检查点 ≤0.2
node scripts/verify-walk.mjs --a 'http://127.0.0.1:26001/?__probe' --b 'http://127.0.0.1:26001/?__probe' --self --out docs/compare/walk-band
# 跨侧(实测 2026-08-24:最差 1.35,门限 --max-mean 4)
node scripts/verify-walk.mjs --a 'http://127.0.0.1:26002/?__probe' --b 'http://127.0.0.1:26001/?__probe' --out docs/compare/walk
```

## 6. 自包含门(全量:复制出仓、断网安装、构建、真跑对拍)

```sh
node scripts/verify-standalone.mjs --full --keep
# 然后把 --keep 打出的临时目录的 dist 当 rebuild 侧伺服,重复 §5 的 CLEAN + 巡航门。
```

## 已知噪声源登记(对拍时读residual前先看这里)

- **wearable 画廊 0.4 偏移处是自动播放视频**——媒体时钟在 shim 熵面之外,自比带宽 17.97;
  巡航门对该 section 固定用 0.12 偏移(静态 tear 照片),带宽 0.2。
- **入场相位**:页顶检查点需泵满(≥900 帧)让两侧入场动画都走完,否则差异是相位不是渲染。
- **驱动必须等 started 信号**(#preloader display:none)再 ramp——一次性大跳变会让晚启动侧
  的缓动滚动在拍照时仍在途,整段错位(实测 26–42 的假红)。
