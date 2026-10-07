import { useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { DEFAULT_BOOK_COVER, ORDER_STATUS } from '../../utils/constants';
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
  const [selectedOrder, setSelectedOrder] = useState(null);
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
                  <th>Thao tác</th>
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
                      <td>
                        <button
                          type="button"
                          className="table-actions btn-icon-sm"
                          onClick={() => setSelectedOrder(order)}
                          title="Xem chi tiết đơn hàng"
                        >
                          <Eye size={15} />
                        </button>
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Chi tiết đơn hàng #${selectedOrder.orderCode}`}
          size="lg"
        >
          <div className="order-detail-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Ngày đặt: </span>
                <strong style={{ fontSize: '0.875rem' }}>{formatDateTime(selectedOrder.createdAt)}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Trạng thái: </span>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>
            </div>

            {/* Recipient & Payment Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg-surface)', padding: '14px 16px', borderRadius: '8px', fontSize: '0.875rem' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Thông tin nhận hàng</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Người nhận:</strong> {selectedOrder.recipientName}</div>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Điện thoại:</strong> {selectedOrder.recipientPhone}</div>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Địa chỉ:</strong> {selectedOrder.shippingAddress}</div>
                  {selectedOrder.note && <div><strong style={{ color: 'var(--text-primary)' }}>Ghi chú:</strong> {selectedOrder.note}</div>}
                </div>
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Thanh toán</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Phương thức:</strong> {selectedOrder.paymentMethod || 'COD'}</div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Trạng thái TT: </strong>
                    <span style={{ color: selectedOrder.paymentStatus === 'PAID' ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                      {selectedOrder.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Danh sách sản phẩm</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {selectedOrder.items?.map((item) => {
                  const bookTitle = item.book?.title || item.bookTitle || 'Sách';
                  const bookAuthor = item.book?.author || item.bookAuthor || '';
                  const coverUrl = item.book?.coverImageUrl || item.coverImageUrl || DEFAULT_BOOK_COVER;
                  const itemPrice = item.price || item.unitPrice || 0;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={coverUrl}
                          alt={bookTitle}
                          style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => { e.target.src = DEFAULT_BOOK_COVER; }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{bookTitle}</div>
                          {bookAuthor && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bookAuthor}</div>}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {formatCurrency(itemPrice)} × {item.quantity}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.9rem' }}>
                        {formatCurrency(item.subtotal || itemPrice * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span>Tiền hàng:</span>
                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span>Phí vận chuyển:</span>
                <span>{formatCurrency(selectedOrder.shippingFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', borderTop: '1px dashed var(--border)', paddingTop: '8px' }}>
                <span>Tổng cộng:</span>
                <span>{formatCurrency(selectedOrder.finalAmount)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
