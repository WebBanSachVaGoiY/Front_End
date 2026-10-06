import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2, Plus, Minus, ShoppingBag, Tag, X, ArrowRight, ShoppingCart,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/ui/Toast';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { DEFAULT_BOOK_COVER } from '../../utils/constants';
import { voucherApi } from '../../api/voucherApi';
import './CartPage.css';

export default function CartPage() {
  const {
    items, subtotal, discount, shippingFee, voucher,
    updateQuantity, removeItem, clearCart, applyVoucher, removeVoucher, getFinalAmount,
    isLoading,
  } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [showVouchers, setShowVouchers] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [removingId, setRemovingId] = useState(null);

  const handleQuantityChange = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    if (newQty > item.book.stockQuantity) {
      toast.warning(`Chỉ còn ${item.book.stockQuantity} cuốn trong kho`);
      return;
    }
    try {
      await updateQuantity(item.id, newQty);
    } catch {
      toast.error('Không thể cập nhật số lượng');
    }
  };

  const handleRemove = async (itemId) => {
    setRemovingId(itemId);
    try {
      await removeItem(itemId);
      toast.success('Đã xóa sách khỏi giỏ hàng');
    } catch {
      toast.error('Không thể xóa');
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Xóa tất cả sản phẩm trong giỏ hàng?')) return;
    await clearCart();
    toast.success('Đã xóa tất cả sản phẩm');
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    try {
      const v = await voucherApi.validateVoucher(voucherCode, subtotal);
      applyVoucher(v);
      toast.success(`Áp dụng mã "${v.code}" thành công! Giảm ${v.discount}%`);
      setVoucherCode('');
      setShowVouchers(false);
    } catch (err) {
      toast.error(err.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleShowVouchers = async () => {
    if (availableVouchers.length === 0) {
      const list = await voucherApi.getVouchers();
      setAvailableVouchers(list);
    }
    setShowVouchers((v) => !v);
  };

  const handleSelectVoucher = (v) => {
    applyVoucher(v);
    toast.success(`Áp dụng mã "${v.code}" thành công!`);
    setShowVouchers(false);
  };

  if (isLoading) return <><Navbar /><div className="page-wrapper"><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner size="lg" /></div></div></>;

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="page-wrapper">
          <div className="container">
            <div className="cart-empty animate-fadeInUp">
              <ShoppingCart size={80} className="cart-empty-icon" />
              <h2>Giỏ hàng của bạn đang trống</h2>
              <p>Hãy khám phá và thêm sách vào giỏ hàng</p>
              <Button variant="primary" size="lg" onClick={() => navigate('/books')}>
                Khám phá sách ngay
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="cart-page">
          <div className="container">
            <div className="cart-header animate-fadeInDown">
              <h1>
                <ShoppingBag size={28} />
                Giỏ hàng ({items.length} sản phẩm)
              </h1>
              <button className="clear-cart-btn" onClick={handleClearCart}>
                <Trash2 size={14} /> Xóa tất cả
              </button>
            </div>

            <div className="cart-layout">
              {/* Cart Items */}
              <div className="cart-items animate-fadeInUp">
                {items.map((item) => {
                  const price = item.book?.discountPrice || item.book?.price || 0;
                  return (
                    <div key={item.id} className="cart-item card">
                      <Link to={`/books/${item.book?.id}`} className="cart-item-image">
                        <img
                          src={item.book?.coverImageUrl || DEFAULT_BOOK_COVER}
                          alt={item.book?.title}
                          onError={(e) => { e.target.src = DEFAULT_BOOK_COVER; }}
                        />
                      </Link>
                      <div className="cart-item-info">
                        <Link to={`/books/${item.book?.id}`} className="cart-item-title">
                          {item.book?.title}
                        </Link>
                        <p className="cart-item-author">{item.book?.author}</p>
                        <div className="cart-item-price">{formatCurrency(price)}</div>

                        <div className="cart-item-controls">
                          <div className="quantity-control">
                            <button className="qty-btn" onClick={() => handleQuantityChange(item, -1)} disabled={item.quantity <= 1}>
                              <Minus size={14} />
                            </button>
                            <span className="qty-display">{item.quantity}</span>
                            <button className="qty-btn" onClick={() => handleQuantityChange(item, 1)} disabled={item.quantity >= item.book.stockQuantity}>
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="cart-item-total">
                            {formatCurrency(price * item.quantity)}
                          </div>

                          <button
                            className="remove-item-btn"
                            onClick={() => handleRemove(item.id)}
                            disabled={removingId === item.id}
                            aria-label="Xóa"
                          >
                            {removingId === item.id
                              ? <Spinner size="sm" />
                              : <Trash2 size={16} />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="cart-summary animate-fadeInUp">
                <div className="summary-card card">
                  <h3>Tóm tắt đơn hàng</h3>

                  {/* Voucher */}
                  <div className="voucher-section">
                    <div className="voucher-header">
                      <Tag size={16} />
                      <span>Mã giảm giá</span>
                      <button className="voucher-list-btn" onClick={handleShowVouchers}>
                        Chọn mã
                      </button>
                    </div>

                    {showVouchers && (
                      <div className="voucher-dropdown animate-fadeInDown">
                        {availableVouchers.map((v) => (
                          <button
                            key={v.id}
                            className="voucher-option"
                            onClick={() => handleSelectVoucher(v)}
                          >
                            <div className="voucher-code">{v.code}</div>
                            <div className="voucher-desc">{v.name}</div>
                            {v.minOrder > 0 && (
                              <div className="voucher-min">Tối thiểu {formatCurrency(v.minOrder)}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {voucher ? (
                      <div className="voucher-applied">
                        <span className="voucher-applied-code">{voucher.code}</span>
                        <span className="voucher-applied-discount">-{voucher.discount}%</span>
                        <button className="voucher-remove" onClick={removeVoucher}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="voucher-input-row">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Nhập mã giảm giá"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleApplyVoucher}
                          loading={voucherLoading}
                        >
                          Áp dụng
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="divider" />

                  {/* Price breakdown */}
                  <div className="price-breakdown">
                    <div className="price-row">
                      <span>Tạm tính</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="price-row discount-row">
                        <span>Giảm giá</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="price-row">
                      <span>Phí vận chuyển</span>
                      <span>{formatCurrency(shippingFee)}</span>
                    </div>
                    <div className="divider" />
                    <div className="price-row total-row">
                      <span>Tổng thanh toán</span>
                      <span className="total-amount">{formatCurrency(getFinalAmount())}</span>
                    </div>
                  </div>

                  <Button
                    variant="accent"
                    size="lg"
                    fullWidth
                    icon={<ArrowRight size={18} />}
                    iconPosition="right"
                    onClick={() => navigate('/checkout')}
                    id="checkout-btn"
                  >
                    Tiến hành đặt hàng
                  </Button>

                  <Link to="/books" className="continue-shopping">
                    ← Tiếp tục mua sắm
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
