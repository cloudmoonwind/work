import React from 'react';

const RoadNetwork = ({ roads, nodes, style }) => {
  if (!roads || roads.length === 0) return null;

  // 将路径点转换为SVG路径字符串
  const pathToString = (road) => {
    if (!road.path || road.path.length === 0) {
      // 如果没有path，使用简单的直线
      const fromNode = nodes.find(n => n.id === road.from);
      const toNode = nodes.find(n => n.id === road.to);
      if (!fromNode || !toNode) return '';
      return `M ${fromNode.position.x},${fromNode.position.y} L ${toNode.position.x},${toNode.position.y}`;
    }

    let pathString = '';
    road.path.forEach((point, index) => {
      if (index === 0) {
        pathString = `M ${point.x},${point.y}`;
      } else if (point.control) {
        // 使用二次贝塞尔曲线
        const nextPoint = road.path[index + 1];
        if (nextPoint) {
          pathString += ` Q ${point.x},${point.y} ${nextPoint.x},${nextPoint.y}`;
        }
      } else if (!road.path[index - 1]?.control) {
        pathString += ` L ${point.x},${point.y}`;
      }
    });

    return pathString;
  };

  // 获取道路样式
  const getRoadStyle = (road) => {
    return road.type === 'main' ? style.main : style.branch;
  };

  return (
    <g id="road-network">
      {/* 道路 */}
      {roads.map(road => {
        const roadStyle = getRoadStyle(road);
        const pathString = pathToString(road);
        
        return (
          <g key={road.id} className="road">
            {/* 道路底色（白色填充） */}
            <path
              d={pathString}
              fill="none"
              stroke={roadStyle.fill}
              strokeWidth={roadStyle.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={roadStyle.opacity}
            />
            {/* 道路边框 */}
            <path
              d={pathString}
              fill="none"
              stroke={roadStyle.stroke}
              strokeWidth={roadStyle.width + roadStyle.strokeWidth * 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={roadStyle.opacity * 0.8}
              style={{ pointerEvents: 'none' }}
            />
            {/* 道路名称标签（可选，用于调试） */}
            {/* <text
              x={(fromNode.position.x + toNode.position.x) / 2}
              y={(fromNode.position.y + toNode.position.y) / 2}
              fontSize="10"
              fill="#999"
              textAnchor="middle"
            >
              {road.name}
            </text> */}
          </g>
        );
      })}

      {/* 道路节点（可选显示） */}
      {nodes && nodes.map(node => (
        <g key={node.id} className="road-node" style={{ display: 'none' }}>
          <circle
            cx={node.position.x}
            cy={node.position.y}
            r={style.intersection.radius}
            fill={style.intersection.fill}
            stroke={style.intersection.stroke}
            strokeWidth={style.intersection.strokeWidth}
          />
          {/* 节点ID标签（用于调试） */}
          {/* <text
            x={node.position.x}
            y={node.position.y - 8}
            fontSize="8"
            fill="#666"
            textAnchor="middle"
          >
            {node.id}
          </text> */}
        </g>
      ))}
    </g>
  );
};

export default RoadNetwork;
