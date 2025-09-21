// @ts-ignore
import type { ControllerProps } from "@/types";
import { ShowType, ShowTypeLabels, type ShowTypeValue } from "@/constants";
import { Dropdown } from "react-bootstrap";
import { Button, Col, Input, message, Row } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { MESSAGES } from "@/constants/messages";
export default function Controller({
  onSwitchShow,
  onCompleteAll,
  isAllDone,
  showType,
  text,
  setText,
  onAdded,
}: ControllerProps) {
  // 使用 Ant Design 官方的 message.useMessage() hook
  const [messageApi, contextHolder] = message.useMessage();
  return (
    <li
      className={`row d-flex justify-content-between highlight rounded pe-0 ps-0 pt-0 pb-0  `}
    >
      <Row justify={"space-between"} align={"middle"}>
        <Col span={20}>
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
                  messageApi.info(MESSAGES.INFO.ALL_COMPLETED);
              }}
            />
            {/*添加任务全部*/}
            <div className="w-50">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="请输入任务内容"
                style={{ width: "calc(100% - 80px)", marginRight: "8px" }}
              />
              <Button
                type="primary"
                size="small"
                onClick={onAdded}
                style={{ width: "72px" }}
              >
                添加
              </Button>
            </div>
          </Row>
        </Col>

        <Col span={4}>
          <Dropdown
            className="d-inline-block ms-2"
            onSelect={(eventKey) => {
              onSwitchShow(Number(eventKey) as ShowTypeValue);
            }}
          >
            <Dropdown.Toggle variant="primary" id="dropdown-basic">
              {ShowTypeLabels[showType]}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {Object.values(ShowType).map((value) => {
                return (
                  <Dropdown.Item key={value} eventKey={value}>
                    {ShowTypeLabels[Number(value)]}
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>
      {contextHolder}
    </li>
  );
}
