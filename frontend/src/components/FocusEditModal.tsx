import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Radio,
  Row,
  Col,
  DatePicker,
  Input,
  Dropdown,
  message,
  Typography,
  Select,
  Popconfirm,
  Button,
} from "antd";
import type { Dayjs } from "dayjs";
import type { MenuProps } from "antd/es/menu";
import dayjs from "dayjs";
import type { ApiFocusRecord } from "@/services/focusService";
import { focusService } from "@/services/focusService";
import { CheckOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTodoStore } from "@/store/todoStore";

interface FocusEditModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  record?: ApiFocusRecord | null;
  selectedTodo?: any | null;
  setSelectedTodo?: (todo: any | null) => void;
  onSuccess?: (newRecord: ApiFocusRecord) => void;
  onDelete?: (recordId: string) => void;
  onCancel: () => void;
}

export const FocusEditModal: React.FC<FocusEditModalProps> = ({
  isOpen,
  mode,
  record,
  selectedTodo,
  setSelectedTodo,
  onSuccess,
  onDelete,
  onCancel,
}) => {
  // 使用外部传入的form或创建新的form实例
  const [internalForm] = Form.useForm();
  const form = internalForm;

  // 从todoStore中获取数据
  const {
    todoListData,
    activeListId,
    setActiveListId,
    getActiveListData,
    getActiveListTasks,
  } = useTodoStore();

  // 获取当前激活列表的数据
  const currentListData = getActiveListData();

  // 获取当前激活列表的任务
  const currentListTasks = getActiveListTasks();
  // 准备Select组件的选项数据
  const selectOptions = todoListData.map((list: any) => ({
    value: list.id,
    label: list.title,
  }));
  // 构建dropdown菜单项目 - 包含清单选择器和当前清单的任务
  const menuItems: MenuProps["items"] = [
    // 自定义渲染包含Select组件的菜单项
    {
      key: "list-selector",
      label: (
        <div className="p-2 w-full">
          <Typography.Text strong className="block mb-2">
            选择清单：
          </Typography.Text>
          <Select
            value={activeListId}
            onChange={(value) => setActiveListId(value)}
            options={selectOptions}
            style={{ width: "100%" }}
            placeholder="请选择清单"
            allowClear={false}
          />
        </div>
      ),
      disabled: true,
    },
    // 添加分隔线
    { type: "divider" },
    // 添加当前清单的任务列表
    {
      type: "group",
      label: `${currentListData.title} 的任务`,
      children: currentListTasks.map((todo: any) => ({
        key: `todo-${todo.id}`,
        label: (
          <div className="w-full text-left flex items-center gap-2">
            {todo.completed ? (
              <CheckOutlined className="text-green-500" />
            ) : (
              <div className="w-5 h-5 border border-gray-300 rounded-full" />
            )}
            <span
              className={todo.completed ? "line-through text-gray-500" : ""}
            >
              {todo.title}
            </span>
          </div>
        ),
        // 修改onClick事件，将当前点击的todo保存到selectedTodo变量中
        onClick: () => {
          console.log("选择任务:", todo.title);
          setSelectedTodo(todo);
          form.setFieldsValue({ taskTitle: todo.title });
        },
      })),
    },
  ];

  if (currentListTasks.length === 0) {
    // 如果当前清单没有任务，添加提示
    menuItems.push({
      key: "no-todos",
      label: "此清单暂无任务",
      disabled: true,
    });
  }

  // 当初始记录数据变化时，更新表单值
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && record) {
        form.setFieldsValue({
          mode: record.mode,
          startTime: record.start_time ? dayjs(record.start_time) : null,
          endTime: record.end_time ? dayjs(record.end_time) : null,
          taskTitle: record.taskTitle || "",
          note: record.notes || "",
        });
      } else if (mode === "add") {
        // 添加模式时设置默认值
        form.setFieldsValue({
          mode: "normal",
          startTime: dayjs(),
          endTime: dayjs().add(30, "minute"),
          taskTitle: selectedTodo?.title || "",
          note: "",
        });
      }
    }
  }, [isOpen, mode, record, selectedTodo, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (mode === "edit" && record) {
        // 构建更新数据
        const updateData = {
          mode: values.mode,
          start_time: values.startTime.toISOString(),
          end_time: values.endTime.toISOString(),
          notes: values.note || null,
          completed: true,
        };

        // 调用API更新记录
        const updatedRecord = await focusService.updateFocusRecord(
          record.id,
          updateData,
        );
        message.success("专注记录更新成功");

        if (onSuccess) {
          onSuccess(updatedRecord);
        }
        onCancel();
      } else if (mode === "add") {
        // 构建添加数据
        const recordData = {
          task_id: selectedTodo?.id || null,
          start_time: values.startTime.toISOString(),
          end_time: values.endTime.toISOString(),
          notes: values.note || null,
          completed: true,
          mode: values.mode,
        };

        // 调用API添加记录
        const newRecord = await focusService.createFocusRecord(recordData);
        message.success("专注记录添加成功");

        if (onSuccess) {
          onSuccess(newRecord);
        }
        onCancel();
      }
    } catch (error) {
      console.error(
        mode === "edit" ? "更新专注记录失败:" : "添加专注记录失败:",
        error,
      );
      message.error(
        mode === "edit"
          ? "更新专注记录失败，请稍后重试"
          : "添加专注记录失败，请稍后重试",
      );
      throw error; // 抛出错误让Modal组件处理
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    
    try {
      // 调用API删除记录
      await focusService.deleteFocusRecord(record.id);
      message.success("专注记录删除成功");
      
      if (onDelete) {
        onDelete(record.id);
      }
      
      onCancel();
    } catch (error) {
      console.error("删除专注记录失败:", error);
      message.error("删除专注记录失败，请稍后重试");
    }
  };

  // 自定义Modal底部按钮
  const footer = (
    <div className="flex justify-between w-full">
      {/* 原有按钮保持不变 */}
      <div>
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={handleOk} className="ml-2">
          {mode === "add" ? "添加" : "保存"}
        </Button>
      </div>
      {/* 仅在编辑模式下显示删除按钮 */}
      {mode === "edit" && record && (
        <Popconfirm
              title="确定要删除这条专注记录吗？"
              description="删除后将无法恢复"
              onConfirm={handleDelete}
              okText="确定"
              cancelText="取消"
              placement="topRight"
            >
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                title="删除记录"
              />
            </Popconfirm>
      )}
    </div>
  );

  return (
    <Modal
      title={mode === "add" ? "添加专注记录" : "编辑专注记录"}
      open={isOpen}
      footer={footer}
      onCancel={onCancel}
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="专注模式"
          name="mode"
          rules={[{ required: true, message: "请选择专注模式" }]}
        >
          <Radio.Group>
            <Radio.Button value="normal">正常专注</Radio.Button>
            <Radio.Button value="pomodoro">番茄计时</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="开始时间"
              name="startTime"
              rules={[{ required: true, message: "请选择开始时间" }]}
            >
              <DatePicker
                showTime
                format={mode === "add" ? "YYYY-MM-DD HH:mm" : "HH:mm"}
                placeholder="选择开始时间"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="结束时间"
              name="endTime"
              rules={[
                { required: true, message: "请选择结束时间" },
                ({ getFieldValue }) => ({
                  validator(_, value: Dayjs | null) {
                    const startTime = getFieldValue(
                      "startTime",
                    ) as Dayjs | null;
                    if (!value || !startTime) {
                      return Promise.resolve();
                    }
                    // 使用dayjs的日期比较方法
                    if (
                      dayjs(value).isBefore(dayjs(startTime)) ||
                      dayjs(value).isSame(dayjs(startTime))
                    ) {
                      return Promise.reject(
                        new Error("结束时间必须大于开始时间"),
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker
                showTime
                format={mode === "add" ? "YYYY-MM-DD HH:mm" : "HH:mm"}
                placeholder="选择结束时间"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="关联任务"
          name="taskTitle"
          rules={
            mode === "add"
              ? [{ required: true, message: "请选择关联任务" }]
              : []
          }
          getValueFromEvent={(e) => e?.target?.value}
        >
          {mode === "add" && menuItems && setSelectedTodo ? (
            <Dropdown
              menu={{
                items: menuItems,
                style: { maxHeight: "300px", overflowY: "auto" },
              }}
            >
              <Input
                placeholder="选择任务"
                value={selectedTodo?.title || ""}
                readOnly
                style={{ cursor: "pointer" }}
              />
            </Dropdown>
          ) : (
            <Input placeholder="任务标题" readOnly disabled />
          )}
        </Form.Item>

        <Form.Item label="备注" name="note">
          <Input.TextArea rows={3} placeholder="添加备注信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FocusEditModal;
