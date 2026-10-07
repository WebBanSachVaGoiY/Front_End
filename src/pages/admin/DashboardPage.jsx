import { useEffect, useState } from 'react';
import { TrendingUp, Package, Users, BookOpen, ArrowUp } from 'lucide-react';
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

// Mock data for demo (will be replaced by real API)
const MOCK_REVENUE = [
  { month: 'T1', revenue: 12000000 }, { month: 'T2', revenue: 19000000 },
  { month: 'T3', revenue: 15000000 }, { month: 'T4', revenue: 25000000 },
  { month: 'T5', revenue: 22000000 }, { month: 'T6', revenue: 30000000 },
  { month: 'T7', revenue: 28000000 }, { month: 'T8', revenue: 35000000 },
  { month: 'T9', revenue: 32000000 },
];

const MOCK_BESTSELLERS = [
  { title: 'Đắc Nhân Tâm', sold: 145 }, { title: 'Nhà Giả Kim', sold: 132 },
  { title: 'Tư Duy Phản Biện', sold: 98 }, { title: 'Sapiens', sold: 87 },
  { title: 'Atomic Habits', sold: 76 },
];

const MOCK_STATS = {
  totalRevenue: 218000000,
  totalOrders: 1247,
  totalUsers: 5382,
  totalBooks: 843,
};

export default function DashboardPage() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [revenueData, setRevenueData] = useState(MOCK_REVENUE);
  const [bestSellers, setBestSellers] = useState(MOCK_BESTSELLERS);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsData, ordersData, revenueChart, bestSellersData] = await Promise.all([
          adminApi.getStats().catch(() => MOCK_STATS),
          orderApi.getAllOrders({ size: 5 }).catch(() => ({ content: [] })),
          adminApi.getRevenueChart().catch(() => MOCK_REVENUE),
          adminApi.getBestSellers().catch(() => MOCK_BESTSELLERS),
        ]);
        setStats(statsData || MOCK_STATS);
        setRecentOrders(ordersData.content || ordersData || []);
        if (Array.isArray(revenueChart) && revenueChart.length > 0) {
          setRevenueData(revenueChart);
        }
        if (Array.isArray(bestSellersData) && bestSellersData.length > 0) {
          setBestSellers(bestSellersData);
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const STAT_CARDS = [
    {
      label: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue),
      icon: <TrendingUp size={24} />,
      color: '#6C3DD3',
      change: '+12.5%',
    },
    {
      label: 'Tổng đơn hàng',
      value: formatNumber(stats.totalOrders),
      icon: <Package size={24} />,
      color: '#3B82F6',
      change: '+8.3%',
    },
    {
      label: 'Người dùng',
      value: formatNumber(stats.totalUsers),
      icon: <Users size={24} />,
      color: '#10B981',
      change: '+5.1%',
    },
    {
      label: 'Đầu sách',
      value: formatNumber(stats.totalBooks),
      icon: <BookOpen size={24} />,
      color: '#F59E0B',
      change: '+2.8%',
    },
  ];

  if (loading) return <PageSpinner />;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Tổng quan hệ thống BookRunner</p>
      </div>

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
              <div className="stat-card-change">
                <ArrowUp size={12} />
                {card.change} so với tháng trước
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        {/* Revenue chart */}
        <div className="chart-card card animate-fadeInUp">
          <h3 className="chart-title">Doanh thu theo tháng</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
              <XAxis dataKey="month" tick={{ fill: '#7C6FA0', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#7C6FA0', fontSize: 11 }}
                tickFormatter={(v) => `${v / 1000000}M`}
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
        </div>

        {/* Best sellers chart */}
        <div className="chart-card card animate-fadeInUp">
          <h3 className="chart-title">Sách bán chạy</h3>
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
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card animate-fadeInUp">
        <div className="table-header">
          <h3>Đơn hàng gần đây</h3>
        </div>
        {recentOrders.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có đơn hàng
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
