export interface FocusRecord {
  id: string;
  startTime: string;
  endTime: string;
  duration: string;
  taskTitle?: string;
  mode: "normal" | "pomodoro";
}

export interface FocusStatsData {
  todayTomatoes: number;
  todayHours: number;
  todayMinutes: number;
  totalTomatoes: number;
  totalHours: number;
  totalMinutes: number;
}
