import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import { mediaService } from '../../services/media.service';

const UploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const acceptedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo']
  };

  const allAcceptedTypes = [...acceptedTypes.image, ...acceptedTypes.video];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const validateFile = (file) => {
    if (!allAcceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Định dạng file không được hỗ trợ'
      };
    }

    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File quá lớn (tối đa ${maxFileSize / (1024 * 1024)}MB)`
      };
    }

    return { valid: true };
  };

  const getFileIcon = (type) => {
    if (acceptedTypes.image.includes(type)) {
      return <ImageIcon className="text-blue-500" size={24} />;
    } else if (acceptedTypes.video.includes(type)) {
      return <Video className="text-purple-500" size={24} />;
    }
    return <FileText className="text-gray-500" size={24} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    const validatedFiles = newFiles.map((file) => {
      const validation = validateFile(file);
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: URL.createObjectURL(file),
        status: validation.valid ? 'pending' : 'error',
        error: validation.error
      };
    });

    setFiles((prev) => [...prev, ...validatedFiles]);
  };

  const removeFile = (id) => {
    setFiles((prev) => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      toast.error('Không có file nào để upload');
      return;
    }

    setUploading(true);

    let successCount = 0;
    let errorCount = 0;

    try {
      // Upload từng file một
      for (const fileObj of pendingFiles) {
        try {
          setUploadProgress(prev => ({ ...prev, [fileObj.id]: 0 }));

          const formData = new FormData();
          formData.append('file', fileObj.file);
          formData.append('user_id', '1'); // TODO: Lấy từ auth context

          // Upload file
          await mediaService.upload(formData);

          // Update status
          setFiles(prev =>
            prev.map(f =>
              f.id === fileObj.id
                ? { ...f, status: 'success' }
                : f
            )
          );

          setUploadProgress(prev => ({ ...prev, [fileObj.id]: 100 }));
          successCount++;

        } catch (error) {
          console.error('Upload error:', error);
          setFiles(prev =>
            prev.map(f =>
              f.id === fileObj.id
                ? { ...f, status: 'error', error: error.response?.data?.detail || 'Upload thất bại' }
                : f
            )
          );
          errorCount++;
        }
      }

      // Hiển thị kết quả
      if (successCount > 0) {
        toast.success(`Upload thành công ${successCount} file`);
        // Gọi callback để reload danh sách
        if (onUploadComplete) {
          onUploadComplete();
        }
      }

      if (errorCount > 0) {
        toast.error(`Upload thất bại ${errorCount} file`);
      }

      // Đóng modal nếu tất cả thành công
      if (errorCount === 0 && successCount > 0) {
        setTimeout(() => {
          handleClose();
        }, 1000);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Có lỗi xảy ra khi upload');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Cleanup preview URLs
    files.forEach(f => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setFiles([]);
    setUploadProgress({});
    onClose();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Media"
      size="large"
    >
      <div className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
            ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-blue-400'}
          `}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">
            Kéo thả file vào đây hoặc
          </p>
          <Button variant="primary" type="button" disabled={uploading}>
            Chọn file
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Hỗ trợ: JPG, PNG, GIF, WebP, MP4, MOV, AVI (tối đa 50MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allAcceptedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="font-medium text-gray-900">
              Danh sách file ({files.length})
            </h3>
            {files.map((fileObj) => (
              <div
                key={fileObj.id}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
              >
                {/* Preview */}
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {acceptedTypes.image.includes(fileObj.file.type) ? (
                    <img
                      src={fileObj.preview}
                      alt={fileObj.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getFileIcon(fileObj.file.type)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {fileObj.file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(fileObj.file.size)}
                  </p>
                  {fileObj.error && (
                    <p className="text-sm text-red-500 mt-1">
                      {fileObj.error}
                    </p>
                  )}
                  {/* Progress bar */}
                  {uploading && fileObj.status === 'pending' && uploadProgress[fileObj.id] !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress[fileObj.id]}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {getStatusIcon(fileObj.status)}
                  {!uploading && fileObj.status === 'pending' && (
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Xóa"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleUpload}
            disabled={uploading || files.filter(f => f.status === 'pending').length === 0}
          >
            {uploading ? 'Đang upload...' : `Upload ${files.filter(f => f.status === 'pending').length} file`}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            {uploading ? 'Đang xử lý...' : 'Đóng'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;
