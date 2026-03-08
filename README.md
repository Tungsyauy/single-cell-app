# Single Cell Practice

基于 [Bebop Practice Program](https://github.com/Tungsyauy/bpp-web-version) 的简化版：只呈现**一个 cell**（5 个音），先挖掉中间三个音、只显示第一个和最后一个音，并显示所在调；点击「Show Full」可显示完整 5 个音。

## 本地运行

在项目目录下启动本地服务器后，在浏览器打开对应地址即可。

### 使用 Python

```bash
cd single-cell-app
python -m http.server 8000
```

浏览器访问：**http://localhost:8000**

### 使用 Node.js

```bash
cd single-cell-app
npx http-server -p 8000
```

浏览器访问：**http://localhost:8000**

## 使用方式

1. 点击 **Login** 进入调性选择
2. 选择调（如 C、F、Bb…）
3. 进入练习页：先只显示该 cell 的**第一个音**和**最后一个音**（中间三个音用休止代替），并显示「in the key of XXX」
4. 点击 **Show Full** 显示完整 5 个音
5. 点击 **Generate Next** 生成下一个随机 cell（同一调）
6. 右下角 **▶** 播放键：播放当前调对应的 X7sus4 音频（来自 [chord-practice-program](https://github.com/Tungsyauy/chord-practice-program) 的 `audio` 文件夹）
7. 返回箭头可返回调性选择或欢迎页

**播放功能说明**：请将 `chord-practice-program` 的 `audio` 文件夹复制到 `single-cell-app` 内，在 `single-cell-app` 目录下启动服务器（如 `python -m http.server 8000`），访问 **http://localhost:8000** 即可使用播放键。

## 技术说明

- 沿用原程序的 ABC 记谱与 abcjs 渲染
- Cell 数据来自原程序的 `BASE_CELLS`，按所选调 transposition 后随机取一个
- 不修改原仓库 `bpp-web-version`，本程序在独立目录 `single-cell-app` 下
