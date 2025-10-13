import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Col,
  Dropdown,
  Row,
  Select,
  Tag,
  theme,
  Layout,
  Drawer,
  Button,
  Typography,
} from "antd";
import type { ActionType } from "@ant-design/pro-components";
import { message } from "@/utils/antdStatic";
import { Priority } from "@/constants";
import { PlusOutlined } from "@ant-design/icons";
import { useTodoStore, dispatchTodo, setSelectTodoId } from "@/store/todoStore";
import { useThemeStore } from "@/store/themeStore";
import TimeCountDownNode from "@/pages/TodoPage/TimeCountDownNode";
import RichNote from "@/components/RichNote";
import TodoCheckbox from "@/components/TodoCheckbox";
import TaskDateTimePicker from "@/components/TaskDateTimePicker";
import { debounce } from "lodash";
import type { Todo, TreeTableData } from "@/types";
import TodoTreeTable from "@/components/TodoTreeTable";
import { useAuthStore } from "@/store/authStore";
// 解构Layout组件
const { Header, Content, Footer } = Layout;

interface EditTodoProps {
  // 作为抽屉使用时的属性
  asDrawer?: boolean;
  open?: boolean;
  onClose?: () => void;
  PTableDOM?: React.RefObject<ActionType>;
}

export default function EditTodo({
  asDrawer = false,
  open = false,
  onClose,
  PTableDOM,
}: EditTodoProps) {
  const { todoTags, todoListData, selectTodoId, selectTodo, tasks } =
    useTodoStore();
  const { userId } = useAuthStore();
  const { currentTheme } = useThemeStore();
  const { token } = theme.useToken();

  // 使用state存储任务数据
  const [EselectTodo, setEselectTodo] = useState<TreeTableData>();
  const [titleValue, setTitleValue] = useState<string>("");
  const [textValue, setTextValue] = useState<string>("");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  // 创建防抖版本的dispatchTodo
  const debouncedDispatchTodo = useCallback(
    debounce((action) => {
      dispatchTodo(action);
    }, 300), // 300ms的防抖延迟
    [],
  );
  // 当selectTodoId变化时获取任务数据
  useEffect(() => {
    const s = selectTodo();
    console.log("s", s);
    // 当selectTodoId存在时，使用store中的selectTodo更新本地state
    if (selectTodoId) {
      setEselectTodo(s);
      setTitleValue(s?.title || "");
      setTextValue(s?.text || "");
    } else {
      // 清除任务数据
      setEselectTodo(undefined);
      setTitleValue("");
      setTextValue("");
    }
  }, [selectTodoId, tasks]);

  // 处理标签点击添加
  const handleTagClick = (tagId: string) => {
    // 如果标签已经存在，则不重复添加
    if (EselectTodo?.tags?.includes(tagId)) {
      message.info("该标签已添加");
      return;
    }

    // 添加新标签
    const updatedTags = [...(EselectTodo?.tags || []), tagId];
    dispatchTodo({
      type: "changed",
      todo: {
        ...EselectTodo,
        tags: updatedTags,
        listId: EselectTodo?.listId,
      },
    });
    // 查找标签名称并显示成功消息
    const tagItem = todoTags.find((t) => t.id === tagId);
    message.info(`已添加标签: ${tagItem?.name || "未知标签"}`);
  };
  // 添加子任务
  const handleAddSubTask = (todo: Todo): void => {
    const { activeListId } = useTodoStore.getState();

    const action: any = {
      type: "added",
      newTask: {
        title: "",
        completed: false,
        tag: [],
        parentId: todo.id,
        depth: todo.depth + 1,
        groupId: todo.groupId,
        isPinned: todo.isPinned,
        pinnedAt: todo.pinnedAt, // 新增：置顶时间，用于多个置顶任务的排序
        listId: todo.listId,
        userId: userId,
      },
    };
    if (activeListId === "today" || activeListId === "nearlyWeek") {
      action.newTask.deadline = todo.deadline;
    }
    console.log(action.newTask);
    dispatchTodo(action);
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
            className={"pt-0"}
            style={{
              padding: "16px 24px",
              color: currentTheme.textColor,
              minHeight: "calc(100% - 100px)",
            }}
          >
            <Row className={"h-100"} justify="start">
              <Col className=" w-100">{renderMainContent()}</Col>
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
            className="overflow-y-scroll custom-scrollbar"
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
  const renderHeaderContent = () =>
    EselectTodo ? (
      <React.Fragment>
        <Row justify="start" align="middle">
          <TodoCheckbox todo={EselectTodo} PTableDOM={PTableDOM} />
          <TaskDateTimePicker todo={EselectTodo} />
          <TimeCountDownNode
            deadline={EselectTodo?.deadline}
            datetimeLocal={EselectTodo?.datetimeLocal}
          />
        </Row>
        <Select
          className="p-select"
          value={EselectTodo?.priority}
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
                ...EselectTodo,
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
    ) : (
      ""
    );

  // 渲染主要内容（富文本和标签）
  const renderMainContent = () =>
    EselectTodo ? (
      <React.Fragment>
        <Row justify="start" align="middle">
          <Col>
            {EselectTodo?.parentId && (
              <Typography.Link onClick={(e) => {
                e.preventDefault();
                setSelectTodoId(EselectTodo.parentId);
              }}>
                <Typography.Text underline>
                  {tasks.find(t => t.id === EselectTodo.parentId)?.title || "父任务"}
                </Typography.Text>
              </Typography.Link>
            )}
          </Col>
        </Row>
        {/*待办标题*/}
        <input
          type="text"
          className="w-100"
          value={titleValue}
          onChange={(e) => {
            setTitleValue(e.target.value);
            // 使用防抖版本的dispatchTodo
            debouncedDispatchTodo({
              type: "changed",
              todo: {
                ...EselectTodo,
                title: e.target.value,
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
          key={EselectTodo.id}
          value={textValue || ""}
          onChange={(text) => {
            dispatchTodo({
              type: "changed",
              todo: {
                ...EselectTodo,
                text: text,
              },
            });
          }}
          placeholder="开始编写待办详情..."
        />
        {/*标签列表*/}
        {EselectTodo?.tags?.map((tagId) => {
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
                const updatedTags = EselectTodo?.tags
                  ?.filter((id) => id !== tagId)
                  .filter(Boolean);
                dispatchTodo({
                  type: "changed",
                  todo: {
                    ...EselectTodo,
                    tags: updatedTags,
                  },
                });
                setEselectTodo({
                  ...EselectTodo,
                  tags: updatedTags,
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

        {/* 子任务列表 */}
        {EselectTodo?.children && EselectTodo.children.length > 0 && (
          <>
            <TodoTreeTable
              tasks={EselectTodo.children}
              stopPropagation={true}
              expandedRowKeys={expandedRowKeys}
              onExpandChange={(expanded, record) => {
                setExpandedRowKeys((prevKeys) => {
                  if (expanded) {
                    return [...prevKeys, record.id];
                  } else {
                    return prevKeys.filter((key) => key !== record.id);
                  }
                });
              }}
              usePagination={false}
            />
          </>
        )}
        <Row justify={"start"}>
          <Col span={4}>
            <Button
              onClick={() => handleAddSubTask(EselectTodo)}
              className={"w-100"}
              color="pink"
              variant="text"
            >
              <PlusOutlined /> 添加子任务
            </Button>
          </Col>
        </Row>
      </React.Fragment>
    ) : (
      ""
    );

  // 渲染底部内容（清单选择）
  const renderFooter = () =>
    EselectTodo ? (
      <Row justify="start" align="middle">
        <span style={{ marginRight: "12px" }}>所属清单：</span>
        <Select
          value={EselectTodo?.listId}
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
            if (newListId !== EselectTodo?.listId) {
              dispatchTodo({
                type: "moveToList",
                todoId: EselectTodo?.id,
                listId: newListId,
              });
            }
          }}
          options={listOptions}
        />
      </Row>
    ) : (
      ""
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
      >
        {/*className={"overflow-y-scroll custom-scrollbar"}*/}

        {renderContent()}
      </Drawer>
    );
  }
  // 如果没有选中的任务，返回null
  if (!EselectTodo) return <Layout></Layout>;
  return <Layout>{renderContent()}</Layout>;
}
