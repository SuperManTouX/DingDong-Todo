import React, { useMemo } from "react";
import { Col, Dropdown, Row, Select, Tag, theme, Layout, Drawer } from "antd";
import { message } from "@/utils/antdStatic";
import { Priority } from "@/constants";
import { PlusOutlined } from "@ant-design/icons";
import { useTodoStore, dispatchTodo } from "@/store/todoStore";
import { useThemeStore } from "@/store/themeStore";
import TimeCountDownNode from "@/pages/TodoPage/TimeCountDownNode";
import RichNote from "@/components/RichNote";
import TodoCheckbox from "@/components/TodoCheckbox";
import TaskDateTimePicker from "@/components/TaskDateTimePicker";

// 解构Layout组件
const { Header, Content, Footer } = Layout;

interface EditTodoProps {
  // 作为抽屉使用时的属性
  asDrawer?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export default function EditTodo({
  asDrawer = false,
  open = false,
  onClose,
}: EditTodoProps) {
  // 获取状态
  const todoTags = useTodoStore((state) => state.todoTags);
  const todoListData = useTodoStore((state) => state.todoListData);
  const selectTodo = useTodoStore((state) => state.selectTodo());
  const { currentTheme } = useThemeStore();
  const { token } = theme.useToken();

  // 如果没有选中的任务，返回null
  if (!selectTodo) return <Layout></Layout>;

  // 确定优先级样式类
  let priClass = "";
  switch (selectTodo.priority) {
    case Priority.Low:
      priClass = "low-todo";
      break;
    case Priority.Medium:
      priClass = "medium-todo";
      break;
    case Priority.High:
      priClass = "high-todo";
      break;
    default:
      priClass = "";
  }

  // 处理标签点击添加
  const handleTagClick = (tagId: string) => {
    // 如果标签已经存在，则不重复添加
    if (selectTodo.tags?.includes(tagId)) {
      message.info("该标签已添加");
      return;
    }

    // 添加新标签
    const updatedTags = [...(selectTodo.tags || []), tagId];
    dispatchTodo({
      type: "changed",
      todo: {
        ...selectTodo,
        tags: updatedTags,
        listId: selectTodo.listId,
      },
    });

    // 查找标签名称并显示成功消息
    const tagItem = todoTags.find((t) => t.id === tagId);
    message.info(`已添加标签: ${tagItem?.name || "未知标签"}`);
  };

  // 生成Dropdown菜单的items
  const dropdownItems = todoTags.map((tag) => ({
    key: tag.id,
    label: (
      <span style={{ display: "flex", alignItems: "center" }}>
        <Tag color={tag.color || "magenta"} className="mr-2">
          {tag.name}
        </Tag>
      </span>
    ),
    onClick: () => handleTagClick(tag.id),
  }));

  // 标签样式
  const tagPlusStyle: React.CSSProperties = {
    height: 22,
    background: token.colorBgContainer,
    borderStyle: "dashed",
  };

  // 使用useMemo缓存options，避免每次渲染都创建新数组
  const listOptions = useMemo(() => {
    return todoListData.map((list) => ({
      value: list.id,
      label: list.title,
    }));
  }, [todoListData]);

  // 渲染核心内容
  const renderContent = () => (
    <>
      {asDrawer ? (
        // 作为Drawer时，Header内容放在Drawer的title中
        <React.Fragment>
          <Content
            className={" pt-0"}
            style={{
              padding: "16px 24px",
              color: currentTheme.textColor,
              minHeight: "calc(100% - 100px)",
            }}
          >
            <Row className={"h-100"} justify="start">
              <Col className="w-100">{renderMainContent()}</Col>
            </Row>
          </Content>
          <Footer
            className={""}
            style={{
              color: currentTheme.textColor,
              borderTop: `1px solid ${token.colorBorder}`,
              padding: "0 24px",
            }}
          >
            {renderFooter()}
          </Footer>
        </React.Fragment>
      ) : (
        // 作为普通组件时，使用完整的Layout结构
        <React.Fragment>
          <Header
            style={{
              borderBottom: `1px solid ${token.colorBorder}`,
              padding: "0 24px",
              backgroundColor: "var(--theme--colorBgLayout)",
            }}
          >
            <Row className="h-100" justify="space-between" align="middle">
              {renderHeaderContent()}
            </Row>
          </Header>
          <Content
            className=""
            style={{
              padding: "16px 24px",
              color: currentTheme.textColor,
              minHeight: "calc(100% - 100px)",
            }}
          >
            <Row className="h-100" justify="start">
              <Col className="w-100">{renderMainContent()}</Col>
            </Row>
          </Content>
          <Footer
            className=""
            style={{
              color: currentTheme.textColor,
              borderTop: `1px solid ${token.colorBorder}`,
              padding: "0 24px",
            }}
          >
            {renderFooter()}
          </Footer>
        </React.Fragment>
      )}
    </>
  );

  // 渲染头部内容
  const renderHeaderContent = () => (
    <React.Fragment>
      <Row justify="start" align="middle">
        <TodoCheckbox
          completed={selectTodo.completed}
          priority={selectTodo.priority}
          title={selectTodo.title}
          onChange={(checked) => {
            dispatchTodo({
              type: "changed",
              todo: { ...selectTodo, completed: checked },
            });
            if (checked) message.info(`已完成${selectTodo.title}`);
          }}
        />
        <TaskDateTimePicker todo={selectTodo} />
        <TimeCountDownNode
          deadline={selectTodo.deadline}
          datetimeLocal={selectTodo.datetimeLocal}
        />
      </Row>
      <Select
        className="p-select"
        value={selectTodo.priority}
        style={{
          width: 60,
          border: "none",
          backgroundColor: "transparent",
          outline: "none",
          color: currentTheme.textColor,
        }}
        onChange={(priority) => {
          dispatchTodo({
            type: "changed",
            todo: {
              ...selectTodo,
              priority: priority,
            },
          });
        }}
        options={[
          { value: Priority.None, label: "无" },
          { value: Priority.Low, label: "低" },
          { value: Priority.Medium, label: "中" },
          { value: Priority.High, label: "高" },
        ]}
      />
    </React.Fragment>
  );

  // 渲染主要内容（富文本和标签）
  const renderMainContent = () => (
    <React.Fragment>
      {/*待办标题*/}
      <input
        type="text"
        className="w-100"
        value={selectTodo.title}
        onChange={(e) => {
          dispatchTodo({
            type: "changed",
            todo: {
              ...selectTodo,
              title: e.currentTarget.value,
            },
          });
        }}
        style={{
          fontSize: 18,
          fontWeight: "bold",
          border: "none",
          backgroundColor: "transparent",
          outline: "none",
          width: "100%",
          padding: "0",
          marginBottom: "16px",
          color: currentTheme.textColor,
        }}
      />
      {/*富文本内容编辑框*/}
      <RichNote
        value={selectTodo.text || ""}
        onChange={(text) => {
          dispatchTodo({
            type: "changed",
            todo: {
              ...selectTodo,
              text: text,
            },
          });
        }}
        placeholder="开始编写待办详情..."
      />
      {/*标签列表*/}
      {selectTodo.tags?.map((tagId) => {
        // 查找标签信息，如果找不到则提供默认值
        const tagItem = todoTags.find((t) => t.id === tagId);

        // 如果标签不存在，显示为"未知标签"并允许删除
        const tagName = tagItem?.name || `未知标签(${tagId})`;

        return (
          <Tag
            key={tagId}
            color={tagItem?.color || token.colorPrimary}
            closeIcon
            onClose={() => {
              // 从tags数组中移除当前点击的标签
              const updatedTags = selectTodo.tags
                ?.filter((id) => id !== tagId)
                .filter(Boolean);
              dispatchTodo({
                type: "changed",
                todo: {
                  ...selectTodo,
                  tags: updatedTags,
                },
              });
              message.info(`已移除标签: ${tagName}`);
            }}
            style={{ marginRight: 8, marginBottom: 8 }}
          >
            {tagName}
          </Tag>
        );
      })}
      <Dropdown
        menu={{
          items: dropdownItems,
          style: {
            maxHeight: "300px",
            overflowY: "auto",
            backgroundColor: currentTheme.bgColor,
            color: currentTheme.textColor,
            border: `1px solid ${token.colorBorder}`,
          },
        }}
        trigger={["hover"]}
        placement="bottomLeft"
      >
        <Tag style={tagPlusStyle} className="border-dashed">
          <PlusOutlined /> New Tag
        </Tag>
      </Dropdown>
    </React.Fragment>
  );

  // 渲染底部内容（清单选择）
  const renderFooter = () => (
    <Row justify="start" align="middle">
      <span style={{ marginRight: "12px" }}>所属清单：</span>
      <Select
        value={selectTodo.listId}
        style={{
          width: 200,
          color: currentTheme.textColor,
        }}
        showSearch
        placeholder="选择清单"
        optionFilterProp="label"
        filterOption={(input, option) =>
          option?.label?.toLowerCase().includes(input.toLowerCase())
        }
        onChange={(newListId) => {
          if (newListId !== selectTodo.listId) {
            dispatchTodo({
              type: "changed",
              todo: {
                ...selectTodo,
                listId: newListId,
              },
            });

            // 查找新清单的名称
            const newList = todoListData.find((list) => list.id === newListId);
            message.success(
              `已成功移动至清单：${newList?.title || "未知清单"}`,
            );
          }
        }}
        options={listOptions}
      />
    </Row>
  );

  // 根据asDrawer属性决定渲染模式
  if (asDrawer) {
    return (
      <Drawer
        title={
          <Row className="h-100" justify="space-between" align="middle">
            {renderHeaderContent()}
          </Row>
        }
        open={open}
        onClose={onClose}
        width={600}
        placement="right"
        className=""
      >
        {renderContent()}
      </Drawer>
    );
  }
  console.log(renderContent());
  return <Layout>{renderContent()}</Layout>;
}
