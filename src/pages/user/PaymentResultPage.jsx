import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Package, RefreshCw, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { paymentApi } from '../../api/paymentApi';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import './CheckoutPage.css';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = Object.fromEntries(searchParams.entries());

        if (!params.vnp_ResponseCode && !params.vnp_TxnRef) {
          setError('Không tìm thấy thông tin phản hồi từ cổng thanh toán VNPay.');
          setLoading(false);
          return;
        }

        const verifyResult = await paymentApi.verifyVNPayReturn(params);
        setResult(verifyResult);

        // Chỉ xóa giỏ hàng khi giao dịch thanh toán trực tuyến thành công
        if (verifyResult?.success) {
          try {
            await clearCart();
          } catch (e) {
            console.warn('Lỗi khi dọn giỏ hàng phía frontend:', e);
          }
        }
      } catch (err) {
        console.error('Lỗi khi xác thực kết quả VNPay:', err);
        setError(err.response?.data?.message || err.message || 'Không thể xác thực giao dịch với máy chủ.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-wrapper" style={{ padding: '6rem 0', textAlign: 'center' }}>
          <PageSpinner />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
            Đang xác thực kết quả thanh toán từ VNPay, vui lòng đợi trong giây lát...
          </p>
        </div>
        <Footer />
      </>
    );
  }

  const isSuccess = result?.success;

  return (
    <>
      <Navbar />
      <div className="page-wrapper" style={{ padding: '4rem 0 6rem' }}>
        <div className="container">
          <div className="order-success card animate-scaleIn" style={{ maxWidth: '580px', margin: '0 auto', padding: '2.5rem' }}>
            {isSuccess ? (
              <>
                <div className="success-icon" style={{ color: 'var(--success)' }}>
                  <CheckCircle size={64} />
                </div>
                <h2>Thanh toán thành công! 🎉</h2>
                <p className="success-desc">
                  Giao dịch thanh toán trực tuyến qua <strong>VNPAY</strong> đã được xác nhận thành công.
                </p>

                {/* Thông tin giao dịch chi tiết */}
                <div
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    margin: '1rem 0',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Mã đơn hàng:</span>
                    <strong style={{ color: 'var(--accent)' }}>#{result.orderCode}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Số tiền đã thanh toán:</span>
                    <strong>{formatCurrency(result.amount)}</strong>
                  </div>
                  {result.transactionNo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Mã giao dịch VNPay:</span>
                      <span>{result.transactionNo}</span>
                    </div>
                  )}
                  {result.bankCode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Ngân hàng / Cổng:</span>
                      <span>{result.bankCode}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Trạng thái thanh toán:</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>ĐÃ THANH TOÁN (PAID)</span>
                  </div>
                </div>

                <div className="success-actions" style={{ width: '100%', marginTop: '0.5rem' }}>
                  <Button variant="primary" fullWidth onClick={() => navigate('/orders')}>
                    <Package size={16} /> Xem đơn hàng của tôi
                  </Button>
                  <Button variant="secondary" fullWidth onClick={() => navigate('/books')}>
                    <ShoppingBag size={16} /> Tiếp tục mua sắm
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="success-icon" style={{ color: 'var(--error)' }}>
                  <XCircle size={64} />
                </div>
                <h2>Thanh toán không thành công</h2>
                <p className="success-desc" style={{ color: 'var(--error)' }}>
                  {result?.message || error || 'Giao dịch thanh toán đã bị hủy hoặc xảy ra lỗi từ cổng thanh toán.'}
                </p>

                {/* Thông tin tham chiếu nếu có */}
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.06)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    margin: '1rem 0',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Mã tham chiếu:</span>
                    <strong>#{result?.orderCode || searchParams.get('vnp_TxnRef') || 'Chưa xác định'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Mã phản hồi VNPay:</span>
                    <span>{result?.responseCode || searchParams.get('vnp_ResponseCode') || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Trạng thái đơn:</span>
                    <span style={{ color: 'var(--error)', fontWeight: 600 }}>Không khởi tạo đơn hàng</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '1rem 0 1.5rem', textAlign: 'center', lineHeight: 1.5 }}>
                  💡 Giao dịch chưa hoàn tất nên đơn hàng <strong>chưa được tạo</strong>. Toàn bộ sách đã chọn vẫn được <strong>giữ nguyên trong giỏ hàng</strong> của bạn.
                </p>

                <div className="success-actions" style={{ width: '100%', marginTop: '0.5rem' }}>
                  <Button variant="primary" fullWidth onClick={() => navigate('/cart')}>
                    <RefreshCw size={16} /> Quay lại giỏ hàng
                  </Button>
                  <Button variant="secondary" fullWidth onClick={() => navigate('/books')}>
                    <ShoppingBag size={16} /> Tiếp tục xem sách
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
