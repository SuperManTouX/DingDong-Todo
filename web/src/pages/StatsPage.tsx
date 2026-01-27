import React, { useMemo } from "react";
import { Card, Statistic, Row, Col, Typography, Layout } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  BarChartOutlined,
  LineChartOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useTodoStore } from "@/store/todoStore";
import dayjs from "dayjs";
import { Priority } from "@/constants";
import type { Tag } from "@/types";
import { useTodoDataLoader } from "@/hooks/useTodoDataLoader";

const { Title } = Typography;

/**
 * 统计页面组件
 * 显示待办事项的统计信息和数据可视化图表
 */
const StatsPage: React.FC = () => {
  useTodoDataLoader();
  // 获取所有任务
  const { tasks } = useTodoStore.getState();

  // 数据聚合和计算
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    // 计算完成率
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 计算逾期任务
    const overdueTasks = tasks.filter((task) => {
      if (task.completed) return false;
      if (!task.deadline) return false;
      const deadline = dayjs(task.deadline);
      return deadline.isBefore(dayjs(), "day");
    }).length;

    // 按优先级分组
    const priorityStats = {
      [Priority.Low]: tasks.filter((task) => task.priority === Priority.Low)
        .length,
      [Priority.Medium]: tasks.filter(
        (task) => task.priority === Priority.Medium,
      ).length,
      [Priority.High]: tasks.filter((task) => task.priority === Priority.High)
        .length,
    };

    // 按完成状态分组
    const statusStats = [
      { name: "已完成", value: completedTasks, color: "#52c41a" },
      { name: "未完成", value: pendingTasks, color: "#1890ff" },
    ];

    // 生成最近7天的完成趋势数据
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, "day");
      const formattedDate = date.format("MM-DD");
      const completedOnThisDay = tasks.filter((task) => {
        return (
          task.completed &&
          task.completedAt &&
          dayjs(task.completedAt).isSame(date, "day")
        );
      }).length;
      last7DaysData.push({
        date: formattedDate,
        completed: completedOnThisDay,
      });
    }

    // 从store获取所有标签，创建id到name的映射
    const tags = useTodoStore.getState().todoTags || [];
    const tagIdToNameMap = new Map<string, string>();
    tags.forEach((tag: Tag) => {
      tagIdToNameMap.set(tag.id, tag.name);
    });

    // 按标签统计（使用标签名称）
    const tagStats: Record<string, number> = {};
    tasks.forEach((task) => {
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach((tagId) => {
          // 使用标签名称，如果找不到则使用id作为后备
          const tagName = tagIdToNameMap.get(tagId) || tagId;
          tagStats[tagName] = (tagStats[tagName] || 0) + 1;
        });
      }
    });

    const tagsData = Object.entries(tagStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // 按数量降序排序

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      overdueTasks,
      priorityStats,
      statusStats,
      last7DaysData,
      tagsData,
    };
  }, [tasks]);

  // 优先级颜色
  const priorityColors = {
    [Priority.Low]: "#52c41a",
    [Priority.Medium]: "#faad14",
    [Priority.High]: "#f5222d",
  };

  // 优先级名称映射
  const priorityNames = {
    [Priority.Low]: "低",
    [Priority.Medium]: "中",
    [Priority.High]: "高",
  };

  // 优先级统计数据
  const priorityData = Object.entries(stats.priorityStats).map(
    ([key, value]) => ({
      name: priorityNames[key],
      value,
      color: priorityColors[key],
    }),
  );

  return (
    <Layout className={"border-0 p-4 "}>
      <Title className={"text-start"} level={2}>
        统计信息
      </Title>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总待办事项"
              value={stats.totalTasks}
              prefix={<UnorderedListOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completedTasks}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成率"
              value={stats.completionRate}
              suffix="%"
              valueStyle={{ color: "#1890ff" }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="逾期任务"
              value={stats.overdueTasks}
              valueStyle={{ color: "#f5222d" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginTop: "16px" }}>
        {/* 饼图：任务状态分布 */}
        <Col span={8}>
          <Card title="任务状态分布" extra={<PieChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.statusStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.statusStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 饼图：优先级分布 */}
        <Col span={8}>
          <Card title="优先级分布" extra={<PieChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 饼图：标签分布 */}
        <Col span={8}>
          <Card title="标签分布" extra={<TagOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.tagsData.slice(0, 8)} // 只显示前8个标签
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.tagsData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(${index * 45}, 70%, 60%)`}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 折线图：完成趋势 */}
      <Row gutter={16} style={{ marginTop: "16px" }}>
        <Col span={24}>
          <Card title="最近7天完成趋势" extra={<LineChartOutlined />}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={stats.last7DaysData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};

export default StatsPage;
