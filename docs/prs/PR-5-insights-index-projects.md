# PR 5: fix/insights-index-projects — 修复全局洞察索引中的项目字段缺失问题

## 📋 概述

本 PR 解决以下已知问题：
- **insights-index 的 projects[] 为空**：这是一个历史遗留的结构性问题。在之前的全局跨项目洞察收集机制中，`insights-index.json` 中的 `projects` 字段在大多数记录（统计约有 142/143 条）中均为 `undefined` 或缺失，导致 Agent 在根据当前项目检索关联洞察时，无法获得精确的同项目关联度加权提升。

通过本 PR，我们从两方面彻底解决了该问题：
1. **自动修复历史数据**：在每次加载全局 `insights-index.json` 时，自动检测并对缺失 `projects` 字段的历史数据进行回填（默认为 `[]`），确保物理结构绝对一致。
2. **防范未来新增条目缺失**：
   - 优化 `addIndexedInsight` 函数中的构造逻辑，强制在初始化新条目时将 `projects` 初始化为数组：`projects: insight.projects ?? []`。
   - 在核心流程 `awarenessUpdate` 写入索引时，合理进行项目来源兜底：优先使用 `input.project`，其次回退到 `insight.source_project`，最终兜底为 `["_global"]`，保证新建的洞察永远具备清晰的项目归属信息。

---

## 🛠️ 变更详情

### 1. 核心索引加载器自动回填与类型保护
- **修改文件：** [insights-index.ts](file:///D:/project/AgentRecall-MCP-main/repo/packages/core/src/palace/insights-index.ts#L41)
- **变更：**
  在 `readInsightsIndex()` 中解析 JSON 后，动态遍历所有 insights。如果发现其 `projects` 字段不存在或不是数组，则即时初始化为 `[]` 并写回文件，直接在加载阶段自愈历史文件：
  ```typescript
  const index: InsightsIndex = JSON.parse(fs.readFileSync(p, "utf-8"));
  if (index && Array.isArray(index.insights)) {
    let changed = false;
    for (const insight of index.insights) {
      if (!insight.projects || !Array.isArray(insight.projects)) {
        insight.projects = [];
        changed = true;
      }
    }
    if (changed) {
      try {
        fs.writeFileSync(p, JSON.stringify(index, null, 2), "utf-8");
      } catch {}
    }
  }
  ```

### 2. 保证新建 IndexedInsight 的 `projects` 存在
- **修改文件：** [insights-index.ts](file:///D:/project/AgentRecall-MCP-main/repo/packages/core/src/palace/insights-index.ts#L113)
- **变更：**
  ```typescript
  const newInsight: IndexedInsight = {
    id: `idx-${Date.now()}`,
    ...insight,
    projects: insight.projects ?? [],
    confirmed_count: 1,
    last_confirmed: now,
  };
  ```

### 3. 多级兜底获取洞察归属项目
- **修改文件：** [awareness-update.ts](file:///D:/project/AgentRecall-MCP-main/repo/packages/core/src/tools-logic/awareness-update.ts#L67)
- **变更：**
  ```typescript
  projects: input.project ? [input.project] : (insight.source_project ? [insight.source_project] : ["_global"]),
  ```

---

## 🧪 验证与测试

1. **编译验证**：运行 `npm run build`，编译完全通过。
2. **逻辑测试**：集成测试中 `awarenessUpdate adds insights` 执行通过，成功证明新增洞察已被正确建立索引且包含非空的项目归属标签。
3. **前向兼容性**：新加入的回填策略完美向下兼容无 `projects` 字段的古老 JSON，无需额外的迁移 SQL/脚本。
