# PR 1: fix/version-consistency — 版本常量与依赖版本一致性修复

## 📋 概述

本 PR 解决以下两个关于版本不一致的已知问题：
1. **核心依赖版本不匹配**：Monorepo 中的消费包（`mcp-server`、`sdk`、`cli`）在其 `package.json` 依赖项中指定了旧版的 `agent-recall-core@3.4.18`，而实际 monorepo 中的核心包自身已经更新为 `3.4.19`。
2. **VERSION 常量滞后**：`packages/core/src/types.ts` 中的 `VERSION` 常量硬编码为 `"3.4.18"`，落后于 `package.json` 中的实际发布版本 `"3.4.19"`。

通过本 PR，所有包与核心包的内部引用版本均已同步对齐到 `3.4.19`。

---

## 🛠️ 变更详情

### 1. 同步 `VERSION` 常量
- **修改文件：** [types.ts](file:///D:/project/AgentRecall-MCP-main/repo/packages/core/src/types.ts#L12)
- **变更：**
  ```diff
  - export const VERSION = "3.4.18";
  + export const VERSION = "3.4.19";
  ```

### 2. 更新消费包依赖
- **修改文件：**
  - [mcp-server/package.json](file:///D:/project/AgentRecall-MCP-main/repo/packages/mcp-server/package.json#L19)
  - [sdk/package.json](file:///D:/project/AgentRecall-MCP-main/repo/packages/sdk/package.json#L23)
  - [cli/package.json](file:///D:/project/AgentRecall-MCP-main/repo/packages/cli/package.json#L25)
- **变更：**
  将对 `"agent-recall-core"` 的本地工作区依赖从 `"3.4.18"` 升级为 `"3.4.19"`，确保运行和打包时引用最新核心代码，避免由于版本不一致导致潜在的 API 滞后或运行时加载警告。

---

## 🧪 验证与测试

1. **工作区依赖校验**：在项目根目录运行 `npm install` 确保包管理器成功解析本地 monorepo 软链接，没有任何 peer dependency 冲突或版本警告。
2. **编译测试**：运行 `npm run build`，编译顺利通过且没有任何类型警告。
3. **单元测试验证**：运行 `npm test`，所有核心及子包测试套件运行通过。
