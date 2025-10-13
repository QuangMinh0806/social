import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Loading from '../../components/common/Loading';
import { postService } from '../../services/post.service';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsByDate, setPostsByDate] = useState({});

  useEffect(() => {
    fetchScheduledPosts();
  }, [currentDate]);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getScheduled({ skip: 0, limit: 1000 });
      setPosts(response.data);
      
      // Group posts by date
      const grouped = {};
      response.data.forEach(post => {
        if (post.scheduled_at) {
          const postDate = new Date(post.scheduled_at);
          const day = postDate.getDate();
          const month = postDate.getMonth();
          const year = postDate.getFullYear();
          
          // Only show posts in current month
          if (month === currentDate.getMonth() && year === currentDate.getFullYear()) {
            if (!grouped[day]) {
              grouped[day] = [];
            }
            grouped[day].push({
              id: post.id,
              title: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
              time: postDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              fullDate: postDate
            });
          }
        }
      });
      
      setPostsByDate(grouped);
    } catch (error) {
      console.error('Fetch posts error:', error);
      toast.error('Không thể tải lịch đăng bài');
    } finally {
      setLoading(false);
    }
  };
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Lịch đăng bài' }]} />

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-700 py-2">
              {day}
            </div>
          ))}
          
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-24 bg-gray-50 rounded-lg"></div>
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const posts = postsByDate[day] || [];
            const isToday = 
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();
            
            return (
              <div
                key={day}
                className={`min-h-24 border rounded-lg p-2 hover:bg-gray-50 transition-colors ${
                  isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {posts.length > 0 && (
                    <Badge variant="primary" size="sm">{posts.length}</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="text-xs bg-blue-100 text-blue-800 p-1 rounded cursor-pointer hover:bg-blue-200"
                      title={post.title}
                    >
                      {post.time} - {post.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default CalendarPage;
