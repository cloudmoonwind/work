import React from 'react';

const LocationMarker = ({
  location,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isSelected,
  isHovered
}) => {
  if (!location || !location.position) return null;

  // 获取样式
  const markerStyle = location.type === 'private' 
    ? style.private 
    : location.type === 'special'
    ? style.special
    : style.public;

  const { x, y } = location.position;
  const radius = markerStyle.radius;

  // 动态填充颜色（hover 或 selected 时）
  const fillColor = isSelected || isHovered 
    ? markerStyle.hoverFill || markerStyle.fill
    : markerStyle.fill;

  // 图标映射
  const renderIcon = () => {
    const iconSize = radius * 0.6;
    const iconX = x;
    const iconY = y;

    // 简化的图标，实际项目中可以使用 SVG icons 或 emoji
    switch (location.icon) {
      case 'fountain':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            ⛲
          </text>
        );
      case 'tower':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🗼
          </text>
        );
      case 'shop':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🏪
          </text>
        );
      case 'food':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🍜
          </text>
        );
      case 'game':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🎮
          </text>
        );
      case 'computer':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            💻
          </text>
        );
      case 'book':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            📚
          </text>
        );
      case 'home':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🏠
          </text>
        );
      case 'store':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🏪
          </text>
        );
      case 'cart':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🛒
          </text>
        );
      case 'wrench':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🔧
          </text>
        );
      case 'school':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🏫
          </text>
        );
      case 'library':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            📖
          </text>
        );
      case 'sports':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            ⚽
          </text>
        );
      case 'hospital':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🏥
          </text>
        );
      case 'tree':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🌳
          </text>
        );
      case 'flower':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🌹
          </text>
        );
      case 'water':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            💧
          </text>
        );
      case 'paw':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🐾
          </text>
        );
      case 'telescope':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🔭
          </text>
        );
      case 'bridge':
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            🌉
          </text>
        );
      default:
        return (
          <text x={iconX} y={iconY} fontSize={iconSize} textAnchor="middle" dominantBaseline="central">
            📍
          </text>
        );
    }
  };

  return (
    <g
      className={`location-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      {/* 阴影效果 */}
      {markerStyle.shadow?.enabled && (
        <circle
          cx={x + 2}
          cy={y + 2}
          r={radius}
          fill={markerStyle.shadow.color}
          filter={`blur(${markerStyle.shadow.blur}px)`}
        />
      )}

      {/* 主圆形 */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={fillColor}
        stroke={markerStyle.stroke}
        strokeWidth={markerStyle.strokeWidth}
        opacity={markerStyle.opacity}
        className="location-circle"
      />

      {/* 图标 */}
      {renderIcon()}

      {/* 地点名称 */}
      <text
        x={x}
        y={y + style.label.offsetY}
        fontSize={style.label.fontSize}
        fontFamily={style.label.fontFamily}
        fill={style.label.fill}
        stroke={style.label.stroke}
        strokeWidth={style.label.strokeWidth}
        textAnchor="middle"
        paintOrder="stroke"
        className="location-label"
      >
        {location.name}
      </text>

      {/* 选中状态的外圈 */}
      {isSelected && (
        <circle
          cx={x}
          cy={y}
          r={radius + 4}
          fill="none"
          stroke={markerStyle.stroke}
          strokeWidth={2}
          strokeDasharray="4 2"
          className="selection-ring"
        />
      )}
    </g>
  );
};

export default LocationMarker;
