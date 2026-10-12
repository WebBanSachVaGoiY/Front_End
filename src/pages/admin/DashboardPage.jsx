import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Package, Users, BookOpen, Activity, AlertCircle, RefreshCw } from 'lucide-react';
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
import './AdminDashboard.css';

export default function DashboardPage() {
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
        <button
          className="btn btn-outline btn-sm"
          onClick={fetchDashboardData}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          Làm mới
        </button>
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
    </div>
  );
}
