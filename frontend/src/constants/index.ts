export const Priority = {
    None: 0,
    Low: 1,
    Medium: 2,
    High: 3,
} as const;

export const ShowType = {
    all: 0,
    completed: 1,
    uncompleted: 2,
    overdue: 3,
} as const;
export const ShowTypeLabels = ['全部', '已完成', '未完成', '已逾期'] as const;


// 自动生成反向表
export const PriorityName = Object.fromEntries(
    Object.entries(Priority).map(([k, v]) => [v, k])
) as Record<PriorityValue, PriorityKey>;
export type ShowTypeValue = typeof ShowType[keyof typeof ShowType];

// 使用
type PriorityValue = typeof Priority[keyof typeof Priority]; // 0 | 1 | 2
type PriorityKey = keyof typeof Priority;                  // "Low" | "Medium" | "High"