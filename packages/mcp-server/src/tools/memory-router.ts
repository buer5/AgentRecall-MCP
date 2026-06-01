export const memoryTools = [
  {
    name: "view_memory_map",
    description: "查看当前的记忆系统索引和存储规则。当你不知道该把记忆存到哪里，或者不知道该去哪里检索时，必须先调用此工具获取存储路径（target_path）。",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "store_memory",
    description: "将信息精准写入指定的记忆层级。必须根据 view_memory_map 提供的路径目录进行写入。",
    inputSchema: {
      type: "object",
      properties: {
        target_path: { 
          type: "string", 
          description: "目标路径，例如: '/palace/architecture', '/journal', 或 '/awareness'" 
        },
        content: { 
          type: "string", 
          description: "需要记忆的具体内容" 
        }
      },
      required: ["target_path", "content"]
    }
  }
];