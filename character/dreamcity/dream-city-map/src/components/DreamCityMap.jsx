import React, { useState, useRef, useEffect } from 'react';
import OuterRegions from './OuterRegions';
import RoadNetwork from './RoadNetwork';
import LocationMarker from './LocationMarker';
import InfoPopup from './InfoPopup';
import mapConfig from '../data/mapConfig.json';
import locations from '../data/locations.json';
import roadNetwork from '../data/roadNetwork.json';
import '../styles/map.css';

// 定义复杂的银杏叶形状路径 (慕夏风格：有机、流动、扇形)
// M: 起点 (叶柄底部)
// Q: 二次贝塞尔 (叶柄弯曲)
// C: 三次贝塞尔 (叶片展开)
// 修正后的银杏叶：扇形，中间有裂口(Notch)，底部有长柄
const GINKGO_PATH = `
  M 495,1150 
  L 490,950 
  C 400,900 60,750 60,450 
  C 60,200 400,100 490,250 
  L 500,300 
  L 510,250 
  C 600,100 940,200 940,450 
  C 940,750 600,900 510,950 
  L 505,1150 
  Z
`;

const DreamCityMap = () => {
  const [zoom, setZoom] = useState(mapConfig.viewport.defaultZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [pathDisplay, setPathDisplay] = useState(null);
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false); // 调试网格开关

  const { viewport } = mapConfig;

  // 缩放处理
  const handleWheel = (e) => {
    if (!mapConfig.interaction.zoom.enabled) return;
    
    e.preventDefault();
    const delta = -e.deltaY * mapConfig.interaction.zoom.wheelSensitivity;
    const newZoom = Math.min(
      Math.max(zoom + delta, mapConfig.interaction.zoom.minZoom),
      mapConfig.interaction.zoom.maxZoom
    );
    setZoom(newZoom);
  };

  // 拖拽处理
  const handleMouseDown = (e) => {
    if (!mapConfig.interaction.pan.enabled) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 地点点击处理
  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    if (mapConfig.interaction.locationClick.highlightConnectedRoads && location.nearestNodes) {
      // TODO: 实现道路高亮
    }
  };

  // 关闭信息弹窗
  const handleClosePopup = () => {
    setSelectedLocation(null);
  };

  // 绘制梦想河
  const renderRiver = () => {
    const river = mapConfig.river;
    if (!river || !river.path) return null;

    // 将路径点转换为SVG路径字符串
    const pathString = river.path.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x},${point.y}`;
      }
      return `${acc} L ${point.x},${point.y}`;
    }, '');

    return (
      <g id="dream-river">
        {/* 河流主体 */}
        <path
          d={pathString}
          fill="none"
          stroke={river.color}
          strokeWidth={river.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={river.opacity}
        />
        {/* 河岸 */}
        {river.banks.width > 0 && (
          <>
            <path
              d={pathString}
              fill="none"
              stroke={river.banks.color}
              strokeWidth={river.width + river.banks.width * 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.3}
            />
          </>
        )}
      </g>
    );
  };

  // 绘制小石桥
  const renderBridge = () => {
    const bridge = locations.locations.find(loc => loc.isBridge);
    if (!bridge) return null;

    return (
      <g id="hope-bridge">
        <rect
          x={bridge.position.x - 20}
          y={bridge.position.y - 5}
          width={40}
          height={10}
          fill="#8B7355"
          stroke="#5D4E37"
          strokeWidth={1}
          rx={2}
        />
        {/* 桥栏杆 */}
        <line
          x1={bridge.position.x - 20}
          y1={bridge.position.y - 5}
          x2={bridge.position.x + 20}
          y2={bridge.position.y - 5}
          stroke="#5D4E37"
          strokeWidth={2}
        />
        <line
          x1={bridge.position.x - 20}
          y1={bridge.position.y + 5}
          x2={bridge.position.x + 20}
          y2={bridge.position.y + 5}
          stroke="#5D4E37"
          strokeWidth={2}
        />
      </g>
    );
  };

  // 渲染调试网格 (用于对齐底图)
  const renderGrid = () => {
    if (!showGrid) return null;
    const step = 100;
    const lines = [];
    // 垂直线
    for (let x = 0; x <= viewport.width; x += step) {
      lines.push(<line key={`v-${x}`} x1={x} y1={0} x2={x} y2={viewport.height} stroke="#ccc" strokeWidth="1" />);
      lines.push(<text key={`vt-${x}`} x={x + 2} y={20} fontSize="10" fill="#666">{x}</text>);
    }
    // 水平线
    for (let y = 0; y <= viewport.height; y += step) {
      lines.push(<line key={`h-${y}`} x1={0} y1={y} x2={viewport.width} y2={y} stroke="#ccc" strokeWidth="1" />);
      lines.push(<text key={`ht-${y}`} x={2} y={y - 2} fontSize="10" fill="#666">{y}</text>);
    }
    return (
      <g id="debug-grid" style={{ pointerEvents: 'none' }}>
        {lines}
      </g>
    );
  };

  return (
    <div 
      className="dream-city-map-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        width="100%"
        height="100%"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {/* 定义渐变和滤镜 */}
        <defs>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* 背景底色 (清爽的米白/浅灰) */}
        <rect width="100%" height="100%" fill="#F5F5F0" />

        {/* 如果您有底图，可以在这里插入 image 标签 */}
        {/* <image href="/path/to/your/map.png" x="0" y="0" width="1000" height="1200" opacity="0.5" /> */}

        {/* 外围四大区域 */}
        <OuterRegions regions={mapConfig.outerRegions} />

        {/* 城市地基 (阴影层) */}
        <path
          d={GINKGO_PATH}
          fill="none"
          stroke="none"
          filter="url(#shadow)"
        />

        {/* 城市主体 */}
        <g id="city-main">
          {/* 填充 - 干净的浅色 */}
          <path
            d={GINKGO_PATH}
            fill="#FFFCF5"
            stroke="none"
          />
          
          {/* 城墙 (清晰的轮廓线) */}
          <path
            d={GINKGO_PATH}
            fill="none"
            stroke="#4A4A4A"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
        </g>

        {/* 梦想河 */}
        {renderRiver()}

        {/* 道路网络 */}
        <RoadNetwork 
          roads={roadNetwork.roads}
          nodes={roadNetwork.nodes}
          style={mapConfig.roadStyle}
        />

        {/* 小石桥 */}
        {renderBridge()}

        {/* 地点标记 */}
        {locations.locations
          .filter(loc => !loc.isRiver && !loc.isBridge)
          .map(location => (
            <LocationMarker
              key={location.id}
              location={location}
              style={mapConfig.locationStyle}
              onClick={() => handleLocationClick(location)}
              onMouseEnter={() => setHoveredLocation(location)}
              onMouseLeave={() => setHoveredLocation(null)}
              isSelected={selectedLocation?.id === location.id}
              isHovered={hoveredLocation?.id === location.id}
            />
          ))}
          
        {/* 调试网格 */}
        {renderGrid()}
      </svg>

      {/* 信息弹窗 */}
      {selectedLocation && (
        <InfoPopup
          location={selectedLocation}
          onClose={handleClosePopup}
          style={mapConfig.infoPopup.style}
        />
      )}

      {/* 控制面板 */}
      <div className="map-controls">
        <button onClick={() => setZoom(Math.min(zoom + 0.2, mapConfig.interaction.zoom.maxZoom))}>
          +
        </button>
        <button onClick={() => setZoom(Math.max(zoom - 0.2, mapConfig.interaction.zoom.minZoom))}>
          -
        </button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
          重置
        </button>
        <button onClick={() => setShowGrid(!showGrid)} title="切换网格">
          #
        </button>
      </div>

      {/* 图例 */}
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: mapConfig.locationStyle.public.fill }}></div>
          <span>公共场所</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: mapConfig.locationStyle.private.fill }}></div>
          <span>私人区域</span>
        </div>
      </div>
    </div>
  );
};

export default DreamCityMap;
