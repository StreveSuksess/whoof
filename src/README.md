# src/ — oryzo.ai 复刻的可读工程(三层结构的第 ③ 层)

这是 [oryzo.ai](https://oryzo.ai/)(Lusion 出品)的 1:1 学习性复刻的**人写工程层**:
Astro 5 + TypeScript,Three.js r178(与源站锁同版本),`src/engine/` 103 个模块约 1.65 万行,
桌面 + 移动双分支、12 个 section、全场景 + 后处理链,与源站像素级对拍通过。

仅个人学习研究用途;资产与设计版权归 Lusion,**不公开部署、仓库保持私有**(安全默认)。

## 怎么跑

```sh
npm install     # 依赖全部钉版本(three@0.178.0 对齐源站 r178)
npm run dev     # 开发服务
npm run build   # 静态构建 -> dist/
```

自包含契约:把本目录整个复制到任何地方,`npm install` + `npm run build` 即可运行
(仓库根的 `scripts/verify-standalone.mjs --full` 实测过:复制出仓、离线安装、构建、
CLEAN 探针与像素巡航门全绿)。资产账本见 `public/ASSETS.md`(203 文件,全部与镜像逐字节一致)。

## 坐标系怎么读(三段接力)

```
src/engine/**.ts  --(docs/rename-map.json / 注释里的 "pretty NNNN")-->  port/_gen/engine.gen.js
port/_gen         --(切片头 "L####-L####")-->                          mirror/_pretty/hoisted.CRsATKbF.js
mirror/_pretty    --(js-beautify@1.15.1,固定版本)-->                    mirror/_astro/hoisted.CRsATKbF.js(源站原字节)
```

- 引擎代码注释里的 `pretty NNNN` 一律指 `mirror/_pretty/hoisted.CRsATKbF.js` 的行号
  (30,536 行;重新生成命令见 `mirror/_pretty/README.md`,版本钉死所以行号稳定)。
- 符号级溯源查 `docs/rename-map.json`(port 声明 → src 声明,带证据档位),
  由 `scripts/verify-decls.mjs` 双向闭合。src 里**没有**无来源的顶层声明——
  每一个要么映射自 bundle,要么在登记表里有显式理由。
- **在这里发现行为不对,答案在 port/ 或 mirror/,不在这里改**(readable-source.md §1)。

## 哪些注释是我们写的

**全部。** 源站 bundle 的构建剥掉了原作者所有注释,本工程的每一行注释都是逆向时写的。
档位约定(readable-source.md §5):事实直述;溯源用 `pretty NNNN`;推测**显式标注**
("推测:"/"未验证")。GLSL(`engine/glsl/index.ts`)为逐字提取,文件头声明 Do not edit by hand。

## 已登记偏差(完整表在 ../REBUILD_PLAN.md §6 与 ../docs/rename-overrides.json)

- 五大 vendor 库不作逐字移植,用钉版本 npm 包(three / @vimeo/player / gsap SplitText /
  @rive-app/canvas / three-msdf-text-utils)——D-R4。
- 小型 CJS 库(quick-loader / min-signal / detect-ua / normalize-wheel / jsonp 一族)为
  语义重写(D-R5..D-R9);页面路由编排收敛进 main.ts(D-R10);App/Visuals/主循环收敛进
  webgl.ts(D-R12)。
- 未移植:GlPositionOffset(D-O1)、ImageExporter(D-O2)、调试 GUI(D-O3)、
  Bloom 卷积路径(D-O4,有响亮 throw 守卫)。
- SplatsWorker JS + wasm 为镜像字节原样复用(D-R15)。
