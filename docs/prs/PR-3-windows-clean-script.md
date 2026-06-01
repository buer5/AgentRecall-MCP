# PR 3: fix/windows-clean-script — 跨平台 Windows 兼容构建脚本修复

## 📋 概述

本 PR 解决以下已知问题：
- **Windows `clean` 脚本不兼容**：根目录 `package.json` 中的 `clean` 脚本使用 `rm -rf`，并且 `sync-readme` 使用了 `cp` 语法。这些是 Unix 专属命令，在 Windows (PowerShell/CMD) 环境下会报错失败，给 Windows 开发者带来编译和清理障碍。

通过本 PR，这两个脚本被重写为纯 Node.js 标准库实现（无需安装第三方依赖如 `rimraf`），天然实现跨平台一致运行。

---

## 🛠️ 变更详情

### 根目录 `package.json` 脚本重写

- **修改文件：** [package.json](file:///D:/project/AgentRecall-MCP-main/repo/package.json#L10)
- **变更：**
  ```diff
  - "sync-readme": "cp README.md packages/core/README.md && cp README.md packages/mcp-server/README.md && cp README.md packages/sdk/README.md && cp README.md packages/cli/README.md",
  + "sync-readme": "node -e \"const fs = require('fs'); ['core', 'mcp-server', 'sdk', 'cli'].forEach(p => fs.copyFileSync('README.md', 'packages/' + p + '/README.md'))\"",
  ```
  使用 `fs.copyFileSync` 实现跨平台 README 文件同步。

- **修改文件：** [package.json](file:///D:/project/AgentRecall-MCP-main/repo/package.json#L13)
- **变更：**
  ```diff
  - "clean": "rm -rf packages/*/dist packages/*/*.tsbuildinfo",
  + "clean": "node -e \"const fs = require('fs'); const path = require('path'); ['core', 'mcp-server', 'sdk', 'cli'].forEach(p => { const dist = path.join('packages', p, 'dist'); if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true, force: true }); const pkgDir = path.join('packages', p); if (fs.existsSync(pkgDir)) fs.readdirSync(pkgDir).forEach(f => { if (f.endsWith('.tsbuildinfo')) fs.rmSync(path.join(pkgDir, f), { force: true }); }); })\"",
  ```
  利用 Node.js `fs.rmSync` 的 `{recursive: true, force: true}` 选项实现原生的 `rm -rf` 等价清除。同时，动态遍历各子包目录，精准清除所有 `.tsbuildinfo` 缓存文件。

---

## 🧪 验证与测试

1. **Windows 环境运行校验**：在 Windows PowerShell 中直接运行 `npm run clean` 和 `npm run sync-readme`，命令顺利执行，成功清理所有 `dist/` 目录和 `.tsbuildinfo` 缓存，未发生任何脚本解析错误。
2. **多平台通用性**：脚本使用标准 Node.js V8 引擎 API 构建，可在 macOS, Linux, Windows 机器上无缝通过测试。
