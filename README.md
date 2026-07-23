# oryzo-rebuild

对 [oryzo.ai](https://oryzo.ai/)(Lusion 出品的创意营销单页,一个恶搞"AI 软木杯垫"的虚构产品站)的 **1:1 工程化复刻**。

> ⚠️ **仅供个人学习研究。** 站点的模型、贴图、文案、品牌、字体授权全部归 Lusion 所有,本仓库不公开部署、不用于任何商业用途。`legacy-mirror/` 与 `public/` 中的资产均为学习用途的镜像副本。

## 为什么做这个

oryzo.ai 是近年少见的"教科书级"创意站:全屏 WebGL2 + 约 46,000px 的滚动叙事,把 3D Gaussian Splatting、球谐重打光、MSDF 文字、自研后处理链、GSAP SplitText 编排揉在一个 1.1MB 的 bundle 里,而且性能极佳。市面上没有任何一篇文章讲它是怎么做的——那就把它整个拆开,亲手重建一遍。

目标不是"做一个像的",而是**逐行为对齐的复刻**:源站有的都要有,源站没有的不做,所有代码逻辑可溯源到原始 bundle。

## 重建思路

**1. 镜像。** 先完整抓取站点(HTML/CSS/JS/模型/贴图/Splats/Rive/字体),约 168 个文件存入 `legacy-mirror/`。后续发现三类"抓不到"的资产——worker 运行时才 fetch 的 WASM、懒加载的画廊图片、移动端专属变体——都在对应里程碑里从源站补录。

**2. 逆向。** 站点 JS 是压缩但未混淆的单 bundle(内联 Three.js r178 + Lusion 自研引擎层)。用 js-beautify 展开成 3 万行可读代码,从中逆向出:

- `.buf` 私有二进制格式:`[uint32 头长][JSON 头][顺序排列的属性载荷]`,承载几何与相机/物体动画轨道;
- `.sog` 格式:PlayCanvas SOG(无压缩 ZIP 包 webp 平面 + codebook),GPU 合成为打包 RGBA32UI splat 纹理,配 WASM worker 做深度排序;
- 后处理链的完整拓扑:MRT 场景 RT(颜色+速度)→ TAA → SMAA/FXAA → 选择性 Bloom → Bokeh → BlurBox → 屏幕涂抹扭曲 → Final(暗角/调色/抖动)。

**3. 严格溯源移植。** 工程骨架换成 Astro 5 + TypeScript,但引擎逻辑逐类逐函数对照 bundle 移植;所有 GLSL 用脚本从 bundle **逐字提取**,不做任何"优化"或近似。连源码里的死代码也按原样镜像(如 `mipFilter` 是 TextureItem 的死参数、光场 RT 的 `format = "R8"` 赋在了错误的对象上)——因为"修正"它们反而会偏离源站的实际渲染结果。

**4. 里程碑推进 + 三重验证。** 按"引擎核心 → 场景集群 → section 驱动 → 站点 chrome"的顺序分约 20 个里程碑,每个里程碑:

- **全新加载验证**(不手动切效果——手动切换会掩盖初始化状态 bug,这是踩过的坑);
- **无头浏览器回归**(puppeteer 驱动,桌面 + iPhone 级移动仿真两条分支);
- **与源站并排像素比对**(同视口、按 section 对齐的 14 个滚动点,连平均亮度都对到 ±0.5)。

完整的里程碑日志(包括每一次踩坑与修复)见 [REBUILD_PLAN.md](./REBUILD_PLAN.md)。

## 难点清单

| 难点 | 说明 |
|---|---|
| `.buf` / `.sog` 私有格式 | 无文档,纯逆向;WASM 排序器是 worker 运行时才请求的,镜像里根本没有 |
| 球谐重打光 | 材质不走传统光照,而是采样烘焙的 harmonics 贴图对做低成本动态重打光,采样/重组 shader 需从 bundle 精确提取 |
| 46k px 滚动编排 | 相机轨道烘焙在 `.buf` 里,十几个 section 各自把 `showScreenOffset` 映射到场景 `animation` 值,交接点(如 wearable→table、testimonies→product)的先后顺序都有讲究 |
| 后处理链拓扑 | 十余个 pass 的组装顺序、ping-pong RT 的交换时机、TAA 的 Halton 抖动,错一环画面就崩 |
| 隐蔽的状态 bug | 例:滚动指示器一个未初始化字段 → NaN 传染 AppleEfx → 整屏变成一坨绿色;只有全新加载才暴露 |
| 色彩空间 | Loader 漏掉一行 `texture.colorSpace` 赋值,8 处 sRGB 纹理少了 GPU 解码,整个切割垫场景整体偏亮发灰——靠真机对比才发现 |
| 字体竞态 | SplitText 在 Adobe Fonts 的 Halyard 就绪前测量会用回退字体切行并永久定格,需在 `document.fonts.ready` 后补一次 resize |
| CPU 粒子物理 | footer 的咖啡豆:漂移螺旋路径 + 鼠标推力 + O(n²) 接触解算 + slerp 朝向,逐帧写入 DataTexture |

## 本地部署

依赖 Node 18+。

```bash
npm install
npm run dev        # 开发模式,默认 http://localhost:4321
```

或构建后预览(更接近生产行为,推荐用这个看效果):

```bash
npm run build
npm run preview -- --port 4321
```

注意事项:

- **首次加载约 19MB 资产**,预载动画会跑十几秒,属正常;
- **主视觉字体 Halyard** 通过 Adobe Fonts(typekit)在线加载,离线环境会回退到系统字体(布局仍正确,观感有差);该字体系 Adobe 授权,不能自托管,故不在仓库内;
- 需要支持 **WebGL2** 的浏览器;
- 移动端布局会自动启用(触摸 + 视口 <820px),并切换 `_MOBILE` 低清资产。

## 技术栈

- [Astro 5](https://astro.build/)(静态输出,工程骨架)
- [Three.js r178](https://threejs.org/)(与源站同版本锁定)
- 引擎层 100% 对照源站自研实现:自定义 Loader/虚拟滚动/`.buf`/`.sog` 解析、后处理链、场景与 section 编排(`src/engine/`)
- GSAP SplitText、Rive(开场动画)、Vimeo Player、three-msdf-text-utils(源站 vendored 的同一库)

## 目录速览

```
legacy-mirror/     源站完整镜像(逆向的原始依据)
public/            运行时资产(模型/贴图/splats/字体/图片)
src/engine/        引擎层:core(基建)/ scenes(场景)/ sections(DOM 驱动)/ post(后处理)/ glsl(逐字提取的 shader)
src/components/    页面 DOM(按源站结构还原的 Astro 组件)
REBUILD_PLAN.md    逆向笔记 + 里程碑日志
```
