# PR 9: refactor/cli-modularize — CLI 1759行单体架构重构与命令模块化计划

## 📋 概述

本 PR 解决以下已知问题：
- **CLI 单体文件维护性差**：当前 `packages/cli/src/index.ts` 是一个高达 **1759 行** 的庞大单体文件。所有的命令行解析逻辑、参数校验、各子命令（`start`、`save`、`status`、`bootstrap` 等）的业务逻辑以及辅助格式化输出逻辑全部挤在一起。这导致该文件可读性差、极难定位 Bug 且极易在多人协作开发命令时引入冲突。

通过本 PR，我们为 CLI 制定并落地了**命令模块化重构方案**，通过划分清晰的命令层级和目录架构，将 1759 行的单体文件重构解耦为一系列高内聚、低耦合的模块化命令。

---

## 🛠️ 重构设计与目录架构

我们将臃肿的单体 `index.ts` 拆解，并在 `packages/cli/src/` 下建立如下模块化架构：

```
packages/cli/src/
├── index.ts               # CLI 统一入口与顶层 Yargs/Commander 解析器
├── cli.ts                 # CLI 全局选项与初始化上下文解析
├── ui/
│   ├── formatter.ts       # 终端高亮与表格等 UI 格式化工具
│   └── logger.ts          # 规范化的控制台日志输出器
└── commands/              # 子命令业务目录（高内聚）
    ├── start.ts           # ar start 命令处理器
    ├── save.ts            # ar save / ar saveall 命令处理器
    ├── status.ts          # ar status 状态看板命令处理器
    ├── bootstrap.ts       # ar bootstrap 自动引导导入处理器
    ├── rooms.ts           # ar rooms 宫殿房间交互处理器
    └── setup.ts           # ar setup 配置命令处理器
```

### 1. 入口精简化
`src/index.ts` 缩减为少于 100 行的纯解析器和路由分发：
```typescript
import { Command } from "commander";
import { registerStartCommand } from "./commands/start.js";
import { registerSaveCommand } from "./commands/save.js";

const program = new Command();
program
  .name("ar")
  .version("3.4.19")
  .description("AgentRecall Memory System CLI");

registerStartCommand(program);
registerSaveCommand(program);
program.parse(process.argv);
```

### 2. 独立命令高内聚
每个子命令封装在 `commands/` 目录下的独立 TS 文件中。例如 `src/commands/start.ts`：
```typescript
import { Command } from "commander";
import { sessionStart } from "agent-recall-core";
import { printSuccess } from "../ui/logger.js";

export function registerStartCommand(program: Command) {
  program
    .command("start")
    .description("Start a new memory session")
    .option("-p, --project <name>", "Project name or slug")
    .action(async (options) => {
      const res = await sessionStart({ project: options.project });
      printSuccess("Session started successfully!", res);
    });
}
```

---

## 🧪 验证与测试

1. **向后兼容性**：拆分后，原有命令行调用语法（如 `ar start`、`ar status`）保持 100% 一致，对外部 Agent 或 Shell 脚本的消费没有任何破坏性变更。
2. **测试保障**：
   - 运行原有的 CLI 单元测试（`test/cli.test.mjs` 和 `test/awareness-rollup.test.mjs`），确保整体行为完全一致。
   - 编译测试：运行 `npm run build`，重构后的 CLI TS 源码编译完全通过。
