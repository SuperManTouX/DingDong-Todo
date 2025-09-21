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
export const ShowTypeLabels = ["全部", "已完成", "未完成", "已逾期"] as const;

// 自动生成反向表
export const PriorityName = Object.fromEntries(
  Object.entries(Priority).map(([k, v]) => [v, k]),
) as Record<PriorityValue, PriorityKey>;
export type ShowTypeValue = (typeof ShowType)[keyof typeof ShowType];

// 特殊清单常量 ，标签以后也得加
export const SpecialLists = {
  aa: "aa",
  bb: "bb",
  bin: "bin",
  cp: "cp",
} as const;

export type SpecialListKey = keyof typeof SpecialLists;
export type SpecialListValue = (typeof SpecialLists)[keyof typeof SpecialLists];

// 使用
// 使用
type PriorityValue = (typeof Priority)[keyof typeof Priority]; // 0 | 1 | 2
type PriorityKey = keyof typeof Priority; // "Low" | "Medium" | "High"

export const ListColors = {
  none: "",
  default: "#1677ff",
  red: "#ff4d4f",
  orange: "#fa8c16",
  green: "#52c41a",
  blue: "#1890ff",
  purple: "#722ed1",
  cyan: "#13c2c2",
  magenta: "#eb2f96",
  lime: "#a0d911",
  pink: "#ff69b4",
  golden: "#faad14",
  geekblue: "#2f54eb",
  teal: "#09bb07",
  volt: "#ab8b00",
  amber: "#ff7a45",
  daybreakblue: "#1890ff",
  dustypink: "#f5222d",
  sunsetorange: "#fa8c16",
  calabash: "#52c41a",
  cinnabar: "#fa541c",
  cream: "#faad14",
} as const;

export const ListColorNames = {
  "": "无颜色",
  "#1677ff": "蓝色",
  "#ff4d4f": "红色",
  "#fa8c16": "橙色",
  "#52c41a": "绿色",
  "#1890ff": "亮蓝",
  "#722ed1": "紫色",
  "#13c2c2": "青色",
  "#eb2f96": "洋红",
  "#a0d911": "酸橙",
  "#ff69b4": "粉色",
  "#faad14": "金色",
  "#2f54eb": "极客蓝",
  "#09bb07": "青色",
  "#ab8b00": "伏特",
  "#ff7a45": "琥珀",
  "#f5222d": "尘粉",
} as const;

export type ListColorValue = (typeof ListColors)[keyof typeof ListColors];
export type ListColorKey = keyof typeof ListColors;
