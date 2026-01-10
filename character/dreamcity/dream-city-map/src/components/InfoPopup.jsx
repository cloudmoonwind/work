import React, { useEffect, useRef } from 'react';
import '../styles/map.css';

const InfoPopup = ({ location, onClose, style }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    // 点击外部关闭弹窗
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!location) return null;

  // 格式化状态
  const formatStatus = (status) => {
    const statusMap = {
      'active': '正常营业',
      'closed': '暂停营业',
      'construction': '施工中'
    };
    return statusMap[status] || status;
  };

  // 格式化类型
  const formatType = (type, category) => {
    const categoryMap = {
      'plaza': '广场',
      'cultural': '文化场所',
      'commercial': '商业',
      'food': '餐饮',
      'entertainment': '娱乐',
      'service': '服务',
      'education': '教育',
      'sports': '运动',
      'medical': '医疗',
      'science': '科学',
      'nature': '自然',
      'residential': '居住',
      'landmark': '地标'
    };
    return categoryMap[category] || category;
  };

  return (
    <div className="info-popup-overlay">
      <div 
        ref={popupRef}
        className="info-popup"
        style={style}
      >
        {/* 关闭按钮 */}
        <button className="popup-close" onClick={onClose}>
          ×
        </button>

        {/* 标题 */}
        <div className="popup-header">
          <h3 className="popup-title">
            <span className="popup-icon">{location.icon === 'fountain' ? '⛲' : '📍'}</span>
            {location.name}
          </h3>
          {location.nameEn && (
            <p className="popup-subtitle">{location.nameEn}</p>
          )}
        </div>

        {/* 内容 */}
        <div className="popup-content">
          {/* 基本信息 */}
          <div className="popup-section">
            <div className="info-row">
              <span className="info-label">类型：</span>
              <span className="info-value">{formatType(location.type, location.category)}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">状态：</span>
              <span className={`info-value status-${location.status}`}>
                {formatStatus(location.status)}
              </span>
            </div>

            {location.openHours && (
              <div className="info-row">
                <span className="info-label">开放时间：</span>
                <span className="info-value">{location.openHours}</span>
              </div>
            )}

            {location.capacity && (
              <div className="info-row">
                <span className="info-label">容量：</span>
                <span className="info-value">{location.capacity}人</span>
              </div>
            )}
          </div>

          {/* 描述 */}
          {location.description && (
            <div className="popup-section">
              <p className="location-description">{location.description}</p>
            </div>
          )}

          {/* 标签 */}
          {location.tags && location.tags.length > 0 && (
            <div className="popup-section">
              <div className="location-tags">
                {location.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 可互动内容 */}
          {location.interactions && location.interactions.length > 0 && (
            <div className="popup-section">
              <div className="info-label">可进行活动：</div>
              <div className="interactions">
                {location.interactions.map((interaction, index) => (
                  <span key={index} className="interaction-badge">
                    {interaction}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="popup-footer">
          <button className="btn-primary" onClick={() => alert('前往此地点')}>
            前往
          </button>
          <button className="btn-secondary" onClick={() => alert('查看详情')}>
            详情
          </button>
        </div>

        {/* 小箭头 */}
        <div className="popup-arrow"></div>
      </div>
    </div>
  );
};

export default InfoPopup;
