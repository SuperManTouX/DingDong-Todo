// @ts-ignore
import { ControllerProps } from "@/types";
import { ShowType, ShowTypeLabels, type ShowTypeValue } from "@/constants";
import { Dropdown } from "react-bootstrap";
import { Col, message, Row } from "antd";

interface ControllerExtendedProps extends ControllerProps {
  text: string;
  setText: (text: string) => void;
  onAdded: () => void;
}

export default function Controller({
  onSwitchShow,
  onCompleteAll,
  isAllDone,
  showType,
  text,
  setText,
  onAdded,
}: ControllerExtendedProps) {
  return (
    <li
      className={`row d-flex justify-content-between highlight rounded pe-0 ps-0 pt-0 pb-0  `}
    >
      <Row justify={"space-between"} align={"middle"}>
        <Col span={20}>
          <Row justify={"start"} align={"middle"}>
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
                if (e.currentTarget.checked) message.info(`已完成全部`);
              }}
            />
            <div className="input-group input-group-sm w-50">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="form-control"
                placeholder="Username"
                aria-label="Username"
                aria-describedby="basic-addon1"
              />
              <button
                type="button"
                onClick={onAdded}
                className="btn btn-primary btn-sm"
              >
                添加
              </button>
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
    </li>
  );
}
