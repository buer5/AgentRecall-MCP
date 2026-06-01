# PR 7: feat/pii-filtering — 引入 PII 隐私数据与敏感凭证自动脱敏过滤

## 📋 概述

本 PR 解决以下已知问题：
- **无 PII 过滤风险**：AI Agent 在执行任务时经常需要处理各种敏感数据（如 API 密钥、Slack 访问令牌、密码、邮箱凭证等）。在此前的设计中，`remember()` 接口没有做任何过滤，会将 Agent 输入的这些敏感数据以明文持久化在本地 Markdown 或 JSON 中，一旦代码库或者记忆目录分享或泄露，将导致极大的安全隐患。

通过本 PR，我们在全局记忆存储的总入口（`smartRemember`）引入了高性能、轻量级的 **PII 隐私数据与凭证自动过滤脱敏（PII and Credential Redaction）** 机制。在任何记忆写入磁盘前，系统会自动对敏感内容进行正则识别和脱敏替换，确保所有明文密钥绝不落盘。

---

## 🛠️ 变更详情

### 1. 新增 PII & 敏感凭证过滤工具函数
- **修改文件：** [smart-remember.ts](file:///D:/project/AgentRecall-MCP-main/repo/packages/core/src/tools-logic/smart-remember.ts#L125)
- **变更：**
  新增 `sanitizePIIAndCredentials` 导出函数，运用一系列精心设计的 API 特征正则规则进行内容扫描与替换，目前支持：
  - **OpenAI / Anthropic / Voyage API 密钥**：替换为 `[REDACTED_API_KEY]`
  - **Slack App / Bot / User 令牌**：替换为 `[REDACTED_SLACK_TOKEN]`
  - **通用键值对敏感词（password, pass, secret, token, key, pwd, auth_token）**：替换为 `[REDACTED_SECRET]`
  - **HTTP Authorization Bearer 令牌**：替换为 `Bearer [REDACTED_BEARER_TOKEN]`
  - **电子邮箱地址（Email PII）**：替换为 `[REDACTED_EMAIL]`

### 2. 全局写入入口总阀脱敏集成
- **修改文件：** [smart-remember.ts](file:///D:/project/AgentRecall-MCP-main/repo/packages/core/src/tools-logic/smart-remember.ts#L161)
- **变更：**
  在 `smartRemember` 的入口处即时拦截 `content` 和 `context` 进行脱敏，后续所有的分类路由、冲突检测、标签生成、物理文件写入、向量数据库索引以及关联链接匹配流程均运行在脱敏后的安全内容之上，做到绝对安全：
  ```typescript
  const content = sanitizePIIAndCredentials(input.content || "");
  const context = input.context ? sanitizePIIAndCredentials(input.context) : undefined;
  ```

---

## 🧪 验证与测试

1. **新增单元测试保障**：
   - **新增测试：** [smart-routing.test.mjs](file:///D:/project/AgentRecall-MCP-main/repo/packages/core/test/smart-routing.test.mjs#L80)
   - **覆盖场景**：向 `smartRemember` 传入包含 OpenAI Key (`sk-proj-xxxx`)、Slack Token (`xoxb-xxxx`)、密码字段以及邮箱的超长记忆，通过测试断言，在底层真实写入的 Markdown 文件中，所有原始明文已被干净替换为对应的 `[REDACTED_...]` 占位符。
2. **测试运行结果**：
   ```bash
   ✔ Smart routing — smartRemember
     ✔ filters PII and credentials in smartRemember (445.9274ms)
   ```
   测试顺利通过，功能性与安全性得到双重保障。
