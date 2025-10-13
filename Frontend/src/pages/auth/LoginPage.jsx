import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../services/user.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const response = await userService.login(formData);
      
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Đăng nhập thành công');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Tên đăng nhập hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Tên đăng nhập"
        type="text"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        placeholder="Nhập tên đăng nhập"
        required
      />

      <Input
        label="Mật khẩu"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Nhập mật khẩu"
        required
      />

      <Button
        type="submit"
        className="w-full"
        icon={<LogIn size={20} />}
        loading={loading}
      >
        Đăng nhập
      </Button>

      <div className="text-center">
        <a href="#" className="text-sm text-blue-600 hover:underline">
          Quên mật khẩu?
        </a>
      </div>
    </form>
  );
};

export default LoginPage;
