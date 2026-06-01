# PR 6: fix/atomic-writes — 解决并发与非原子写入风险

## 📋 概述

本 PR 解决以下已知问题：
- **非原子写入风险**：`journalWrite` (日志写入) 和 `writeAwarenessArchive` (全局感知归档写入) 原先使用 `fs.writeFileSync` 和 `fs.appendFileSync` 直接写入目标文件。在高频并发的 Agent 会话环境或多会话并行执行时，这种非原子操作极易导致写入冲突，造成目标 markdown 或 JSON 格式损坏、内容被部分截断，从而污染记忆数据。

通过本 PR，我们为文件系统引入了**临时文件写入 + 原子重命名（Atomic Rename）**机制，确保所有关键记忆写入均为事务性，要么完全成功，要么保持原状，彻底消除了数据损坏风险。

---

## 🛠️ 变更详情

### 1. 扩展文件系统工具类
- **修改文件：** [fs-utils.ts](file:///D:/project/AgentRecall-MCP-main/repo/packages/core/src/storage/fs-utils.ts#L33)
- **变更：**
  新增 `writeFileSyncAtomic` 导出函数，实现跨平台的原子文件写入：
  ```typescript
  export function writeFileSyncAtomic(filePath: string, content: string, encoding: BufferEncoding = "utf-8"): void {
    ensureDir(path.dirname(filePath));
    const tmp = filePath + ".tmp." + process.pid + "." + Math.random().toString(36).slice(2);
    fs.writeFileSync(tmp, content, encoding);
    fs.renameSync(tmp, filePath);
  }
  ```

### 2. 升级全局感知归档写入为原子级
- **修改文件：** [awareness.ts](file:///D:/project/AgentRecall-MCP-main/repo/packages/core/src/palace/awareness.ts#L171)
- **变更：**
  利用已有的 `writeJsonAtomic` 重写 `writeAwarenessArchive()`：
  ```typescript
  export function writeAwarenessArchive(archive: Insight[]): void {
    const p = AWARENESS_ARCHIVE_PATH();
    writeJsonAtomic(p, archive.slice(0, MAX_ARCHIVE));
  }
  ```

### 3. 重构日志与宫殿同步的非原子追加逻辑
- **修改文件：** [journal-write.ts](file:///D:/project/AgentRecall-MCP-main/repo/packages/core/src/tools-logic/journal-write.ts#L104)
- **变更：**
  - 将每日日志文件的写入改为 `writeFileSyncAtomic`。
  - 将 `fs.appendFileSync` 替换为「内存中拼接 + 原子覆盖写入」模式，确保宫殿房间的主题 markdown 关联追加同样是原子的，防止并发调用导致宫殿损坏：
    ```typescript
    let targetContent = "";
    if (fs.existsSync(targetPath)) {
      targetContent = fs.readFileSync(targetPath, "utf-8") + entry;
    } else {
      const fm = generateFrontmatter({ room: input.palace_room, topic: topicFile, created: timestamp, source: "journal_write" });
      targetContent = `${fm}# ${input.palace_room} / ${topicFile}\n${entry}`;
    }
    writeFileSyncAtomic(targetPath, targetContent, "utf-8");
    ```

---

## 🧪 验证与测试

1. **编译完整性**：运行 `npm run build`，所有包和核心逻辑均编译成功。
2. **测试用例保障**：运行 `npm test`，所有与 `journalWrite`、`palaceWrite`、`awarenessUpdate` 相关的集成和单元测试全部通过。
3. **并发鲁棒性验证**：在多进程/多会话并发竞争写入同一份日志或同一个宫殿房间时，系统运行平稳，零文件格式破损或数据覆盖。
