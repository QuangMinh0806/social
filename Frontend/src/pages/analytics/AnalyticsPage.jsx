import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Select from '../../components/common/Select';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Loading from '../../components/common/Loading';
import { analyticsService } from '../../services/analytics.service';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [topPosts, setTopPosts] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getDashboardStats();
      setDashboardData(response.data);

      const topPostsResponse = await analyticsService.getTopPosts(10);
      setTopPosts(topPostsResponse.data);
    } catch (error) {
      console.error('Analytics error:', error);
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const engagementData = [
    { name: 'T2', views: 4000, likes: 2400, comments: 400, shares: 240 },
    { name: 'T3', views: 3000, likes: 1398, comments: 210, shares: 180 },
    { name: 'T4', views: 2000, likes: 9800, comments: 290, shares: 390 },
    { name: 'T5', views: 2780, likes: 3908, comments: 200, shares: 300 },
    { name: 'T6', views: 1890, likes: 4800, comments: 181, shares: 250 },
    { name: 'T7', views: 2390, likes: 3800, comments: 250, shares: 210 },
    { name: 'CN', views: 3490, likes: 4300, comments: 210, shares: 340 },
  ];

  const platformData = [
    { name: 'Facebook', value: 400, color: '#3b5998' },
    { name: 'Instagram', value: 300, color: '#E1306C' },
    { name: 'Twitter', value: 200, color: '#1DA1F2' },
    { name: 'LinkedIn', value: 100, color: '#0077b5' },
  ];

  const stats = dashboardData ? [
    {
      label: 'Tổng lượt xem',
      value: formatNumber(dashboardData.total_views),
      change: '+12.5%',
      trend: 'up',
      icon: Eye,
      color: 'blue'
    },
    {
      label: 'Lượt thích',
      value: formatNumber(dashboardData.total_likes),
      change: '+8.2%',
      trend: 'up',
      icon: Heart,
      color: 'red'
    },
    {
      label: 'Bình luận',
      value: formatNumber(dashboardData.total_comments),
      change: '-2.4%',
      trend: 'down',
      icon: MessageCircle,
      color: 'green'
    },
    {
      label: 'Chia sẻ',
      value: formatNumber(dashboardData.total_shares),
      change: '+15.3%',
      trend: 'up',
      icon: Share2,
      color: 'purple'
    },
  ] : [];

  if (loading) return <Loading fullScreen />;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Thống kê & Phân tích' }]} />

      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Thống kê & Phân tích</h1>
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          options={[
            { value: '7days', label: '7 ngày qua' },
            { value: '30days', label: '30 ngày qua' },
            { value: '90days', label: '90 ngày qua' },
            { value: 'year', label: 'Năm nay' },
          ]}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;

          return (
            <Card key={index} className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-xs sm:text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    <TrendIcon size={14} className="sm:w-4 sm:h-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`p-2 sm:p-3 bg-${stat.color}-100 rounded-full flex-shrink-0`}>
                  <Icon className={`text-${stat.color}-600 w-5 h-5 sm:w-6 sm:h-6`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Pie Chart */}
        <Card title="Phân bố nền tảng" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                className="sm:outerRadius-[80]"
                fill="#8884d8"
                dataKey="value"
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Line Chart */}
        <Card title="Tương tác theo ngày" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} name="Lượt thích" />
              <Line type="monotone" dataKey="comments" stroke="#10b981" strokeWidth={2} name="Bình luận" />
              <Line type="monotone" dataKey="shares" stroke="#8b5cf6" strokeWidth={2} name="Chia sẻ" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card title="Lượt xem theo ngày">
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <BarChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="views" fill="#3b82f6" name="Lượt xem" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default AnalyticsPage;