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
        <div className="flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'bot' ? 'bg-blue-100' : 'bg-gray-200'
                }`}>
                  {message.type === 'bot' ? (
                    <Bot size={20} className="text-blue-600" />
                  ) : (
                    <User size={20} className="text-gray-600" />
                  )}
                </div>
                <div
                  className={`flex-1 max-w-2xl px-4 py-3 rounded-lg ${
                    message.type === 'bot'
                      ? 'bg-white border border-gray-200'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'bot' ? 'text-gray-500' : 'text-blue-100'
                  }`}>
                    {message.time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot size={20} className="text-blue-600" />
                </div>
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex gap-2 mb-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
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
              rows={3}
              className="flex-1"
            />
            <Button
              icon={<Send size={20} />}
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="self-end"
            >
              Gửi
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistantPage;
