import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import Button from './common/Button';
import toast from 'react-hot-toast';

// TikTok OAuth cần HTTPS, dùng ngrok URL riêng cho testing
const TIKTOK_API_URL = 'https://8a7c47cd4eed.ngrok-free.app';

const ConnectWithTiktok = () => {
    const [loading, setLoading] = useState(false);

    const handleTiktokLogin = async () => {
        try {
            setLoading(true);
            
            // Call backend để lấy auth URL (dùng ngrok URL)
            // Thêm header ngrok-skip-browser-warning để bypass ngrok warning page
            const response = await fetch(`${TIKTOK_API_URL}/tiktok/login`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            
            const data = await response.json();

            if (data.auth_url) {
                // Redirect user đến TikTok OAuth
                window.location.href = data.auth_url;
            } else {
                toast.error('Không thể kết nối với TikTok');
            }
        } catch (error) {
            console.error('TikTok login error:', error);
            toast.error('Có lỗi xảy ra khi kết nối TikTok');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            icon={<MessageCircle size={20} />}
            onClick={handleTiktokLogin}
            disabled={loading}
            className="border-black text-black hover:bg-black hover:text-white"
        >
            {loading ? 'Đang kết nối...' : 'Kết nối TikTok'}
        </Button>
    );
};

export default ConnectWithTiktok;
