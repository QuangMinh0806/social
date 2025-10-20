import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Eye, Edit, Trash2, Link as LinkIcon, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Loading from '../../components/common/Loading';
import { postService } from '../../services/post.service';

const CalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsByDate, setPostsByDate] = useState({});
  const [todayPosts, setTodayPosts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // Filter state
  const [selectedDate, setSelectedDate] = useState(null); // Selected date for viewing posts
  const [selectedDatePosts, setSelectedDatePosts] = useState([]); // Posts for selected date

  useEffect(() => {
    fetchAllPosts();
  }, [currentDate, statusFilter]);

  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch all posts (not just scheduled)
      const response = await postService.getAll({ skip: 0, limit: 1000 });
      const posts = response.data || [];
      setAllPosts(posts);
      
      // Filter by status if selected
      const filteredPosts = statusFilter === 'all' 
        ? posts 
        : posts.filter(post => post.status === statusFilter);
      
      // Group posts by date
      const grouped = {};
      const today = new Date();
      const todayStr = today.toDateString();
      const todayPostsList = [];
      
      filteredPosts.forEach(post => {
        // Use scheduled_at for scheduled posts, published_at for published, created_at for others
        let postDate;
        if (post.scheduled_at) {
          postDate = new Date(post.scheduled_at);
        } else if (post.published_at) {
          postDate = new Date(post.published_at);
        } else {
          postDate = new Date(post.created_at);
        }
        
        const day = postDate.getDate();
        const month = postDate.getMonth();
        const year = postDate.getFullYear();
        
        // Check if today
        if (postDate.toDateString() === todayStr) {
          todayPostsList.push(post);
        }
        
        // Only show posts in current month
        if (month === currentDate.getMonth() && year === currentDate.getFullYear()) {
          if (!grouped[day]) {
            grouped[day] = [];
          }
          grouped[day].push(post);
        }
      });
      
      setPostsByDate(grouped);
      
      // Sort today's posts by time - MỚI NHẤT LÊN ĐẦU (descending)
      todayPostsList.sort((a, b) => {
        const dateA = new Date(a.scheduled_at || a.published_at || a.created_at);
        const dateB = new Date(b.scheduled_at || b.published_at || b.created_at);
        return dateB - dateA; // Đảo ngược để mới nhất lên đầu
      });
      setTodayPosts(todayPostsList);
      
    } catch (error) {
      console.error('Fetch posts error:', error);
      toast.error('Không thể tải danh sách bài viết');
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
  
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  const formatFullDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };
  
  const getPostTime = (post) => {
    // Return the most relevant time for display
    return post.scheduled_at || post.published_at || post.created_at;
  };
  
  const getStatusBadge = (status) => {
    const badges = {
      'scheduled': { variant: 'warning', label: 'Đã lên lịch' },
      'published': { variant: 'success', label: 'Đã đăng' },
      'publishing': { variant: 'primary', label: 'Đang đăng' },
      'failed': { variant: 'danger', label: 'Thất bại' },
      'draft': { variant: 'default', label: 'Nháp' },
    };
    const badge = badges[status] || badges['draft'];
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };
  
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    
    try {
      await postService.delete(postId);
      toast.success('Đã xóa bài viết');
      fetchAllPosts();
    } catch (error) {
      toast.error('Không thể xóa bài viết');
    }
  };
  
  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-gray-500',
      'scheduled': 'bg-yellow-500',
      'publishing': 'bg-blue-500',
      'published': 'bg-green-500',
      'failed': 'bg-red-500',
      'deleted': 'bg-gray-400',
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    const posts = postsByDate[day] || [];
    
    // Sort posts by time - MỚI NHẤT LÊN ĐẦU (descending)
    const sortedPosts = [...posts].sort((a, b) => {
      const dateA = new Date(getPostTime(a));
      const dateB = new Date(getPostTime(b));
      return dateB - dateA; // Đảo ngược để mới nhất lên đầu
    });
    
    setSelectedDatePosts(sortedPosts);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Lịch đăng' }]} />

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/posts/create')}
          >
            + Lên lịch mới
          </Button>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-0 focus:outline-none focus:ring-0 text-sm font-medium text-gray-700"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">📝 Nháp</option>
              <option value="scheduled">⏰ Đã lên lịch</option>
              <option value="publishing">🔄 Đang đăng</option>
              <option value="published">✅ Đã đăng</option>
              <option value="failed">❌ Thất bại</option>
              <option value="deleted">🗑️ Đã xóa</option>
            </select>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <button
              onClick={previousMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => {}}>
            Tháng
          </Button>
          <Button variant="ghost" onClick={() => {}}>
            Tuần
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Calendar View */}
        <div>
          <Card>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
              </h2>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2 text-sm">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-24 bg-gray-50 rounded-lg"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayPosts = postsByDate[day] || [];
                const today = new Date();
                const isToday = 
                  day === today.getDate() &&
                  currentDate.getMonth() === today.getMonth() &&
                  currentDate.getFullYear() === today.getFullYear();
                
                const isSelected = selectedDate && 
                  day === selectedDate.getDate() &&
                  currentDate.getMonth() === selectedDate.getMonth() &&
                  currentDate.getFullYear() === selectedDate.getFullYear();

                return (
                  <div
                    key={day}
                    onClick={() => dayPosts.length > 0 && handleDayClick(day)}
                    className={`min-h-24 border rounded-lg p-2 transition-all ${
                      dayPosts.length > 0 ? 'cursor-pointer hover:shadow-md' : ''
                    } ${
                      isToday ? 'border-blue-500 bg-blue-50' : 
                      isSelected ? 'border-green-500 bg-green-50 shadow-md' :
                      'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        isToday ? 'text-blue-600' : 
                        isSelected ? 'text-green-600' :
                        'text-gray-700'
                      }`}>
                        {day}
                      </span>
                      {dayPosts.length > 0 && (
                        <div className="flex items-center gap-1">
                          {/* Show status color indicators */}
                          {[...new Set(dayPosts.map(p => p.status))].slice(0, 3).map((status, idx) => (
                            <div 
                              key={idx}
                              className={`w-2 h-2 ${getStatusColor(status)} rounded-full`}
                              title={status}
                            ></div>
                          ))}
                        </div>
                      )}
                    </div>
                    {dayPosts.length > 0 && (
                      <div className="text-xs text-gray-600 font-medium">
                        {dayPosts.length} bài
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Selected Date Posts or Today's Posts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Posts */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                🌟 Bài đăng hôm nay
                {statusFilter !== 'all' && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Lọc: {statusFilter})
                  </span>
                )}
              </h3>
              <span className="text-sm text-gray-500">{todayPosts.length} bài</span>
            </div>
            
            {todayPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon size={48} className="mx-auto mb-2 opacity-20" />
                <p>Không có bài đăng nào hôm nay</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {todayPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors bg-white"
                  >
                    {/* Time */}
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-base font-bold text-gray-900">
                        {formatTime(getPostTime(post))}
                      </span>
                      {post.scheduled_at && <span className="text-xs text-gray-500">(Đã lên lịch)</span>}
                      {post.published_at && !post.scheduled_at && <span className="text-xs text-green-600">(Đã đăng)</span>}
                    </div>

                    {/* Title & Status */}
                    <div className="mb-2">
                      <h4 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm">
                        {post.content.substring(0, 60) + (post.content.length > 60 ? '...' : '')}
                      </h4>
                      {getStatusBadge(post.status)}
                    </div>

                    {/* Pages */}
                    {post.page && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                          <span className="font-medium">{post.page.platform?.name}</span>
                          <span>{post.page.page_name}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={14} />}
                        onClick={() => navigate(`/posts/${post.id}`)}
                      >
                        Xem
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={14} />}
                        onClick={() => navigate(`/posts/${post.id}/edit`)}
                      >
                        Sửa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Selected Date Posts */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedDate ? (
                  <>
                    📅 Ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
                  </>
                ) : (
                  '📅 Chọn ngày để xem'
                )}
                {selectedDate && statusFilter !== 'all' && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Lọc: {statusFilter})
                  </span>
                )}
              </h3>
              {selectedDate && (
                <span className="text-sm text-gray-500">{selectedDatePosts.length} bài</span>
              )}
            </div>
            
            {!selectedDate ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon size={48} className="mx-auto mb-2 opacity-20" />
                <p>Click vào ngày trên lịch để xem bài đăng</p>
              </div>
            ) : selectedDatePosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon size={48} className="mx-auto mb-2 opacity-20" />
                <p>Không có bài đăng nào trong ngày này</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {selectedDatePosts.map((post) => (
                  <div 
                    key={post.id} 
                    className="border border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors bg-white"
                  >
                    {/* Time */}
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-base font-bold text-gray-900">
                        {formatTime(getPostTime(post))}
                      </span>
                      {post.scheduled_at && <span className="text-xs text-gray-500">(Đã lên lịch)</span>}
                      {post.published_at && !post.scheduled_at && <span className="text-xs text-green-600">(Đã đăng)</span>}
                    </div>

                    {/* Title & Status */}
                    <div className="mb-2">
                      <h4 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm">
                        {post.content.substring(0, 60) + (post.content.length > 60 ? '...' : '')}
                      </h4>
                      {getStatusBadge(post.status)}
                    </div>

                    {/* Pages */}
                    {post.page && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                          <span className="font-medium">{post.page.platform?.name}</span>
                          <span>{post.page.page_name}</span>
                        </div>
                      </div>
                    )}

                    {/* Published Links */}
                    {post.status === 'published' && post.platform_post_url && (
                      <div className="mb-2 p-2 bg-green-50 rounded border border-green-200">
                        <a 
                          href={post.platform_post_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <LinkIcon size={12} />
                          Xem bài đăng
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={14} />}
                        onClick={() => navigate(`/posts/${post.id}`)}
                      >
                        Xem
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={14} />}
                        onClick={() => navigate(`/posts/${post.id}/edit`)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
