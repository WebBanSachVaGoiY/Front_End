import { ORDER_STATUS } from '../../utils/constants';
import './Badge.css';

export function Badge({ children, color, bg, className = '', borderless = false }) {
  return (
    <span
      className={`badge ${borderless ? 'badge-clean' : ''} ${className}`}
      style={{
        color,
        background: borderless ? 'transparent' : bg,
        border: borderless ? 'none' : `1px solid ${color}40`,
        padding: borderless ? '0' : undefined,
      }}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status, showDot = true }) {
  const config = ORDER_STATUS[status] || ORDER_STATUS.PENDING;
  return (
    <span
      className="status-badge-clean"
      style={{ color: config.color }}
    >
      {showDot && <span className="status-dot" style={{ backgroundColor: config.color }} />}
      <span>{config.label}</span>
    </span>
  );
}

export function StockBadge({ stock, showDot = true }) {
  let color = '#10B981';
  let text = 'Còn hàng';
  if (stock === 0) {
    color = '#EF4444';
    text = 'Hết hàng';
  } else if (stock <= 5) {
    color = '#F59E0B';
    text = `Còn ${stock} cuốn`;
  }

  return (
    <span
      className="status-badge-clean"
      style={{ color }}
    >
      {showDot && <span className="status-dot" style={{ backgroundColor: color }} />}
      <span>{text}</span>
    </span>
  );
}
