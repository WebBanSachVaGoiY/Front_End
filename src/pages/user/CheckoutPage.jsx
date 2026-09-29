import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, User, FileText, CheckCircle, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { orderApi } from '../../api/orderApi';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/formatCurrency';
import { DEFAULT_BOOK_COVER } from '../../utils/constants';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const { items, subtotal, discount, shippingFee, getFinalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    recipientName: user?.fullName || '',
    recipientPhone: user?.phone || '',
    shippingAddress: user?.address || '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.recipientName.trim()) errs.recipientName = 'Vui lòng nhập họ tên người nhận';
    if (!form.recipientPhone.trim()) errs.recipientPhone = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9]{10,11}$/.test(form.recipientPhone.replace(/\s/g, '')))
      errs.recipientPhone = 'Số điện thoại không hợp lệ';
    if (!form.shippingAddress.trim()) errs.shippingAddress = 'Vui lòng nhập địa chỉ giao hàng';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const order = await orderApi.createOrder({
        recipientName: form.recipientName,
        recipientPhone: form.recipientPhone,
        shippingAddress: form.shippingAddress,
        note: form.note,
        paymentMethod: 'COD',
        items: items.map((it) => ({
          bookId: it.book?.id || it.id,
          quantity: it.quantity,
        })),
      });
      await clearCart();
      setSuccess(order);
      toast.success('Đặt hàng thành công! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <>
        <Navbar />
        <div className="page-wrapper">
          <div className="container">
            <div className="order-success animate-scaleIn">
              <div className="success-icon">
                <CheckCircle size={64} />
              </div>
              <h2>Đặt hàng thành công!</h2>
              <p>Mã đơn hàng của bạn: <strong className="order-code">{success.orderCode}</strong></p>
              <p className="success-desc">
                Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ xác nhận đơn hàng sớm nhất có thể.
              </p>
              <div className="success-actions">
                <Button variant="primary" onClick={() => navigate('/orders')}>
                  <Package size={16} /> Xem đơn hàng
                </Button>
                <Button variant="secondary" onClick={() => navigate('/books')}>
                  Tiếp tục mua sắm
                </Button>
              </div>
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
        <div className="checkout-page">
          <div className="container">
            <h1 className="checkout-title animate-fadeInDown">Đặt hàng</h1>

            <div className="checkout-layout">
              {/* Form */}
              <form className="checkout-form animate-fadeInUp" onSubmit={handleSubmit} noValidate>
                <div className="checkout-section card">
                  <h3><MapPin size={18} /> Thông tin giao hàng</h3>

                  <div className="form-row">
                    <Input
                      id="recipientName"
                      label="Họ tên người nhận"
                      placeholder="Nguyễn Văn A"
                      value={form.recipientName}
                      onChange={set('recipientName')}
                      icon={<User size={16} />}
                      error={errors.recipientName}
                      required
                    />
                    <Input
                      id="recipientPhone"
                      label="Số điện thoại"
                      placeholder="0912345678"
                      value={form.recipientPhone}
                      onChange={set('recipientPhone')}
                      icon={<Phone size={16} />}
                      error={errors.recipientPhone}
                      required
                    />
                  </div>

                  <Textarea
                    id="shippingAddress"
                    label="Địa chỉ giao hàng"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    value={form.shippingAddress}
                    onChange={set('shippingAddress')}
                    error={errors.shippingAddress}
                    rows={3}
                    required
                  />

                  <Textarea
                    id="note"
                    label="Ghi chú đơn hàng (không bắt buộc)"
                    placeholder="Yêu cầu đặc biệt, thời gian giao hàng..."
                    value={form.note}
                    onChange={set('note')}
                    rows={2}
                  />
                </div>

                {/* Payment method */}
                <div className="checkout-section card">
                  <h3><FileText size={18} /> Phương thức thanh toán</h3>
                  <div className="payment-option active">
                    <div className="payment-radio" />
                    <div>
                      <div className="payment-name">Thanh toán khi nhận hàng (COD)</div>
                      <div className="payment-desc">Thanh toán bằng tiền mặt khi nhận hàng</div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="xl"
                  fullWidth
                  loading={loading}
                  id="place-order-btn"
                >
                  Xác nhận đặt hàng
                </Button>
              </form>

              {/* Order Summary */}
              <div className="checkout-summary animate-fadeInUp">
                <div className="card">
                  <h3>Đơn hàng của bạn</h3>
                  <div className="checkout-items">
                    {items.map((item) => {
                      const price = item.book?.discountPrice || item.book?.price || 0;
                      return (
                        <div key={item.id} className="checkout-item">
                          <img
                            src={item.book?.coverImageUrl || DEFAULT_BOOK_COVER}
                            alt={item.book?.title}
                            className="checkout-item-img"
                            onError={(e) => { e.target.src = DEFAULT_BOOK_COVER; }}
                          />
                          <div className="checkout-item-info">
                            <div className="checkout-item-title">{item.book?.title}</div>
                            <div className="checkout-item-qty">x{item.quantity}</div>
                          </div>
                          <div className="checkout-item-price">
                            {formatCurrency(price * item.quantity)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="divider" />

                  <div className="checkout-totals">
                    <div className="price-row">
                      <span>Tạm tính</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="price-row" style={{ color: 'var(--success)' }}>
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
                      <span>Tổng cộng</span>
                      <span className="total-amount">{formatCurrency(getFinalAmount())}</span>
                    </div>
                  </div>
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
