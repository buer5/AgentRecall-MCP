import { journalWrite } from "./journal-write.js";
import { palaceWrite } from "./palace-write.js";
import { awarenessUpdate } from "./awareness-update.js";

// 动态生成当前的记忆结构大纲给大模型看
export async function getMemoryMap() {
  return JSON.stringify({
    "/journal": "存放每日的零碎进度、Bug排查过程、短期状态。",
    "/palace/<room_name>": "存放持久化的知识、项目规范。可用房间: [architecture, database, rules] (可自定义新房间)。",
    "/awareness": "存放跨项目的、极其重要的、经过验证的全局深刻洞察。"
  }, null, 2);
}

// 根据大模型传入的路径进行精准写入
export async function executeStoreMemory(targetPath: string, content: string): Promise<void> {
  const path = targetPath.toLowerCase().trim();

  if (path.startsWith('/palace/')) {
    // 提取房间名，例如从 "/palace/architecture" 提取 "architecture"
    const room = path.replace('/palace/', '') || 'general';
    await palaceWrite({ room, content });
    return;
  } 
  
  if (path === '/awareness') {
    await awarenessUpdate({
      insights: [{
        title: 'Auto-Insight',
        evidence: content,
        applies_when: ['auto'],
        source: 'memory-map'
      }]
    });
    return;
  }

  // 兜底全进 Journal
  await journalWrite({ content });
}