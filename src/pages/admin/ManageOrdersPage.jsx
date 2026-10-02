import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { ORDER_STATUS } from '../../utils/constants';
import './AdminDashboard.css';

const STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'RETURNED'],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
};

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(null);
  const toast = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getAllOrders({ size: 50 });
      setOrders(data.content || data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Cập nhật trạng thái thành công: ${ORDER_STATUS[newStatus]?.label}`);
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.orderCode?.toLowerCase().includes(search.toLowerCase()) ||
      o.recipientName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Quản lý đơn hàng</h1>
        <p>Cập nhật trạng thái và theo dõi đơn hàng</p>
      </div>

      <div className="admin-controls">
        <div className="admin-search-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            className="form-input admin-search-input"
            placeholder="Tìm mã đơn, tên khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          style={{ width: 180, height: 50 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Người nhận</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Chuyển sang</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const nextStatuses = STATUS_TRANSITIONS[order.status] || [];
                  return (
                    <tr key={order.id}>
                      <td className="order-code-cell">#{order.orderCode}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.recipientName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.recipientPhone}</div>
                      </td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td className="amount-cell">{formatCurrency(order.finalAmount)}</td>
                      <td>
                        <span style={{
                          color: order.paymentStatus === 'PAID' ? 'var(--success)' : 'var(--text-muted)',
                          fontSize: '0.8125rem',
                        }}>
                          {order.paymentStatus === 'PAID' ? '✓ Đã TT' : 'COD'}
                        </span>
                      </td>
                      <td><OrderStatusBadge status={order.status} /></td>
                      <td>
                        {updating === order.id ? (
                          <Spinner size="sm" />
                        ) : nextStatuses.length > 0 ? (
                          <select
                            className="form-input"
                            style={{ fontSize: '0.8125rem', height: 32, padding: '0 8px' }}
                            value=""
                            onChange={(e) => e.target.value && handleStatusChange(order.id, e.target.value)}
                          >
                            <option value="">Chuyển sang...</option>
                            {nextStatuses.map((s) => (
                              <option key={s} value={s}>{ORDER_STATUS[s]?.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Không tìm thấy đơn hàng nào
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
