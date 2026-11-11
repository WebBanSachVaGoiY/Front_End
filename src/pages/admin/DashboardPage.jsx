import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Package, Users, BookOpen, Activity, AlertCircle, RefreshCw, Sparkles, CheckCircle2, BarChart3, Play } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { adminApi } from '../../api/adminApi';
import { orderApi } from '../../api/orderApi';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/formatDate';
import { PageSpinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import './AdminDashboard.css';

export default function DashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalBooks: 0,
  });
  const [revenueData, setRevenueData] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [training, setTraining] = useState(false);
  const [isRecSysModalOpen, setIsRecSysModalOpen] = useState(false);
  const [trainType, setTrainType] = useState('all');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [trainResult, setTrainResult] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, ordersData, revenueChart, bestSellersData] = await Promise.all([
        adminApi.getStats(),
        orderApi.getAllOrders({ size: 5 }),
        adminApi.getRevenueChart(),
        adminApi.getBestSellers(5),
      ]);

      if (statsData) {
        setStats({
          totalRevenue: Number(statsData.totalRevenue) || 0,
          totalOrders: Number(statsData.totalOrders) || 0,
          totalUsers: Number(statsData.totalUsers) || 0,
          totalBooks: Number(statsData.totalBooks) || 0,
        });
      }

      setRecentOrders(ordersData?.content || (Array.isArray(ordersData) ? ordersData : []));
      setRevenueData(Array.isArray(revenueChart) ? revenueChart : []);
      setBestSellers(Array.isArray(bestSellersData) ? bestSellersData : []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Admin Dashboard:', err);
      const msg = err.response?.data?.message || err.message || 'Không thể tải số liệu thống kê từ máy chủ.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTrainRecommendations = async () => {
    setTraining(true);
    try {
      const res = await adminApi.trainRecommendations(trainType);
      setTrainResult(res);
      toast.success(`Đã huấn luyện mô hình (${trainType}) thành công!`);
      handleEvaluate();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Không thể huấn luyện mô hình gợi ý. Kiểm tra RecSys service (FastAPI) đã chạy chưa.'
      );
    } finally {
      setTraining(false);
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await adminApi.evaluateRecommendations(10);
      setEvaluationResult(res);
    } catch (err) {
      console.error('Không thể đánh giá mô hình:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const STAT_CARDS = [
    {
      label: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue),
      icon: <TrendingUp size={24} />,
      color: '#6C3DD3',
      subtitle: 'Đơn giao thành công',
    },
    {
      label: 'Tổng đơn hàng',
      value: formatNumber(stats.totalOrders),
      icon: <Package size={24} />,
      color: '#3B82F6',
      subtitle: 'Toàn hệ thống',
    },
    {
      label: 'Người dùng',
      value: formatNumber(stats.totalUsers),
      icon: <Users size={24} />,
      color: '#10B981',
      subtitle: 'Tài khoản đăng ký',
    },
    {
      label: 'Đầu sách',
      value: formatNumber(stats.totalBooks),
      icon: <BookOpen size={24} />,
      color: '#F59E0B',
      subtitle: 'Đang mở bán',
    },
  ];

  if (loading) return <PageSpinner />;

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Thống kê số liệu thực tế hệ thống BookRunner</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setIsRecSysModalOpen(true);
              if (!evaluationResult) handleEvaluate();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} />
            Quản lý Gợi ý (RecSys)
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={fetchDashboardData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            borderLeft: '4px solid var(--error)',
            background: 'rgba(239, 68, 68, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--error)' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={fetchDashboardData}>
            Thử lại
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="stat-cards">
        {STAT_CARDS.map((card, i) => (
          <div key={i} className="stat-card card animate-fadeInUp" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stat-card-icon" style={{ background: `${card.color}20`, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-card-info">
              <div className="stat-card-label">{card.label}</div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-change" style={{ color: 'var(--text-muted)' }}>
                <Activity size={12} />
                {card.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        {/* Revenue chart */}
        <div className="chart-card card animate-fadeInUp">
          <h3 className="chart-title">Doanh thu 12 tháng</h3>
          {revenueData.length === 0 ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Chưa có dữ liệu doanh thu
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#7C6FA0', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#7C6FA0', fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(v) => [formatCurrency(v), 'Doanh thu']}
                  contentStyle={{
                    background: '#1A1035', border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: '10px', color: '#F8F4FF',
                  }}
                />
                <Line
                  type="monotone" dataKey="revenue"
                  stroke="#8B5CF6" strokeWidth={2.5}
                  dot={{ fill: '#8B5CF6', r: 4 }}
                  activeDot={{ r: 6, fill: '#F59E0B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Best sellers chart */}
        <div className="chart-card card animate-fadeInUp">
          <h3 className="chart-title">Top sách bán chạy nhất</h3>
          {bestSellers.length === 0 ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Chưa có dữ liệu sách bán chạy
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bestSellers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#7C6FA0', fontSize: 11 }} />
                <YAxis
                  type="category" dataKey="title" width={130}
                  tick={{ fill: '#B4A8D0', fontSize: 11 }}
                />
                <Tooltip
                  formatter={(v) => [v, 'Đã bán']}
                  contentStyle={{
                    background: '#1A1035', border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: '10px', color: '#F8F4FF',
                  }}
                />
                <Bar dataKey="sold" fill="#6C3DD3" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card animate-fadeInUp">
        <div className="table-header">
          <h3>Đơn hàng mới nhất</h3>
        </div>
        {recentOrders.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có đơn hàng nào trong hệ thống
          </p>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-code-cell">#{order.orderCode}</td>
                    <td>{order.recipientName}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td className="amount-cell">{formatCurrency(order.finalAmount)}</td>
                    <td><OrderStatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RecSys Management Modal */}
      <Modal
        isOpen={isRecSysModalOpen}
        onClose={() => setIsRecSysModalOpen(false)}
        title="Quản lý & Đánh giá Hệ thống Gợi ý (RecSys)"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Huấn luyện mô hình */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={16} color="var(--primary, #6C3DD3)" />
              Huấn luyện Mô hình Khuyến nghị
            </h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-muted, #64748b)' }}>
              Chọn thuật toán cần cập nhật. Hệ thống sẽ tự động làm tươi bộ đệm Redis sau khi hoàn tất.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { id: 'all', label: 'Toàn bộ Pipeline (Khuyên dùng)', desc: 'Chạy CBF, Co-Purchase rồi ALS' },
                { id: 'content-based', label: 'Sách tương tự (CBF)', desc: 'TF-IDF & Cosine Similarity' },
                { id: 'co-purchase', label: 'Thường mua cùng (FBT)', desc: 'Khai phá giỏ hàng order_items' },
                { id: 'collaborative', label: 'Cá nhân hóa (ALS)', desc: 'Implicit Feedback & Time-Decay' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: `1.5px solid ${trainType === opt.id ? 'var(--primary, #6C3DD3)' : 'var(--border-color, #cbd5e1)'}`,
                    background: trainType === opt.id ? 'rgba(108, 61, 211, 0.05)' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.875rem' }}>
                    <input
                      type="radio"
                      name="trainType"
                      value={opt.id}
                      checked={trainType === opt.id}
                      onChange={() => setTrainType(opt.id)}
                    />
                    {opt.label}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', marginLeft: '22px' }}>
                    {opt.desc}
                  </span>
                </label>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleTrainRecommendations}
              disabled={training}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px', justifyContent: 'center' }}
            >
              <Sparkles size={16} />
              {training ? 'Đang huấn luyện (có thể mất 15-30 giây)...' : `Bắt đầu Huấn luyện (${trainType.toUpperCase()})`}
            </button>
          </div>

          {/* Section 2: Đo lường chất lượng mô hình (§11 Evaluation Metrics) */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={16} color="var(--primary, #6C3DD3)" />
                Chỉ số Đo lường Hiệu năng Mô hình (§11 Spec)
              </h4>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleEvaluate}
                disabled={evaluating}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={12} className={evaluating ? 'animate-spin' : ''} />
                {evaluating ? 'Đang đo...' : 'Đo lường lại'}
              </button>
            </div>

            {evaluationResult?.metrics ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: '#fff', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Precision@10</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>
                      {((evaluationResult.metrics['precision_at_10'] || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: '#fff', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Recall@10</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3B82F6', marginTop: '4px' }}>
                      {((evaluationResult.metrics['recall_at_10'] || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: '#fff', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NDCG@10</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#8B5CF6', marginTop: '4px' }}>
                      {(evaluationResult.metrics['ndcg_at_10'] || 0).toFixed(3)}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: '#fff', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Catalog Coverage</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F59E0B', marginTop: '4px' }}>
                      {evaluationResult.metrics['catalog_coverage_pct'] || 0}%
                    </div>
                  </div>
                </div>
                {evaluationResult.summary && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                    💡 {evaluationResult.summary}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #64748b)' }}>
                {evaluating ? 'Đang tính toán các chỉ số Precision, Recall và Coverage...' : 'Chưa có dữ liệu đánh giá. Nhấn "Đo lường lại" để kiểm tra chất lượng mô hình hiện tại.'}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
