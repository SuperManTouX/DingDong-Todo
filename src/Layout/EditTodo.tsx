import { Content, Footer, Header } from "antd/es/layout/layout";
import { Col, Row } from "antd";

export default function EditTodo() {
  return (
    <>
      <Header className="bg-danger">完成，日期，优先级</Header>
      <Content className="minHeight-large pe-2 ps-2">
        <Row justify="center">
          <Col>
            <h1>标题</h1>
            内容，备注
          </Col>
        </Row>
      </Content>
      <Footer className={"bg-primary"}>所属组，标签</Footer>
    </>
  );
}
