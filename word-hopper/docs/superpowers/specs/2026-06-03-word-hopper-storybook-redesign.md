# Word Hopper 绘本童话森林 风格重设计

## 概述

将 Word Hopper 从暗色调像素风（Pixel Nature Night）彻底重新设计为 **温暖可爱的绘本童话森林风格**，主角替换为知乎吉祥物 **刘看山**。所有资源从纯代码手绘 Graphics API 改为 SVG/PNG 图片资源加载。

## 1. 整体氛围

- **Mood**：午后阳光穿过树叶的温暖金色森林，像儿童绘本翻开的第一页
- **关键词**：温暖、柔和、圆润、可爱、明亮
- **拒绝**：暗夜、像素格、锐利线条、冷色调、恐怖感

## 2. 配色方案

| 元素 | Hex | 说明 |
|---|---|---|
| 天空（上） | `#FFF8E7` | 暖奶油色 |
| 天空（下） | `#E8F4FD` | 浅蓝白过渡 |
| 远景树冠 | `#A8D8A8` | 柔和的暖绿 |
| 中景树木 | `#7BC67B` | 稍深暖绿 |
| 地面草色 | `#8ECB6E` | 嫩草绿 |
| 地面阴影 | `#6BA85C` | 稍深草绿 |
| 阳光光斑 | `#FFF4CC` | 暖金黄，半透明 |
| 土色/树干 | `#C4956A` | 暖棕 |
| 蘑菇伞盖 | `#E8846B` | 暖红 |
| 蘑菇斑点 | `#FFFDF5` | 米白 |
| UI 主文字 | `#5C4A3E` | 暖深棕 |
| UI 次文字 | `#8B7355` | 浅棕 |
| 按钮底 | `#FFE0B2` | 暖杏色 |
| 按钮悬停 | `#FFCC80` | 深杏色 |
| 死亡蒙层 | `rgba(255,248,231,0.85)` | 暖奶油半透 |

## 3. 刘看山角色设计

### 特征
- 白色圆润身体
- 两只小黑色圆点眼睛
- 尖耳朵（头顶两侧竖起）
- 极简面部，无嘴巴或只有一线
- 整体约 48-64px 高

### 三个动画帧

| 帧 | 文件名 | 描述 |
|---|---|---|
| 站立 | `liukanshan-idle.svg` | 端正站立，耳朵竖起，目视前方 |
| 跳跃 | `liukanshan-jump.svg` | 身体微倾/拉伸，耳朵飞飘，跃起姿态 |
| 阵亡 | `liukanshan-dead.svg` | 坐倒或趴倒，眼睛 >< 或眯眯线，委屈但不恐怖 |

### 额外
- 作为可选项，后续可加站立时的轻微上下浮动（Tween 缩放/位移，不需要新帧）

## 4. 障碍物设计

绘本化植物，圆润柔软感，带淡淡描边/阴影。

| 类型 | 文件名 | 本体描述 | 绘本化处理 |
|---|---|---|---|
| 蘑菇 | `obstacle-mushroom.svg` | 圆润伞盖 + 粗短菌柄 | 暖红伞盖 + 米白圆斑，菌柄略粗短 |
| 树桩 | `obstacle-stump.svg` | 圆弧顶面的矮树桩 | 暖棕色，顶面有年轮圆圈线 |
| 灌木 | `obstacle-bush.svg` | 圆滚滚的半球形丛 | 嫩绿色，像修剪过的球状灌木 |
| 花丛 | `obstacle-flowers.svg` | 几朵雏菊簇 | 暖黄心 + 白色花瓣，3-4 朵挤一起 |

每种障碍物有上体和下体两部分，中间形成空隙供刘看山跳过。单词（两个或一个）挂在障碍物表面显示。

**生成方式**：SVG 文件 → `load.image()` 加载，场景中用 `Phaser.GameObjects.Sprite` 渲染。

## 5. 游戏场景层次

4 层视差滚动（从远到近）：

| 层 | 内容 | 滚动速度 | 渲染方式 |
|---|---|---|---|
| 1 最远 | 奶油色天空渐变 + 模糊远景树冠剪影 | 固定不滚 | 静态背景图 |
| 2 中景 | 暖绿色圆形树冠群 + 金色阳光光斑粒子 | 0.2x | Sprite + 粒子 |
| 3 地面 | 起伏的草绿色丘陵，刘看山在上面 | 1.0x | 滚动的地面图 |
| 4 前景 | 偶尔飘过的装饰小草小花 | 1.5x | 装饰 Sprite |

地面从现在的平直线改为柔和起伏的曲线。ground.png 可以是一段波浪形草地，repeat 平铺。

## 6. UI & 排版

### 字体方向
| 用途 | 字体 | 加载方式 |
|---|---|---|
| 标题 LOGO | Nunito 或类似圆润字体 | Google Fonts |
| UI 标签 | Nunito / Quicksand | Google Fonts |
| 障碍物单词 | JetBrains Mono（保持现有） | Google Fonts |

### 场景专属设计

#### BootScene
- 暖奶油底 + 刘看山坐在加载条旁边
- 加载条为圆角杏色滑块
- 顶部一行 "Word Hopper" 用标题字体

#### MenuScene
- 像绘本封面页
- 上方标题 + 刘看山站在一棵大树桩旁边
- 难度选择按钮：圆角杏色卡片，选中时更大/更亮
- "PRESS SPACE TO START" 用暖棕色小字，柔和脉冲动画

#### GameScene
- 上述 4 层视差森林
- 打字提示：屏幕底部中心的浅杏色圆角条
- 分数 HUD 右上角，暖棕色字
- 计时虚线改为柔和虚线

#### DeathScene
- 暖奶油色半透明蒙层覆盖游戏画面
- 刘看山坐/趴在地上，委屈表情
- 当前 Score vs Best Score 卡片对比（杏色卡片 + 暖棕字）
- 进度条显示本次得分占最高分的百分比
- RETRY 和 MENU 按钮：圆角，杏色底，hover 变深
- Space 重试，Esc 回菜单

## 7. 技术架构

### 资源目录
```
public/assets/
  sprites/
    liukanshan-idle.png
    liukanshan-jump.png
    liukanshan-dead.png
    obstacle-mushroom.png
    obstacle-stump.png
    obstacle-bush.png
    obstacle-flowers.png
    background-sky.png
    background-ground.png
```

### 加载流程
- BootScene.preload() 中 `this.load.image()` 加载所有资源
- 加载完成后纹理存 Phaser TextureManager，各场景直接用

### 需要构造的资源
1. 所有 SVG 角色帧转为 PNG（或直接使用 SVG/inline data URI）
2. 背景图（天空渐变 + 远景树冠）
3. 地面图（一段可平铺的波浪草地）
4. 四种障碍物图片

### 渲染器
保持 `Phaser.CANVAS` 不变。如果后续性能有问题，可改为 `Phaser.AUTO` 启用 WebGL。

## 8. 受影响的文件

| 文件 | 变更 |
|---|---|
| `src/entities/Player.ts` | 从 Graphics 容器改为 Sprite，加载刘看山图片，切换帧 |
| `src/entities/Obstacle.ts` | 从 Graphics 容器改为 Sprite + Text，加载植物图片 |
| `src/scenes/BootScene.ts` | 添加 `load.image()` 调用，改为新 UI |
| `src/scenes/MenuScene.ts` | 全部重绘为新 UI |
| `src/scenes/GameScene.ts` | 4 层视差从 Graphics 改为图片 + Sprite |
| `src/scenes/DeathScene.ts` | 全部重绘为新 UI |
| `src/config/colors.ts` | 替换为新的暖色配色 |
| `src/config/constants.ts` | 移除不再需要的植物类型枚举，添加图片 key 常量 |
| `src/utils/PixelArt.ts` | 可能不再需要，简化或删除 |
| `index.html` | 更新字体 CDN link |
| `public/assets/` | 添加所有资源文件 |

## 9. 不计入当前范围
- 音效 / 音乐
- 移动端触控适配
- 多语言
- 关卡系统
- 粒子效果细化