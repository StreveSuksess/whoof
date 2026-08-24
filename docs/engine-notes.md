# 源站引擎逆向笔记(M2.0)

> 来源:`mirror/_astro/hoisted.CRsATKbF.js`(压缩未混淆,可读)。
> 行号引用基于 js-beautify 格式化后的版本(30,536 行);格式化命令:
> `npx js-beautify mirror/_astro/hoisted.CRsATKbF.js -o bundle.pretty.js`

## 总体架构

单 bundle 内包含:Three.js r178 全量 + Lusion 自研层。自研层的关键单例:

- `properties` — 全局状态(time、resolution、loader、useMobileLayout、webglDPR 等)
- `settings` — 常量(`MODEL_PATH="/models/"`、`TEXTURE_PATH="/textures/"`、`IMAGE_PATH`、`AUDIO_PATH`、`USE_WEBGL2=true`)
- `properties.loader` — XHR 预载队列,`ITEM_CLASSES` 注册表按扩展名分发(xhr/image/any/buf/sog/riv…)
- `scrollManager` — 虚拟滚动(继承 `ScrollPane`)
- `pagesManager` / `Page` / `Section` — 页面与 section 生命周期(preInit/init/start/update/resize)
- `fboHelper` — RT/全屏 pass 工具
- 入口流程:`preInit → (loader 全量下载, Rive preloader 显示进度) → init → start`,完成后设 `html.is-ready`,`.page` 淡入

移动端资源:`properties.getMobileUrl(url)` 在扩展名前插 `_MOBILE`(buf/sog/纹理均适用,加载项带 `autoMobile` 选项时启用)。

## `.buf` 格式(BufItem,pretty 行 29722–29809)

布局:`[uint32 LE headerLen][JSON header][二进制 payload]`

JSON header 字段:

```jsonc
{
  "vertexCount": 2306,
  "indexCount": 12288,          // 0 表示无索引
  "attributes": [ {
    "id": "position",            // indices | position | normal | uv | Cd | orient | focal | boneWeights | ...
    "needsPack": true,           // 是否量化压缩
    "componentSize": 3,          // itemSize
    "storageType": "Uint16Array",// window[storageType] 直接构造
    "packedComponents": [ { "from": -0.04, "delta": 0.089 }, ... ] // 每分量一个
  } ],
  "meshType": "Mesh" | "Points" | "LineSegments",   // 可选
  "sceneData": [ ... ],          // 可选,节点层级
  "boundingSphere": { "center": [..], "radius": r }, // 可选
  "boundingBox": { "min": [..], "max": [..] }        // 可选
}
```

解码规则(严格按源码):

- payload 从 `4 + headerLen` 开始,属性按 header 中出现顺序**顺序排列**,无对齐填充
- 每属性元素数 `count = (id === "indices" ? indexCount : vertexCount) * componentSize`
- `needsPack === true` 时解包为 Float32:
  ```
  bits  = BYTES_PER_ELEMENT * 8
  F     = 1 << bits                 // 65536 for 16-bit
  half  = storageType 以 "Int" 开头(有符号)? F/2 : 0
  q     = 1 / (F - 1)
  value = (raw + half) * q * delta + from    // 每分量用自己的 {from, delta}
  ```
- `needsPack === false` 时直接用原始 TypedArray 作为 attribute(零拷贝 view)
- `indices` → `geometry.setIndex`;其余 → `geometry.setAttribute(id, ...)`
- `sceneData` 存在时构建 Object3D 层级:每节点 `{name, vertexIndex, vertexCount, faceIndex, faceCount, parentIndex, position, quaternion, scale, material, data}`,
  子几何为总 geometry 的 byte-offset view(faceIndex/faceCount 单位为 meshType 对应的图元大小:Mesh=3, LineSegments=2, Points=1);
  子索引需减去 `vertexIndex`;`data` 内容(如 `parentIdx`、`parentMatrix`)进 `userData`
- 相机轨迹文件(`hero_camera.buf`、`*_CAMERA_ANIM.buf`)是 `meshType:"Points"`,attributes 为
  `position`(每帧相机位置)+ `orient`(四元数)+ `focal`(焦距),每个 vertex = 一帧采样

已知文件清单:24 个,见 `public/models/`。动画类(`*_animation/_ANIM`)同样是 Points + sceneData(骨骼/节点矩阵)。

## `.sog` 格式(SogItem,pretty 行 29817–29975)

即 **PlayCanvas SOG**(压缩 3D Gaussian Splatting):无压缩 ZIP 容器,内含:

- `meta.json` — `count`、`means.mins/maxs`、`scales.codebook[256]`、`sh0.codebook[256]`、可选 `shN.codebook`
- `means_l.webp` / `means_u.webp` — 位置低/高 8 位(16bit 定点,归一化到 means.mins..maxs,再过 `unlog(v)=sign(v)*(e^|v|-1)`)
- `quats.webp`(xyz + 模式位 w,`qmode = w*255 - 252`)、`scales.webp`(codebook 索引)
- `sh0.webp`(DC 球谐 + alpha)、可选 `shN_labels.webp` + `shN_centroids.webp`(高阶球谐聚类)

运行时解码(GPU):两个全屏 pass(`sogCombineFrag`/`sogCombineShNFrag`,shader 源码就在 bundle 里)把
webp 数据打包成 `RGBA32UI` + `RGBA8` 两张纹理;CPU 侧 `readRenderTargetPixels` 读回后按上式解出
`centers`(Float32Array)供 worker 排序。ZIP 解析器 `parseUncompressedZip`(行 29932+)只支持 store(无压缩)条目。

**纹理翻转注意**:源站普通纹理走 `<img>` → three `flipY=true`(上传时翻转);WebGL 对 ImageBitmap
忽略 flipY,复刻 loader 用 ImageBitmap 时必须 `imageOrientation:'flipY'` 对齐(2026-07-21 已修)。
但 **SOG 的 webp 例外**:源站 `SogItem.toImageBitmap` 就是无翻转的 `createImageBitmap`
(premultiplyAlpha/colorSpaceConversion 均 none),移植 M2.4 时不要翻。

排序:`SplatsWorker-DSMxtdkh.js`(镜像已存)按相机深度排序 splat 索引,主线程 `_onWorkerMessage` 回填。

## 虚拟滚动(ScrollPane/ScrollManager,pretty 行 29500–29720)

- **原生滚动条驱动**:`contentDom`(#site-content)自然高度 → `document.body.style.height = contentSizePixel`(46410px 来源于 CSS 布局本身);监听 `window scroll` 事件设 `targetScrollPixel`
- 每帧平滑:wheel 时 `wheelEaseCoeff=12` 指数逼近;拖拽用摩擦系数(`frictionCoeffFrom/To ≈ 2`);
  程序滚动时写回 `window.scrollTo`(`_skipNativeScroll` 防回环)
- **DOM range 映射**:`getDomRange(element)` 缓存 `ScrollDomRange`(元素 top/height ↔ 滚动区间),
  section 动画进度 = 该 range 相对当前 scrollPixel 的归一化值——**没有全局时间轴,一切进度都由元素几何位置推出**
- `scrollTo(idOrElement, offset)` 支持锚点导航;键盘 Arrow/PageUp/Down 处理;snapList 支持吸附
- 相机动画:各场景(如 hero)加载相机轨迹 buf 后,用 section 进度在帧序列间插值(position lerp + orient slerp + focal)

## 材质 / 光照体系

- **球谐重打光**:`harmonics_0/1` 纹理对(coffee、smoke、condom 等)存预烘焙的球谐光照系数,
  shader 里按光照方向组合实现"可转动光源"的重打光;`BASE_COLOR` + `HARMONICS` 组合
- **RGBM 环境贴图**:`textureHelper.loadRGBMTexture`(env_hero/env_hand/env_table 等 webp)
- **gobo**:`textures/gobo/gobo_b_*.avif`、`gobo_c_*.avif` 投影光斑纹理,文件名含随机数但为固定资源
- brdf.png(BRDF LUT)、LDR_RGB1_0.png(色彩 LUT)、thermal_gradient.webp(咖啡热感)
- MSDF 文字:`fonts/msdf/Inter.json + Inter.webp`(WebGL 内文字)
- 所有自定义 GLSL 以模板字符串内联在 bundle 中(搜 `#define GLSLIFY 1`),可直接提取复用

## 后处理链(pretty 行 13280+, 15912+)

- `PostProfile`(行 15912):每 section 一份参数配置,滚动过渡时 `blend(other, t)` 数值/颜色插值。
  参数组:bloom(amount/radius/threshold/luma/selective/saturation)、halo(宽度/RGB shift/三色)、
  vignette、saturation/contrast/brightness/tint、screenPaintDistortion、cameraMotionBlur、
  bokeh(fNumber/focusDistance/focalLength)、smaaThreshold、upscalerSharpness
- 效果类:`Smaa`(行 16089,用 smaa-area/search.png)、`Bloom`(16425)、`ScreenPaint`(15981,
  鼠标轨迹流体 buffer)+ `ScreenPaintDistortion`(16714)、`BlurBox`、bokeh、相机运动模糊
- 色调映射:Three.js 内置 **AgX**
- 抗锯齿 SMAA + 可调 upscaler(内部低分辨率渲染 → sharpen 上采样)

## 其他子系统

- **Rive**:`@rive-app/canvas-advanced` 2.37.0,wasm 从 unpkg 按版本拉取;`rive/oryzo.riv` 驱动 preloader
  (加载进度绑定状态机)
- **Vimeo**:`@vimeo/player`,`VIDEO_LIST.MAIN_VIDEO_REEL` = vimeo.com/video/1174820580
- **Newsletter**:Mailchimp `lusion.us20.list-manage.com/subscribe/post`
- **GSAP** core(无 ScrollTrigger,滚动编排全自研)
- 分辨率策略:`isMobile ? 800 : 2560` 纹理上限;`webglDPR` 按视口推导

## 对复刻的直接结论

1. `.buf`/`.sog` 无需转换工具——按上述规则写解析器即可(M2.1/M2.4);SOG 也可考虑直接用
   PlayCanvas 的开源 SOG 加载代码比对验证
2. GLSL 全部可从 bundle 提取(搜索 `#define GLSLIFY 1` 共约几十段),材质还原=提取+接 uniform
3. 滚动系统的行为核心是 ScrollPane 一个类,可对照直译
4. 每 section 的 PostProfile 参数值需要从各 section 类的构造处逐个抄录(后续里程碑)
