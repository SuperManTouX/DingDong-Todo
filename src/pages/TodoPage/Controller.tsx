import type { ControllerProps } from "@/types";
import { Button, Input, Row, Dropdown, DatePicker, Tag } from "antd";
import { theme } from "antd";
import { message } from "@/utils/antdStatic";
import { MESSAGES } from "@/constants/messages";
import {
  SearchOutlined,
  DownOutlined,
  CalendarOutlined,
  TagOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTodoStore } from "@/store/todoStore";
import TagTreeSelect from "@/components/TagTreeSelect";
import { useState, useEffect, useRef } from "react";
import { Priority } from "@/constants";

export default function Controller({
  onCompleteAll,
  isAllDone,
  showType,
  searchText,
  setSearchText,
}: ControllerProps) {
  const { todoTags, todoListData, dispatchTodo, activeListId } = useTodoStore();
  const [text, setText] = useState<string>("");
  // 使用useToken钩子获取全局主题token
  const { token } = theme.useToken();
  // 存储当前选择的标签
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // 存储当前选择的清单ID
  const [selectedListId, setSelectedListId] = useState<string | null>(
    activeListId,
  );

  // 存储当前选择的优先级
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);
  // 存储当前选择的截止日期
  const [selectedDeadline, setSelectedDeadline] = useState<string | null>(null);
  // 控制Dropdown显示状态
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // 数据加载状态
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  // 引用Dropdown组件
  const dropdownRef = useRef<Dropdown>(null);

  // 检查数据是否加载完成
  useEffect(() => {
    const checkDataLoaded = () => {
      // 检查todoTags是否已加载
      if (Array.isArray(todoTags) && todoTags.length >= 0) {
        setIsDataLoaded(true);
      }
    };

    // 初始检查
    checkDataLoaded();

    // 监听数据变化
    const interval = setInterval(checkDataLoaded, 100);
    return () => clearInterval(interval);
  }, [todoTags]);

  // 处理标签变化
  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    message.info(MESSAGES.INFO.TAGS_UPDATED);
  };

  // 处理日期选择
  const handleDateSelect = (date: any) => {
    if (date) {
      const formattedDate = dayjs(date).format("YYYY-MM-DD");
      console.log("Selected date:", formattedDate);
      // 设置截止日期状态
      setSelectedDeadline(formattedDate);
      message.info(`已选择截止日期: ${formattedDate}`);
    } else {
      // 清除截止日期
      setSelectedDeadline(null);
    }
  };

  // 处理优先级选择
  const handlePrioritySelect = (priority: number | null) => {
    setSelectedPriority(priority);
    // 根据选择的优先级显示不同的提示信息
    const priorityText = priority === null ? "无" : priority;
    message.info(`已选择优先级: ${priorityText}`);
  };

  // 处理清单选择
  const handleListSelect = (listId: string) => {
    setSelectedListId(listId);
    // 查找选择的清单名称
    const selectedList = todoListData.find((list) => list.id === listId);
    message.info(`已选择清单: ${selectedList?.title || "未知清单"}`);
  };

  // 获取当前活跃清单的标题
  const activeListTitle =
    todoListData.find((list) => list.id === selectedListId)?.title ||
    "所有清单";

  // 下拉菜单配置
  const menuItems = [
    {
      key: "lists",
      label: activeListTitle,
      icon: <MenuOutlined />,
      children: todoListData.map((list) => ({
        key: `list-${list.id}`,
        label: list.title,
        onClick: () => handleListSelect(list.id),
      })),
    },
    {
      key: "priority",
      label: (
        <div
          style={{ display: "flex", gap: "8px", padding: "8px 0" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="small"
            style={{
              backgroundColor:
                selectedPriority === 3 ? "#ff4d4f" : "transparent",
              color: selectedPriority === 3 ? "#fff" : "#ff4d4f",
              borderColor: "#ff4d4f",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrioritySelect(Priority.High);
            }}
          >
            高
          </Button>
          <Button
            size="small"
            style={{
              backgroundColor:
                selectedPriority === 2 ? "#faad14" : "transparent",
              color: selectedPriority === 2 ? "#fff" : "#faad14",
              borderColor: "#faad14",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrioritySelect(Priority.Medium);
            }}
          >
            中
          </Button>
          <Button
            size="small"
            style={{
              backgroundColor:
                selectedPriority === 1 ? "#1677ff" : "transparent",
              color: selectedPriority === 1 ? "#fff" : "#1677ff",
              borderColor: "#1677ff",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrioritySelect(Priority.Low);
            }}
          >
            低
          </Button>
          <Button
            size="small"
            style={{
              backgroundColor:
                selectedPriority === 0 ? "#909399" : "transparent",
              color: selectedPriority === 0 ? "#fff" : "#909399",
              borderColor: "#909399",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrioritySelect(Priority.None);
            }}
          >
            无
          </Button>
        </div>
      ),
    },
    {
      key: "date",
      icon: <CalendarOutlined />,
      disabled: true,
      label: (
        <div style={{ padding: "8px 0" }}>
          <DatePicker
            showTime
            placeholder="选择日期时间"
            style={{ width: "100%" }}
            onOk={handleDateSelect}
          />
        </div>
      ),
    },
    {
      key: "tags",
      icon: <TagOutlined />,

      label: (
        <div
          style={{ padding: "8px", width: "300px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <TagTreeSelect
            todoTags={todoTags}
            todoTagsValue={selectedTags}
            onTagsChange={handleTagsChange}
          />
        </div>
      ),
    },
  ];

  // 创建任务对象，整合所有收集到的信息
  const createTaskObject = () => {
    return {
      title: text,
      priority: selectedPriority,
      tags: selectedTags,
      deadline: selectedDeadline,
      listId: selectedListId || activeListId,
      completed: false, // 默认任务未完成
    };
  };

  // 增强onAdded函数，将所有收集到的任务信息统一传递
  const enhancedOnAdded = () => {
    // 创建完整的任务对象
    const taskData = createTaskObject();

    // 记录任务数据
    console.log("添加新待办事项:", taskData);

    // 如果需要，可以在这里通过dispatchTodo直接添加任务
    dispatchTodo({
      type: "added",
      ...taskData,
    });

    setText("");
    setSelectedTags([]);
    setSelectedListId(activeListId);
    setSelectedPriority(0);
    setSelectedDeadline(null);
    message.success("添加新待办事项，成功！");
  };

  return (
    <li
      className={`row d-flex justify-content-between rounded pe-0 ps-0 pt-0 pb-0  `}
    >
      {/*<Row justify={"space-between"} align={"middle"} className="w-100">*/}
      <Row align={"middle"} className="w-100">
        {/*<Col span={14}>*/}
        <Row className={"w-100"} justify={"start"} align={"middle"}>
          {/*完成全部*/}
          <input
            style={{ marginLeft: "8px" }}
            className="me-2"
            type="checkbox"
            checked={isAllDone}
            onChange={(e) => {
              onCompleteAll({
                type: "completedAll",
                completeOrUncomplete: e.target.checked,
                showType: showType,
              });
              if (e.currentTarget.checked)
                message.info(MESSAGES.INFO.ALL_COMPLETED);
            }}
          />
          {/*添加任务全部*/}
          <div
            style={{
              position: "relative",
              display: "inline-block",
              width: "100%",
            }}
          >
            <Input
              value={text}
              prefix={
                <>
                  {/* 显示选择的清单标题 */}
                  {selectedListId && (
                    <Tag color={token.colorPrimary}>^{activeListTitle}</Tag>
                  )}
                  {/* 显示选择的截止日期 */}
                  {selectedDeadline && (
                    <Tag color="orange">
                      <CalendarOutlined />
                      {dayjs(selectedDeadline).format("YYYY-MM-DD HH:mm")}
                    </Tag>
                  )}
                  {/* 显示选择的优先级 */}
                  {selectedPriority !== 0 && (
                    <Tag
                      color={
                        selectedPriority === 1
                          ? "green"
                          : selectedPriority === 2
                            ? "blue"
                            : "red"
                      }
                    >
                      !优先级:{" "}
                      {selectedPriority === 1
                        ? "低"
                        : selectedPriority === 2
                          ? "中"
                          : "高"}
                    </Tag>
                  )}
                  {/* 显示选择的标签，选择几个显示几个 */}
                  {selectedTags.map((tagId, index) => {
                    // 根据标签ID查找对应的标签对象
                    const tag = todoTags.find((t) => t.id === tagId);
                    // 如果找到标签，则显示其名称，否则显示未知标签
                    return (
                      <Tag key={index} color={tag?.color || "green"}>
                        #{tag?.name || `未知标签`}
                      </Tag>
                    );
                  })}
                </>
              }
              onChange={(e) => setText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  enhancedOnAdded();
                }
              }}
              placeholder="请输入任务内容"
              style={{ width: "100%" }}
              // 移除addonAfter，改为自定义的点击区域
              addonAfter={
                <div
                  style={{ cursor: "pointer", padding: "4px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                >
                  <DownOutlined />
                </div>
              }
              onClick={(e) => {
                // 确保点击Input不会打开下拉菜单
                e.stopPropagation();
              }}
            />
            {/* 将Dropdown移到Input外部，通过isDropdownOpen控制显示 */}
            <Dropdown
              menu={{ items: menuItems }}
              placement="bottom"
              trigger={[]} // 不使用默认触发方式
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
              ref={dropdownRef}
            />
          </div>
        </Row>
      </Row>
      <Row className={"w-100"} justify={"start"} align={"middle"}>
        <Input
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="搜索任务（临时位置）"
          style={{ width: "200px" }}
        />
      </Row>
    </li>
  );
}
