import React from "react";

const InsightCard = ({ insight }: any) => (
  <div style={cardStyle}>
    <h2>📊 Action Insights</h2>
    <h3>{insight.decision}</h3>
    <p>{insight.explanation}</p>
    <ul>
      {insight.key_points.map((point: string, index: number) => (
        <li key={index}>{point}</li>
      ))}
    </ul>
  </div>
);

const cardStyle = {
  border: "2px solid #2e7d32",
  padding: 20,
  borderRadius: 8
};

export default InsightCard;