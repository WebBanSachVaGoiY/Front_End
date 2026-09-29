import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { PageSpinner } from '../../components/ui/Spinner';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { DEFAULT_BOOK_COVER } from '../../utils/constants';
import './OrderHistoryPage.css';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    orderApi.getMyOrders().then((data) => {
      setOrders(data.content || data || []);
    }).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <><Navbar /><PageSpinner /></>;

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="orders-page">
          <div className="container">
            <h1 className="orders-title animate-fadeInDown">
              <Package size={28} />
              Lịch sử đơn hàng
            </h1>

            {orders.length === 0 ? (
              <div className="orders-empty animate-fadeInUp">
                <Package size={64} className="empty-icon" />
                <h3>Chưa có đơn hàng nào</h3>
                <p>Hãy bắt đầu mua sắm để tạo đơn hàng đầu tiên!</p>
                <Link to="/books" className="btn btn-primary btn-md">Khám phá sách</Link>
              </div>
            ) : (
              <div className="orders-list animate-fadeInUp">
                {orders.map((order) => (
                  <div key={order.id} className="order-card card">
                    <div className="order-card-header" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                      <div className="order-info">
                        <div className="order-code">#{order.orderCode}</div>
                        <div className="order-date">{formatDateTime(order.createdAt)}</div>
                      </div>
                      <div className="order-meta">
                        <OrderStatusBadge status={order.status} />
                        <div className="order-amount">{formatCurrency(order.finalAmount)}</div>
                        <button className="expand-btn">
                          {expandedId === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {expandedId === order.id && (
                      <div className="order-card-body animate-fadeInDown">
                        <div className="divider" />

                        {/* Shipping info */}
                        <div className="shipping-info">
                          <div><span className="info-label">Người nhận:</span> {order.recipientName}</div>
                          <div><span className="info-label">Điện thoại:</span> {order.recipientPhone}</div>
                          <div><span className="info-label">Địa chỉ:</span> {order.shippingAddress}</div>
                          {order.note && <div><span className="info-label">Ghi chú:</span> {order.note}</div>}
                        </div>

                        {/* Items */}
                        {/* TODO: [ORDER-ITEM-DTO] Gỡ bỏ map kép phẳng/lồng sau khi Backend hoàn thiện OrderItemResponseDTO ở Plan 2 */}
                        {order.items?.map((item) => {
                          const bookId = item.book?.id || item.bookId;
                          const bookTitle = item.book?.title || item.bookTitle || 'Sách';
                          const bookAuthor = item.book?.author || item.bookAuthor || '';
                          const coverUrl = item.book?.coverImageUrl || item.coverImageUrl || DEFAULT_BOOK_COVER;
                          return (
                            <div key={item.id} className="order-item">
                              <img
                                src={coverUrl}
                                alt={bookTitle}
                                className="order-item-img"
                                onError={(e) => { e.target.src = DEFAULT_BOOK_COVER; }}
                              />
                              <div className="order-item-info">
                                {bookId ? (
                                  <Link to={`/books/${bookId}`} className="order-item-title">
                                    {bookTitle}
                                  </Link>
                                ) : (
                                  <span className="order-item-title">{bookTitle}</span>
                                )}
                                {bookAuthor && <div className="order-item-author">{bookAuthor}</div>}
                                <div className="order-item-qty-price">
                                  <span>x{item.quantity}</span>
                                  <span>{formatCurrency(item.price)}</span>
                                </div>
                              </div>
                              <div className="order-item-total">
                                {formatCurrency(item.subtotal || item.price * item.quantity)}
                              </div>
                            </div>
                          );
                        })}

                        {/* Totals */}
                        <div className="order-totals">
                          <div className="price-row">
                            <span>Tổng tiền hàng</span>
                            <span>{formatCurrency(order.totalAmount)}</span>
                          </div>
                          <div className="price-row">
                            <span>Phí vận chuyển</span>
                            <span>{formatCurrency(order.shippingFee)}</span>
                          </div>
                          <div className="price-row total-row">
                            <span>Tổng thanh toán</span>
                            <span className="total-amount">{formatCurrency(order.finalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
