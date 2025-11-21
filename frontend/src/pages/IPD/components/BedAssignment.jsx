import { Card, Row, Col, Badge } from "antd";
import "../IPD.css";

const BedAssignment = ({ beds, onSelect }) => {
  return (
    <Card title="Ward Map" styles={{ body: { padding: 12 } }}>
      <Row gutter={[16, 16]}>
        {beds.map((bed) => (
          <Col xs={24} sm={12} md={8} lg={6} key={bed.id}>
            <div
              className={`bed-card ${bed.status}`}
              onClick={() => onSelect(bed)}
            >
              <Badge
                status={bed.patient ? "error" : "success"}
                text={
                  bed.patient ? `Occupied (${bed.patient.name})` : "Available"
                }
              />
              <div>Bed {bed.number}</div>
              <div>{bed.ward}</div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default BedAssignment;
