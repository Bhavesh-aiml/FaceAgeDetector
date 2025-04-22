import { Card, ListGroup, Badge } from 'react-bootstrap';

const ResultsDisplay = ({ results, isManualSelection }) => {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="results-container">
      <h3 className="mb-3">Detection Results</h3>
      {isManualSelection && (
        <div className="mb-3">
          <Badge bg="info">Manual Selection Mode</Badge>
        </div>
      )}
      
      {results.map((result, index) => (
        <Card key={index} className="results-card">
          <Card.Header>
            <strong>Face #{index + 1}</strong>
            {result.confidence && (
              <Badge bg="secondary" className="ms-2">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </Badge>
            )}
          </Card.Header>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <strong>Age:</strong> {Math.round(result.age)} years
            </ListGroup.Item>
            {result.gender && (
              <ListGroup.Item>
                <strong>Gender:</strong> {result.gender.charAt(0).toUpperCase() + result.gender.slice(1)} 
                {result.genderProbability && (
                  <span className="text-muted ms-2">
                    ({(result.genderProbability * 100).toFixed(1)}% confidence)
                  </span>
                )}
              </ListGroup.Item>
            )}
            {result.position && (
              <ListGroup.Item>
                <strong>Position:</strong> x: {Math.round(result.position.x)}, 
                y: {Math.round(result.position.y)}, 
                width: {Math.round(result.position.width)}, 
                height: {Math.round(result.position.height)}
              </ListGroup.Item>
            )}
          </ListGroup>
        </Card>
      ))}
    </div>
  );
};

export default ResultsDisplay;