import type { ControllerProps } from "@/types";
import { Button, Col, Input, Row, Dropdown, Menu, DatePicker, Tag } from "antd";
import type { TagProps } from "antd";
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

type TagValueType = string;

export default function Controller({
  onCompleteAll,
  isAllDone,
  showType,
  text,
  setText,
  onAdded,
  searchText,
  setSearchText,
}: ControllerProps) {
  const { todoTags, todoListData, dispatchTodo, activeListId } = useTodoStore();

  // 存储当前选择的标签
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // 存储当前选择的清单ID
  const [selectedListId, setSelectedListId] = useState<string | null>(
    activeListId,
  );
  // 存储当前选择的优先级
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  // 存储当前选择的截止日期
  const [selectedDeadline, setSelectedDeadline] = useState<Date | null>(null);
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

  // 处理下拉菜单打开/关闭
  const handleOpenChange = (open: boolean) => {
    // 在数据加载完成前，强制保持打开状态
    if (isDataLoaded) {
      setIsDropdownOpen(open);
    } else {
      setIsDropdownOpen(true);
    }
  };

  // 处理标签变化
  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    message.info(MESSAGES.INFO.TAGS_UPDATED);
  };

  // 处理日期选择
  const handleDateSelect = (date: any) => {
    if (date) {
      const formattedDate = dayjs(date).format("YYYY-MM-DD HH:mm");
      console.log("Selected date:", formattedDate);
      // 设置截止日期状态
      setSelectedDeadline(date.toDate());
      message.info(`已选择截止日期: ${formattedDate}`);
    } else {
      // 清除截止日期
      setSelectedDeadline(null);
    }
  };

  // 获取优先级对应的颜色
  const getPriorityColor = () => {
    switch (selectedPriority) {
      case "高":
        return "#ff4d4f"; // 红色
      case "中":
        return "#faad14"; // 黄色
      case "低":
        return "#1677ff"; // 蓝色
      default:
        return "#909399"; // 灰色
    }
  };

  // 处理优先级选择
  const handlePrioritySelect = (priority: string | null) => {
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
                selectedPriority === "高" ? "#ff4d4f" : "transparent",
              color: selectedPriority === "高" ? "#fff" : "#ff4d4f",
              borderColor: "#ff4d4f",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrioritySelect("高");
            }}
          >
            高
          </Button>
          <Button
            size="small"
            style={{
              backgroundColor:
                selectedPriority === "中" ? "#faad14" : "transparent",
              color: selectedPriority === "中" ? "#fff" : "#faad14",
              borderColor: "#faad14",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrioritySelect("中");
            }}
          >
            中
          </Button>
          <Button
            size="small"
            style={{
              backgroundColor:
                selectedPriority === "低" ? "#1677ff" : "transparent",
              color: selectedPriority === "低" ? "#fff" : "#1677ff",
              borderColor: "#1677ff",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrioritySelect("低");
            }}
          >
            低
          </Button>
          <Button
            size="small"
            style={{
              backgroundColor:
                selectedPriority === null ? "#909399" : "transparent",
              color: selectedPriority === null ? "#fff" : "#909399",
              borderColor: "#909399",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrioritySelect(null);
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
      disabled: false,
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
      disabled: false,

      label: (
        <div style={{ padding: "8px", width: "300px" }}>
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
      completed: false // 默认任务未完成
    };
  };

  // 增强onAdded函数，将所有收集到的任务信息统一传递
  const enhancedOnAdded = () => {
    // 创建完整的任务对象
    const taskData = createTaskObject();
    
    // 记录任务数据
    console.log("添加新待办事项:", taskData);

    // 如果需要，可以在这里通过dispatchTodo直接添加任务
    // dispatchTodo({
    //   type: "added",
    //   ...taskData
    // });

    // 调用原始的onAdded函数
    onAdded();
  };

  return (
    <li
      className={`row d-flex justify-content-between highlight rounded pe-0 ps-0 pt-0 pb-0  `}
    >
      <Row justify={"space-between"} align={"middle"} className="w-100">
        <Col span={14}>
          <Row justify={"start"} align={"middle"}>
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
            <div className="w-100">
              <Dropdown
                menu={{ items: menuItems }}
                placement="bottomLeft"
                trigger={["click"]}
                open={isDropdownOpen}
                onOpenChange={handleOpenChange}
                ref={dropdownRef}
              >
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="请输入任务内容"
                    style={{ width: "calc(100% - 80px)", marginRight: "8px" }}
                    addonAfter={<DownOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </Dropdown>
              <Button
                type="primary"
                size="small"
                onClick={enhancedOnAdded}
                style={{ width: "72px" }}
              >
                添加
              </Button>
            </div>
          </Row>
        </Col>
        <Col span={10}>
          <Row justify={"end"} align={"middle"}>
            <Input
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索任务..."
              style={{ width: "200px" }}
            />
          </Row>
        </Col>
      </Row>
    </li>
  );
}
