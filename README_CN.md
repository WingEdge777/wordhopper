# Word Hopper

[English](./README.md)

**Type to survive. Jump to thrive.**

把打字练习做成横版跑酷：打完障碍上的单词，在**绿色时机线**附近按空格起跳，穿过对应间隙。

**在线游玩：** [https://wordhopper.baizeway.com](https://wordhopper.baizeway.com/)

> 推荐在 **桌面端 + 实体键盘** 上游玩。移动端仅供预览。

---

## 为什么做这个

纯打字练习有效但无聊。Word Hopper 保留准确率、速度、WPM 的练习闭环，再叠上跑酷节奏：选词 → 打完 → 卡时机起跳 → 追破纪录。

## 玩法

障碍从右侧滚来，每个显示一到两个单词。

1. **输入首字母** 选中一个单词  
2. **继续输入** 打完整个单词  
3. **在绿色时机线附近按空格** 跳过对应间隙  

打错需从出错位置继续（连击中断）。撞到障碍则本局结束。

越靠近绿线起跳评价越好（`PERFECT` / `GOOD`）。清障越多，速度越快。

### 难度

| 模式 | 词长 | 速度 |
|------|------|------|
| **Chill** | 3–5 字符 | 0.5× |
| **Easy** | 3–5 字符 | 1.0× |
| **Medium** | 6–8 字符 | 1.0× |
| **Hard** | 8+ 字符 | 1.0× |

## 功能

- 四档难度与较大词库  
- 局内显示本地 BEST（接近纪录时呼吸闪烁）  
- 分难度全球排行榜  
- 自动生成昵称（可改）  
- 成绩分享链接  
- 首局教程提示  
- 打完单词可显示中文释义（界面为英文）

## 技术栈

| 层 | 技术 |
|----|------|
| 游戏 | Phaser 3、TypeScript、Vite、Bun |
| API | FastAPI、SQLite |
| 部署 | GitHub Actions → VPS（Nginx） |

成绩提交使用短期 run token，并做服务端合理性校验（挡不住死磕作弊，但能挡住随手 curl）。

## 开发

```bash
bun install
bun run dev      # 游戏 + Vite 代理 /api
bun run build
bun run preview
bun run test
bun run lint
```

### API 服务

```bash
cd server
python3 -m pip install -r requirements.txt
./start.sh
```
