import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Textarea from '../../components/common/Textarea';
import Breadcrumb from '../../components/layout/Breadcrumb';

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Xin chào! Tôi là trợ lý AI. Tôi có thể giúp bạn tạo nội dung bài viết, đề xuất hashtag, hoặc tối ưu hóa thời gian đăng bài. Bạn cần tôi hỗ trợ điều gì?',
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      time: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Đây là phản hồi mẫu từ AI. Trong thực tế, đây sẽ là kết quả từ GPT-4 hoặc các mô hình AI khác để tạo nội dung, đề xuất hashtag, hoặc tối ưu hóa chiến lược đăng bài của bạn.',
        time: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 1000);
  };

  const suggestions = [
    'Tạo nội dung về sản phẩm mới',
    'Đề xuất hashtag trending',
    'Phân tích thời gian đăng bài tốt nhất',
    'Viết caption hấp dẫn',
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'AI Trợ lý' }]} />

      <Card title="AI Trợ lý sáng tạo nội dung" subtitle="Được hỗ trợ bởi GPT-4">
        <div className="flex flex-col h-[500px] sm:h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-3 sm:mb-4 space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${message.type === 'bot' ? 'bg-blue-100' : 'bg-gray-200'
                  }`}>
                  {message.type === 'bot' ? (
                    <Bot size={16} className="text-blue-600 sm:w-5 sm:h-5" />
                  ) : (
                    <User size={16} className="text-gray-600 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div
                  className={`flex-1 max-w-full sm:max-w-2xl px-3 py-2 sm:px-4 sm:py-3 rounded-lg ${message.type === 'bot'
                    ? 'bg-white border border-gray-200'
                    : 'bg-blue-600 text-white'
                    }`}
                >
                  <p className="text-xs sm:text-sm break-words">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.type === 'bot' ? 'text-gray-500' : 'text-blue-100'
                    }`}>
                    {message.time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot size={16} className="text-blue-600 sm:w-5 sm:h-5" />
                </div>
                <div className="bg-white border border-gray-200 px-3 py-2 sm:px-4 sm:py-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="mb-3 sm:mb-4">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="px-2.5 py-1.5 sm:px-3 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors whitespace-nowrap"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
              rows={2}
              className="flex-1 text-sm sm:text-base"
            />
            <Button
              icon={<Send size={18} className="sm:w-5 sm:h-5" />}
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-full sm:w-auto sm:self-end"
            >
              <span className="sm:inline">Gửi</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistantPage;