# ORYZO.ai 1:1 工程化复刻计划

> 源站:https://oryzo.ai/ — Lusion 出品的创意营销单页(恶搞"AI 软木杯垫"产品站)
> 镜像时间:2026-07-21,快照位于 `legacy-mirror/`(168 个文件,约 19MB)

---

## 1. 镜像内容清单(legacy-mirror/)

| 类别 | 内容 | 说明 |
|---|---|---|
| 页面 | `index.html`(唯一页面,sitemap 只有 `/`) | Astro 静态构建产物 |
| 样式 | `_astro/index.TL6TuoJb.css` | 单 CSS bundle |
| 脚本 | `_astro/hoisted.CRsATKbF.js`(1.1MB) | 单 JS bundle,内联 Three.js r178 + 自研引擎 |
| Worker | `_astro/SplatsWorker-DSMxtdkh.js` | Gaussian Splat 深度排序 worker |
| 3D 模型 | `models/**` 24 个 `.buf` 文件 | **Lusion 自研二进制几何/动画格式**(含相机动画轨道) |
| Splats | `splats/props.sog`(3MB)、`splats/table_reflection.sog` | 3D Gaussian Splatting 场景(SOG 压缩格式) |
| 纹理 | `textures/**` 约 95 个(webp/avif/png,含 26 个 `_MOBILE` 变体) | 含球谐重打光贴图(`harmonics_0/1`)、环境贴图、BRDF LUT、SMAA 查找表、gobo 光斑 |
| Rive | `rive/oryzo.riv` | 开场"设计软件绘 logo"加载动画 |
| 字体 | `fonts/`:Literata、DM Mono(woff2)+ `fonts/msdf/Inter.json/webp` | Inter 为 WebGL 内 MSDF 文字渲染 |
| 图片 | `images/`(社交卡片、证言、视频封面,含 MOBILE 变体) | DOM 层普通图片 |
| 其他 | `meta/`(favicon/manifest/og)、`privacy_policy.pdf`、`terms_and_conditions.pdf` | |

**镜像外部依赖(未入库,复刻时需处理):**
- Adobe Fonts:`https://use.typekit.net/pmn6ngx.css` → **Halyard Display/Text Variable**(主视觉字体,Lusion 的授权,不可自托管)
- Rive WASM:unpkg CDN `@rive-app/canvas-advanced@2.37.0/rive.wasm`
- 视频:Vimeo 托管(ID `1174820580`,dnt 模式嵌入)
- Newsletter:提交到 Lusion 的 Mailchimp(`lusion.us20.list-manage.com/subscribe/post`)
- Cloudflare Insights 统计脚本

## 2. 源站技术栈分析

- **构建**:Astro(静态输出,资源在 `/_astro/`,单页零路由)
- **渲染主体**:全屏 `<canvas>` WebGL2,**Three.js r178 作为底层,上面是 Lusion 自研引擎层**:
  - 自研资源加载器(XHR 队列 + 全量预载,loader 进度驱动 Rive 开场动画)
  - 自研虚拟滚动(监听原生滚动 + 平滑插值,无 ScrollTrigger;总滚动高度约 46,000px)
  - 自研 `.buf` 二进制模型/动画格式(几何 + 相机/物体动画轨道烘焙)
  - 3D Gaussian Splatting(`.sog` 压缩格式 + Web Worker 排序)
  - 球谐(Spherical Harmonics)重打光:大量 `harmonics_0/1` 贴图,实现低成本动态光照
  - MSDF 文字(WebGL 内渲染 Inter)
  - 后处理:SMAA、AgX/filmic tonemapping、gobo 投影光斑、镜头污渍等(GLSL 内联在 bundle)
- **2D 动画**:GSAP(核心,无插件)+ Rive 2.37.0(开场 loader)
- **DOM 层**:普通 HTML 文案/UI 覆盖在 canvas 上,`is-desktop/is-mobile` 分支,移动端自动换 `_MOBILE` 低清资源(800px vs 2560px 纹理上限)
- **视频**:@vimeo/player 弹层
- **托管**:Cloudflare(Pages 或同等静态托管 + CDN)

## 3. 页面结构(单页滚动叙事,约 46k px)

1. **Hero**:切割垫 3D 场景(杯垫 + 铅笔/美工刀/回形针),开场为 Rive"贝塞尔绘 logo"动画,滚动驱动相机(`hero_camera.buf`)
2. **AI 手**:"TRY TO HOVER HAND" 交互手模型(`hand.buf` + 动画),六指玩笑
3. **Wearable**:针织口袋杯垫 + 横向画廊(yoga/bikini/glasses/bite/pocket 等)+ 杂志页
4. **Features**:桌面场景(Gaussian Splat 道具 + 咖啡杯热感应渐变、烟雾球谐动画、水熊虫显微镜头)
5. **Sustainability**:浅色大字排版段(`sustainability_text.buf` 3D 文字)
6. **Product**:三档杯垫对比表(STACK 1/2/3)
7. **ORYZO-1**:恶搞论文/开源模型段(链接 GitHub `lusionltd/ORYZO-1`)
8. **Testimonies**:证言卡片
9. **Contact/Footer**:Newsletter 表单(Mailchimp)+ 社交链接

## 4. 工程化复刻方案

### 阶段 0 — 资产与外部依赖前置 ✅(2026-07-21 完成)
- **定位为个人复刻学习项目,不对外发布** → 版权问题搁置;唯一约束:不要把 Lusion 资产再分发(仓库勿公开)
- Halyard 字体:保留源站的 Typekit CSS 引用(`use.typekit.net/pmn6ngx.css`),本地开发可正常加载;若失效再换近似字体
- Rive wasm:沿用 unpkg CDN 加载(phase 2 引入 runtime 时处理)
- Vimeo / Mailchimp:保留原引用(个人使用无碍)

### 阶段 1 — 骨架 ✅(2026-07-21 完成)
- Astro 5 工程:`src/pages/index.astro` + `src/layouts/Layout.astro` + 18 个组件(12 个 section + SvgDefs/SiteHeader/SiteFooter/ScrollIndicator/Preloader/VideoOverlay)
- 组件由 `scripts/gen_components.py` 从 `legacy-mirror/index.html` 生成:保守 pretty-print(只在原有空白间隙换行、紧贴处保持紧贴、花括号转义防 Astro 模板语法冲突)
- **构建产物 body 与源站逐字节等价**(空白归一化后 diff 为空);浏览器验证 scrollHeight 46410px 与源站一致
- 静态资源(fonts/images/meta/textures/models/splats/rive/PDF,约 18MB)复制到 `public/`
- `src/styles/main.css` = 源站 CSS 原样;`src/styles/phase1-shims.css` = 临时 shim(`.page` 淡入、preloader 隐藏、desktop-only 显隐、canvas 黑底),**每条 shim 都将在 phase 2 被引擎逻辑取代**
- 已知现状:各 section 内层元素为 fixed/absolute 定位,静态骨架下全部叠加显示——属预期,显隐/transform 由 phase 2 引擎按滚动驱动

### 阶段 2 — 引擎层(2–4 周,核心难点)
- ✅ **M2.0 引擎逆向文档**(2026-07-21):`docs/engine-notes.md`——.buf/.sog 二进制布局、
  滚动系统机制、材质与后处理清单全部厘清。两个私有格式远比预期简单:
  `.buf` = uint32 头长 + JSON 头 + 顺序排列的量化属性;`.sog` = PlayCanvas SOG(无压缩 ZIP + webp + codebook)
- ✅ **M2.1 `.buf` 解析器**(2026-07-21):`src/engine/BufLoader.ts`(1:1 移植源站 BufItem 解码),
  `/debug/buf` 调试页(模型下拉 + OrbitControls + 贴图验证 + 相机轨迹可视化)。
  验收:25/25 模型全部解析成功;coaster 几何/UV 完美;hand 含骨骼权重属性正常;
  CAMERA_ANIM 320 帧运镜轨迹正确(注:hero_camera 位置 delta=0 属数据本身——hero 相机只转不动)
- ✅ **M2.2 引擎骨架**(2026-07-21):`src/engine/core/`(math/settings/properties/input/Loader/ScrollPane)。
  ScrollPane 从 bundle 1:1 直译(原生滚动条同步、滚轮缓动 wheelEaseCoeff=12、拖拽摩擦、DOM range 映射、
  scrollTo 锚点);Loader 并发 XHR 队列 + 字节级进度 + 按扩展名解析;phase1-shims.css 已删除,
  引擎接管状态类/preloader 关闭/页面淡入/锚点导航。浏览器验证:滚轮缓动、锚点平滑滚动到 12.8k px
- 🟡 **M2.3 Hero 场景端到端**(进行中):已完成竖切片骨架——`src/engine/webgl.ts` 渲染器上线,
  `FrameAnimation` 1:1 直译(帧 lerp/slerp + focal→fov,aperture 41.4214),滚动驱动链路打通
  (AI 段 showScreenOffset → fit(0,5.5) → 相机+杯垫动画,与源站 HandScene 一致),
  杯垫贴图渲染在 #4c3e37 背景上,俯视→推近→终点的运镜已验证。
  已完成(2026-07-21 续):**section 通用显隐管理器**(`src/engine/sections.ts`,Section 基类直译,
  修复了叠加显示)、**切割垫底景**(BASE.webp 按源站 screen-to-world 常数投到桌面平面,
  focal 50/aperture 41.4/view 2240×1260/桌面 y=0.7471)、fov 每帧钉在 hero 常量(同源站 HandScene)、
  hand 段结束后 3D 内容隐藏(r>9)。滚动 0 处构图已接近源站 hero。
  已完成(2026-07-21 三轮,commit 8c66cba,**全部逻辑溯源 bundle,替换了此前的近似实现**):
  34 段 GLSL 原文提取入 `src/engine/glsl/`;core 移植 fboHelper/shaderHelper/blueNoise/
  textureHelper(GPU 通道打包 DIFF+HEIGHT、RGBM 解码)/cameraControls/Settings/properties.sharedUniforms;
  场景移植 bg(渐变+clearColor 混合)/gobo(512 RT+文件名强度)/coaster(**真实 coasterFrag**:
  env combine RT、局部光、zoom center)/heroScene(阶段性:常数+uniforms+固定相机位+gobo 矩阵);
  App/Visuals 编排按源站顺序,分辨率数学照抄 _onResize;修正 activeRatio 应取 hero 段 hideScreenOffset。
  已完成(2026-07-21 四轮,commit 517a384):**hero RT 管线全量移植**——heroScene(2D 正交场景→RT,
  两遍道具阴影:半分辨率模糊+plain,camera2D 缩放模糊)、heroSceneBase(baseVert/baseFrag 原文:
  screen-to-world 桌面投影、杯垫椭球软阴影、gobo)、7 个文具 props 全套物理
  (SecondOrderDynamics 鼠标缓动、摆动+angular-RGB 帧、位移钳制、startTime+hash2 入场)、
  deskPad 画布、Blur/Ease/SecondOrderDynamics core 移植。
  **同视口与源站比对通过**:网格 37-38px vs 源站 ~37-40px,杯垫直径/构图/旋转一致。
  教训:目测像素会骗人,量化比对要用脚本量截图。
  已完成(2026-07-21 五轮,commit 4bc05b8):**HandScene + Hand 全量移植**——骨骼纹理 GPU 蒙皮
  (36 骨骼逐帧插值进 float DataTexture、两遍骨骼层级求解 + ROOT 变换)、六指交互
  (标量 SecondOrderDynamics 由鼠标 Y 驱动手指骨骼)、AI_HAND 2×2 图集帧混合、
  handVert/handFrag 原文(GPU 四元数蒙皮、双光源高光+次表面散射)。
  修正:HAND_FRAME_START/END 实为 71/116(此前误猜 47);coaster.isActive 溯源为
  WearableScene 的 t<=3。webgl.ts 的临时编排已替换为移植类。
  已完成(2026-07-21 六轮,commit eafdab4):**postprocessing 主链**——Postprocessing 框架
  (MRT 场景目标 color+velocity、乒乓 RT、队列过滤排序、PostProfile blend/sync)、
  TAA(Catmull-Rom 历史重采样+邻域钳制)+ Halton 抖动相机 + TAAMesh(coaster/hand 已切换,
  输出速度缓冲)、FXAA、SMAA(edges/weights/blend 三 pass + 不翻转的查找表)、
  AppleEfx(LMS 渐变边框辉光)、Final(vignette/饱和度/对比度/tint + preloader 揭幕 pass)。
  调试实录:①Vite 分包导致 instanceof 跨 chunk 失败(抖动矩阵恒单位阵→杯垫隐形),改鸭子类型;
  ②coaster.isActive 必须在 preUpdate 链内 resetTransform 之后设置(源站由 WearableScene 做);
  ③后台标签页 RAF 饥饿会让 TAA 历史帧看似"抹平画面",连续前台帧即收敛,验收时要注意。
  已完成(2026-07-21 七轮,commit a90897b):**Bloom(非卷积路径,USE_CONVOLUTION=false)**——
  highPass/blur/composite 三 pass 原文提取;SMAA 查找表经 loader onLoad 补 image;
  TAAMesh 加 OES_draw_buffers_indexed 关闭速度附件混合。
  同轮修复"整屏抹平"回归:根因是 ScrollManager 滚动条指示器子系统未移植 →
  scrollManager.scrollBarCenter 为 undefined → AppleEfx 的 u_pulseCenter.y = NaN →
  shader 里 wave=w0*w1*u_amount 即 NaN*0=NaN → 采样 uv 全 NaN → 恒定色。
  已按源站(pretty 29688-29719)补齐指示器驱动(bar transform/opacity/cursor、
  拖拽滚动、点击滚到 #open-weight、scrollBarCenter)+ input.onClicked 信号
  + HeroSection 尾部 scrollManager.isBtn = activeRatio > .99(pretty 21257)。
  调试实录:效果链逐阶段像素采样定位到 AppleEfx(此前逐一禁用 TAA/SMAA/FXAA/Bloom
  均未涉及它);全新加载验收必须不做任何手动切换。
  已完成(2026-07-21 八轮,commit 49918aa):**Bokeh/BlurBox/ScreenPaint(Distortion)**——
  Bokeh 四 pass(CoC 预滤波→半分辨率盘形核→tent 模糊→合成,USE_FLOAT 字节打包回退);
  BlurBox 圆角矩形渐变模糊(hero 卡片编排溯源 HeroSection.update 21210-21215,
  每帧 pagesManager.update 处 reset);ScreenPaint 1/4 分辨率涂抹速度场模拟 +
  ScreenPaintDistortion(9-tap 方向模糊 + RGB shift);input 补
  mousePixelXY/hadMoved。帧循环保真:dt 钳制 1/20、startTime 不封顶(源 30523)。
  修复 avif 探测竞态:源站 preRun 先跑完 browserSupport loader 轮才 run()/preInit
  (30460-30465),boot 改为先 await testSupport()——顺带修复 gobo 纹理静默 404
  (只镜像了 .avif,竞态时请求 .png),hero 桌面光斑(gobo 投影)自此才真正出现。
  已完成(2026-07-21 九轮,commit 7a32635):**Preloader canvas 动画 + 启动时序**——
  光圈双环 + Illustrator 锚点/贝塞尔手柄、环间虚线进度饼、径向渐变光泽,
  环半径随 startTime 收缩恰好落在杯垫轮廓上(源 30217-30290 逐行);
  启动流程改为源站 preRun/run/init/start 四段(is-ready 在 run 期加上→
  preloader 背景转透明露出实时 WebGL 帧;loader 进度驱动 _targetPercent;
  percent==1 触发 init;0.1s init→start 间隔后 start);帧循环无条件跑
  webglApp.update(加载期由 Final preloader 分支画深绿底);Page.show 的
  0.3s opacity tween stand-in 取代旧 CSS 淡入 hack。
  查证:cameraMotionBlurAmount 在源站仅有 PostProfile 字段、无消费点(死代码),
  无需移植——M2.3 后处理链就此闭环。
  已完成(2026-07-21 十轮,commits 151a4aa/f5a73c3):**DeviceOrientation + Wearable 集群**——
  DeviceOrientationControls 1:1(YXZ 欧拉四元数、iOS requestPermission 门控、
  onFirstClicked 信号)+ cameraControls 移动端双 slerp 分支 + 手指虚拟鼠标分支;
  WearableCondom(1024 骨 ×32 帧打包动画纹理蒙皮、前后双 TAAMesh、谐波 AO、
  cacheScene 折射)、WearableText(MSDF 双 rect 插值辉光字)、WearableFrame
  (杂志照片框:模糊晕影、clip 蒙版、MSDF pin、绕 u_zoom 缩放)、WearableScene
  (杯垫旋转下落、撕膜、bloom 脉冲 profile)、WearableSectionCanvas(2D 虚线选择框)、
  WearableSection 驱动(gallery index 数学→动画链、文字 rect 编排、gsap SplitText
  标题逐字符,gsap 已入依赖)。基建:postprocessing.cacheScene、
  fboHelper.clearMultisampleRenderTargetState、DomGLRect、loader channel 选项。
  验收:包装(ORYZO 橙色印花)→撕开→杯垫自由旋转 + "it's wearable" bloom 辉光全链路。
  已完成(2026-07-22 十一轮,commit 699f72d):**table 集群**——TableScene
  (features/encryption 桌面序列:相机/杯垫/咖啡三条 FrameAnimation 关键帧映射、
  gallery 退出的 zoom/rotation 交接、杯垫翻面状态机 + 随机翻转轴、scissor 生长数学、
  env RGBM 混合)、TableBase(DESK/PINBOARD/WALL 双三次纹理 + 咖啡/杯垫逆矩阵
  SDF 软阴影 + HD 桌面叠加 + splat 反射 RT、TRAY_COVERS 阴影层、PINBOARD 双实例)、
  TableCoffee(谐波动画杯身、热感重着色、83×184 烟雾 RT 模拟)、TableGrip 家族
  (软木特写、显微条带、WiggleSystem verlet 骨链 + BrownianMotion fBm 驱动水熊、
  2D 水熊精灵鼠标碰撞)、ThermodynamicOverlay(热感 LUT 擦除)。
  发现并保真:源站 mipFilter 是 TextureItem 死参数(仅 magFilter 生效)。
  验收:桌面 + 洞洞板 + gobo 光影 + **splat 道具(手柄/键盘)実渲染** + 咖啡杯
  落桌,scissor 裁剪在 wearable 框内,零控制台报错——M2.4 像素级验收一并完成。
  **剩余(均为源站有、尚未移植)**:wearable 的 gallery DOM/magazine/rise、
  coaster encryption MSDF 文字与背面材质、features/encryption/grip section DOM
  驱动(animation 3..10 段)、sustainability/stack/footer 场景、sketches、
  全站 split-text 编排、siteHeader/siteFooter
- ✅ **M2.4 `.sog` Splat 加载器**(2026-07-22,commit a52f270):SogLoader(无压缩 ZIP
  解析 webp 平面 + codebook、GPU 合成打包 RGBA32UI splat 纹理 + RGBA8 sh0、
  16 位重组 + unlog 读回中心点)、Splats 渲染器(EWA 协方差投影 + SH 频带求值原文、
  相机方向触发的 WASM 基数排序 worker)。补齐镜像缺口:splat_sorter_bg wasm 是
  worker 运行时才 fetch 的,当初镜像没抓到,已从源站补入 legacy-mirror 与 public。
  Loader 增补:post-preload 的 load()、channel 语义修正(= 通道数 R8/RG8,非 uv 通道)。
  验证:props.sog 67486 splats 解析、worker READY、排序完成 full draw range;
  像素级渲染随 TableScene 集成验收(那里才有正确的空间变换)
- ⬜ **M2.5 材质体系**:球谐重打光、MSDF 文字、后处理链(SMAA/AgX/gobo)——GLSL 从 bundle 提取

### 阶段 3 — 分场景还原(3–5 周)
- 按 section 逐个还原:Hero → 手 → Wearable → 桌面 → Sustainability → 对比表 → 论文段 → Footer
- Rive 开场动画(`.riv` 文件可直接复用,官方 runtime 播放)
- Vimeo 弹层、Mailchimp 表单(换成自己的 list 端点)

### 阶段 4 — 打磨(1–2 周)
- 移动端 `_MOBILE` 资源分支、降级策略(WebGL2 检测)
- 性能:预载体积约 19MB,需还原其分包/优先级策略
- 像素级比对(截图 diff)、Lighthouse、多浏览器验证

## 5. 难点评估

| 难点 | 等级 | 说明 / 对策 |
|---|---|---|
| 自研 `.buf` 模型格式 | ★★★★☆ | 无文档,需从 bundle 逆向 parser(代码为压缩非加密,可读);或写 buf→glTF 转换器 |
| Gaussian Splatting(.sog) | ★★★★☆ | SOG 压缩格式 + worker 排序 + 与传统 mesh 混合渲染、还要参与反射,生态工具少 |
| 球谐重打光材质体系 | ★★★★☆ | harmonics 贴图的采样/合成 shader 需从 bundle 提取 GLSL 并理解重组 |
| 46k px 滚动编排 | ★★★★☆ | 相机轨道烘焙在 .buf 内,滚动↔时间轴映射、DOM 与 WebGL 同步、平滑插值手感难调到 1:1 |
| 自定义 GLSL 后处理链 | ★★★☆☆ | SMAA/AgX/gobo/热感应/烟雾等,shader 字符串可提取,但组装顺序和参数要逐帧比对 |
| 开场 loader 编排 | ★★☆☆☆ | Rive 文件可直接复用,难点在加载进度与动画状态机的绑定 |
| 字体授权 | ★★☆☆☆ | Halyard 是 Adobe Fonts 商用授权,不能自托管;要么订阅要么换字体 |
| **资产版权** | ★★★★★ | **最大风险是法务而非技术**:模型、贴图、文案、品牌全为 Lusion 原创。技术上可 1:1,公开发布必须先有授权 |

**总体判断**:纯技术上可行,预计 6–10 周(单人全职、有 WebGL 经验)。最大的工程难点是 `.buf`/`.sog` 私有格式与球谐光照材质的逆向;最大的非工程风险是版权。省力路径:资产与 shader 全部从 bundle/镜像直接复用(逆向工作量最小),自己只重写工程骨架与编排层。
