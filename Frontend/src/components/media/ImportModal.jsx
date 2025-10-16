import { useState } from 'react';
import { X, Download } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Select from '../common/Select';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Checkbox from '../common/Checkbox';
import toast from 'react-hot-toast';
import { mediaService } from '../../services/media.service';

const ImportModal = ({ isOpen, onClose, onImportComplete }) => {
    const [formData, setFormData] = useState({
        platform: '',
        urls: '',
        autoRemoveWatermark: true,
        useProxy: false
    });
    const [loading, setLoading] = useState(false);
    const [importCompleted, setImportCompleted] = useState(false);

    const platformOptions = [
        { value: 'tiktok', label: 'TikTok' },
        // Tạm thời chỉ hỗ trợ TikTok
        { value: 'youtube', label: 'YouTube' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'douyin', label: 'Douyin' },
        { value: 'other', label: 'Khác' }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.platform) {
            toast.error('Vui lòng chọn platform');
            return;
        }

        if (!formData.urls.trim()) {
            toast.error('Vui lòng nhập URL');
            return;
        }

        setLoading(true);
        try {
            // Parse URLs - split by line and filter empty lines
            const urlList = formData.urls
                .split('\n')
                .map(url => url.trim())
                .filter(url => url.length > 0);

            if (urlList.length === 0) {
                toast.error('Vui lòng nhập ít nhất một URL hợp lệ');
                return;
            }

            if (urlList.length > 10) {
                toast.error('Tối đa 10 URL mỗi lần import');
                return;
            }

            // Call API to import videos
            const response = await mediaService.importFromUrl({
                urls: urlList,
                platform: formData.platform,
                user_id: 1,
                auto_remove_watermark: formData.autoRemoveWatermark,
                use_proxy: formData.useProxy
            });

            // Show results
            if (response.data) {
                const { imported, failed, errors } = response.data;

                if (imported > 0) {
                    toast.success(`Import thành công ${imported} video!`);
                }

                if (failed > 0) {
                    toast.error(`${failed} video không thể import`);
                    console.error('Import errors:', errors);
                }

                // Đóng modal và reset form sau khi import hoàn thành (dù có lỗi hay không)
                if (imported > 0) {
                    onImportComplete();
                }

                // Đánh dấu import đã hoàn thành
                setImportCompleted(true);

                // Tắt modal ngay sau khi import xong
                setTimeout(() => {
                    onClose();
                    resetForm();
                    setImportCompleted(false);
                }, 1000); // Delay 1 giây để user có thể thấy thông báo
            }
        } catch (error) {
            console.error('Import error:', error);
            const errorMessage = error.response?.data?.detail || 'Không thể import video';
            toast.error(errorMessage);

            // Tắt modal sau 2 giây nếu có lỗi
            setTimeout(() => {
                onClose();
                resetForm();
                setImportCompleted(false);
            }, 2000);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            platform: '',
            urls: '',
            autoRemoveWatermark: true,
            useProxy: false
        });
        setImportCompleted(false);
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Video từ URL"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Platform Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Platform nguồn <span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={formData.platform}
                        onChange={(e) => handleInputChange('platform', e.target.value)}
                        options={platformOptions}
                        placeholder="Chọn platform..."
                        required
                    />
                </div>

                {/* URL Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL hoặc danh sách URL <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                        value={formData.urls}
                        onChange={(e) => handleInputChange('urls', e.target.value)}
                        placeholder="Nhập URL video, mỗi URL một dòng:&#10;https://www.tiktok.com/@user/video/123&#10;https://youtube.com/watch?v=abc&#10;https://douyin.com/video/xyz"
                        rows={6}
                        required
                        className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Hỗ trợ import hàng loạt, mỗi URL một dòng
                    </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Checkbox
                            id="autoRemoveWatermark"
                            checked={formData.autoRemoveWatermark}
                            onChange={(e) => handleInputChange('autoRemoveWatermark', e.target.checked)}
                        />
                        <label htmlFor="autoRemoveWatermark" className="ml-2 text-sm text-gray-700">
                            Tự động xóa watermark
                        </label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="useProxy"
                            checked={formData.useProxy}
                            onChange={(e) => handleInputChange('useProxy', e.target.checked)}
                        />
                        <label htmlFor="useProxy" className="ml-2 text-sm text-gray-700">
                            Sử dụng proxy
                        </label>
                    </div>
                </div>

                {/* Features List */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Tính năng Import:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Tự động tải video chất lượng cao nhất</li>
                        <li>• Xóa watermark tự động (nếu được chọn)</li>
                        <li>• Lấy metadata: tiêu đề, mô tả, hashtag</li>
                        <li>• Hỗ trợ proxy để bypass geo-blocking</li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        icon={<Download size={20} />}
                        loading={loading}
                        disabled={loading || importCompleted}
                    >
                        {importCompleted ? 'Import hoàn thành!' : loading ? 'Đang Import...' : 'Bắt đầu Import'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ImportModal;