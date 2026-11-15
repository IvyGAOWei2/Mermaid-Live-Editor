export const flowchartTemplate = `flowchart TD
    A[一个新的想法] --> B[梳理关键步骤]
    B --> C{准备好了吗？}
    C -->|是| D[开始行动]
    C -->|再想想| E[补充细节]
    E --> B
    D --> F[记录与分享]

    style A fill:#dff3eb,stroke:#78b69c
    style D fill:#dff3eb,stroke:#78b69c
    style C fill:#fff3d7,stroke:#d6b76b`

export const mindmapTemplate = `mindmap
  root((我的学习计划))
    Mermaid 入门
      节点与连线
      判断与分支
    日常练习
      绘制工作流程
      整理阅读笔记
    回顾与分享
      导出图形
      保存源文件`

export const outlineExample = `我的学习计划
  Mermaid 入门
    节点与连线
    判断与分支
  日常练习
    绘制工作流程
    整理阅读笔记
  回顾与分享`

export const syntaxHelp = [
  {
    title: '节点与文字',
    type: 'flowchart',
    description: '用简短英文 ID 标识节点，方括号里写显示文字。中文或标点较多时，用双引号包住文字。',
    code: '    A["开始整理想法"]\n    B("圆角节点")\n    C((结束))',
  },
  {
    title: '连线与条件',
    type: 'flowchart',
    description: '箭头连接两个节点；竖线里的文字是连线条件。虚线可表示可选关系。',
    code: '    A -->|下一步| B\n    B -.->|可选| C',
  },
  {
    title: '判断与分支',
    type: 'flowchart',
    description: '花括号生成菱形判断，分别连接不同条件的后续节点。',
    code: '    Check{"是否通过？"}\n    Check -->|是| Pass[继续]\n    Check -->|否| Retry[重新检查]',
  },
  {
    title: '流程方向',
    type: 'flowchart',
    description:
      'TD / TB 从上到下，LR 从左到右，RL 从右到左，BT 从下到上。插入会修改第一行的方向。',
    code: 'flowchart LR\n    A[开始] --> B[完成]',
  },
  {
    title: '分组',
    type: 'flowchart',
    description: '用 subgraph 和 end 把有关节点放在同一组中。分组 ID 也应保持唯一。',
    code: '    subgraph Team[准备阶段]\n        T1[收集资料] --> T2[梳理要点]\n    end',
  },
  {
    title: '思维导图层级',
    type: 'mindmap',
    description:
      '第一行写 mindmap。只保留一个根主题；统一缩进，同级对齐，子主题比父主题多缩进一层。',
    code: 'mindmap\n  root((中心主题))\n    一个分支\n      一个子主题\n    另一个分支',
  },
] as const
