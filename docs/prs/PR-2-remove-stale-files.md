# PR 2: chore/remove-stale-files — 清理过期的备份与历史遗留文件

## 📋 概述

本 PR 解决以下已知问题：
- **过期备份文件清理**：在先前的 README 重构和 redesign 之后，代码库中遗留了几个大体积的备份与历史 Markdown 文件。这些文件不仅占用了代码库空间（累计超过 220KB），而且容易误导开发者阅读过时或无效的文档。

通过本 PR，清除了以下历史文件，保持仓库的整洁：
1. 项目根目录下的 `README.md.bak` (93KB)
2. `packages/core/README-pre-redesign.md` (64KB)
3. `packages/mcp-server/README-pre-redesign.md` (64KB)

---

## 🛠️ 变更详情

### 被删除的物理文件
- **`README.md.bak`**：位于项目根目录，是 README 中英双语重设计前的备份。
- **`packages/core/README-pre-redesign.md`**：位于核心包目录下的重构前 README。
- **`packages/mcp-server/README-pre-redesign.md`**：位于 MCP 包目录下的重构前 README。

---

## 🧪 验证与测试

1. **构建与运行校验**：运行 `npm run build` 和 `npm test`，确认被删除的文件仅属于文档/备份，对核心业务逻辑、MCP 协议命令、TS 编译没有任何影响。
2. **仓库状态检查**：运行 `git status` 确保已被正确跟踪并标记为删除。
