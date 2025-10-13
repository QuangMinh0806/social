import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText, Calendar } from 'lucide-react';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedToday: 0,
    scheduledPosts: 0,
    totalPages: 0,
  });

  const chartData = [
    { name: 'T2', posts: 12, engagement: 2400 },
    { name: 'T3', posts: 19, engagement: 1398 },
    { name: 'T4', posts: 15, engagement: 9800 },
    { name: 'T5', posts: 25, engagement: 3908 },
    { name: 'T6', posts: 18, engagement: 4800 },
    { name: 'T7', posts: 22, engagement: 3800 },
    { name: 'CN', posts: 30, engagement: 4300 },
  ];

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalPosts: 1234,
        publishedToday: 45,
        scheduledPosts: 89,
        totalPages: 23,
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return <Loading fullScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Tổng quan hệ thống quản lý đăng bài</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng bài viết</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPosts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đăng hôm nay</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.publishedToday}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã lên lịch</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.scheduledPosts}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calendar className="text-yellow-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Trang/Nhóm</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPages}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Bài viết theo ngày" subtitle="7 ngày gần nhất">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="posts" fill="#3b82f6" name="Số bài viết" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Tương tác" subtitle="7 ngày gần nhất">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={2} name="Tương tác" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Hoạt động gần đây">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Bài viết mới được tạo</p>
                <p className="text-xs text-gray-500">{i} phút trước</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
