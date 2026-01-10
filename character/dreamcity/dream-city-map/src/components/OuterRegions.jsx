import React from 'react';

const OuterRegions = ({ regions }) => {
  if (!regions || regions.length === 0) return null;

  // 创建渐变背景
  const createGradient = (region) => {
    const id = `gradient-${region.id}`;
    return (
      <linearGradient
        id={id}
        key={id}
        x1="0%" y1="0%" x2="100%" y2="100%"
        gradientUnits="userSpaceOnUse"
      >
        {region.colors.gradient.map((color, index) => (
          <stop
            key={index}
            offset={`${(index / (region.colors.gradient.length - 1)) * 100}%`}
            stopColor={color}
          />
        ))}
      </linearGradient>
    );
  };

  // 创建图案（简化版）
  const createPattern = (region) => {
    const patternId = `pattern-${region.id}`;
    const config = region.patternConfig;

    if (!config) return null;

    switch (config.type) {
      case 'wave':
        return (
          <pattern
            id={patternId}
            key={patternId}
            patternUnits="userSpaceOnUse"
            width="50"
            height="30"
          >
            <path
              d="M 0,15 Q 12,5 25,15 T 50,15"
              fill="none"
              stroke={region.colors.primary}
              strokeWidth="1.5"
              opacity={config.opacity}
            />
          </pattern>
        );
      
      case 'grass':
        return (
          <pattern
            id={patternId}
            key={patternId}
            patternUnits="userSpaceOnUse"
            width="25"
            height="25"
          >
            <path
              d="M 5,20 Q 10,5 15,20 M 12,20 Q 17,10 22,20"
              fill="none"
              stroke={region.colors.primary}
              strokeWidth="1"
              opacity={config.opacity}
            />
          </pattern>
        );
      
      case 'mountain':
        return (
          <pattern
            id={patternId}
            key={patternId}
            patternUnits="userSpaceOnUse"
            width="80"
            height="60"
          >
            <path
              d="M 10,50 L 30,20 L 50,50 M 40,50 L 60,10 L 80,50"
              fill="none"
              stroke={region.colors.primary}
              strokeWidth="1.5"
              opacity={config.opacity}
            />
          </pattern>
        );
      
      case 'tree':
        return (
          <pattern
            id={patternId}
            key={patternId}
            patternUnits="userSpaceOnUse"
            width="40"
            height="40"
          >
            <circle
              cx="20"
              cy="20"
              r="10"
              fill={region.colors.primary}
              opacity={config.opacity * 0.5}
            />
            <path
              d="M 20,10 L 20,30 M 10,20 L 30,20"
              stroke={region.colors.primary}
              strokeWidth="1"
              opacity={config.opacity}
            />
          </pattern>
        );
      
      default:
        return null;
    }
  };

  // 渲染区域路径
  const renderRegionPath = (region) => {
    const w = 1000;
    const h = 1200;
    const { direction } = region;

    if (direction === 'east') {
      // 东部海洋：像浮世绘海浪一样的卷曲边缘
      return `
        M ${w},0 L ${w},${h} L 800,${h} 
        C 700,1000 900,900 850,700 
        C 800,500 950,400 800,200 
        C 750,100 650,50 700,0 Z
      `;
    } else if (direction === 'west') {
      // 西部丘陵：层叠的梯田状曲线
      return `
        M 0,0 L 0,${h} L 200,${h} 
        C 300,1000 100,900 150,700 
        C 200,500 50,400 150,200 
        C 200,100 300,50 200,0 Z
      `;
    } else if (direction === 'north') {
      // 北部群山：险峻的锯齿状
      return `
        M 0,0 L ${w},0 L ${w},250 
        C 800,400 700,150 500,350 
        C 300,550 200,200 0,350 Z
      `;
    } else if (direction === 'south') {
      // 南部森林：茂密的叶片状边缘
      return `
        M 0,${h} L ${w},${h} L ${w},950 
        C 800,850 700,1050 500,950 
        C 300,850 200,1050 0,950 Z
      `;
    }
  };

  return (
    <g id="outer-regions" style={{ pointerEvents: 'none' }}>
      <defs>
        {regions.map(region => (
          <React.Fragment key={region.id}>
            {createGradient(region)}
            {createPattern(region)}
          </React.Fragment>
        ))}
        
        {/* 核心修改：添加径向渐变蒙版，实现“模糊边界” */}
        <mask id="fade-center">
          {/* 白色区域可见，黑色区域透明 */}
          <rect x="0" y="0" width="1000" height="1200" fill="white" />
          {/* 中间挖空，边缘模糊 */}
          <circle cx="500" cy="600" r="450" fill="black" filter="url(#blur-mask)" />
        </mask>
        
        <filter id="blur-mask">
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>

      {regions.map(region => (
        <g key={region.id} id={region.id} mask="url(#fade-center)">
          {/* 基础渐变背景 */}
          <path
            d={renderRegionPath(region)}
            fill={`url(#gradient-${region.id})`}
            opacity={0.6}
            filter="url(#watercolor)" 
          />
          
          {/* 图案叠加 */}
          {region.pattern && (
            <path
              d={renderRegionPath(region)}
              fill={`url(#pattern-${region.id})`}
              opacity={0.2}
              style={{ mixBlendMode: 'overlay' }}
            />
          )}
        </g>
      ))}
    </g>
  );
};

export default OuterRegions;
