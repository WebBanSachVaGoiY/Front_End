import { ORDER_STATUS } from '../../utils/constants';

export function Badge({ children, color, bg, className = '' }) {
  return (
    <span
      className={`badge ${className}`}
      style={{ color, background: bg, border: `1px solid ${color}40` }}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }) {
  const config = ORDER_STATUS[status] || ORDER_STATUS.PENDING;
  return (
    <Badge color={config.color} bg={config.bg}>
      {config.label}
    </Badge>
  );
}

export function StockBadge({ stock }) {
  if (stock === 0) return <Badge color="#EF4444" bg="rgba(239,68,68,0.1)">Hết hàng</Badge>;
  if (stock <= 5) return <Badge color="#F59E0B" bg="rgba(245,158,11,0.1)">Còn {stock} cuốn</Badge>;
  return <Badge color="#10B981" bg="rgba(16,185,129,0.1)">Còn hàng</Badge>;
}
