import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Copy, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { templateService } from '../../services/template.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Modal from '../../components/common/Modal';

const TemplateListPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      let response;
      if (categoryFilter) {
        response = await templateService.getByCategory(categoryFilter);
      } else {
        response = await templateService.getAll();
      }
      setTemplates(response.data || []);
    } catch (error) {
      toast.error('Không thể tải danh sách mẫu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mẫu này?')) return;
    
    try {
      await templateService.delete(id);
      toast.success('Xóa mẫu thành công');
      fetchTemplates();
    } catch (error) {
      toast.error('Không thể xóa mẫu');
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      await templateService.incrementUsage(template.id);
      navigate('/posts/create', { state: { template } });
    } catch (error) {
      toast.error('Không thể sử dụng mẫu');
    }
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);

  const categories = [...new Set(templates.map(t => t.category).filter(Boolean))];

  if (loading) return <Loading fullScreen />;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Mẫu nội dung' }]} />

      <Card
        title="Mẫu nội dung"
        subtitle={`Tổng ${templates.length} mẫu`}
        actions={
          <Button
            icon={<Plus size={20} />}
            onClick={() => navigate('/templates/create')}
          >
            Tạo mẫu mới
          </Button>
        }
      >
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm mẫu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Không tìm thấy mẫu nào</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {template.thumbnail_url ? (
                    <img
                      src={template.thumbnail_url}
                      alt={template.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <FileText className="text-white" size={48} />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {template.name}
                      </h3>
                      {template.is_public && (
                        <Badge variant="success" size="sm">Public</Badge>
                      )}
                    </div>
                    
                    {template.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {template.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Copy size={14} />
                        {template.usage_count || 0} lượt dùng
                      </span>
                      {template.category && (
                        <Badge variant="default" size="sm">{template.category}</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUseTemplate(template)}
                      >
                        Sử dụng
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye size={16} />}
                        onClick={() => handlePreview(template)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={() => navigate(`/templates/${template.id}/edit`)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDelete(template.id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={selectedTemplate?.name || 'Xem trước mẫu'}
      >
        {selectedTemplate && (
          <div className="space-y-4">
            {selectedTemplate.thumbnail_url && (
              <img
                src={selectedTemplate.thumbnail_url}
                alt={selectedTemplate.name}
                className="w-full rounded-lg"
              />
            )}
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Mô tả:</h4>
              <p className="text-gray-600">{selectedTemplate.description || 'Không có mô tả'}</p>
            </div>
            
            {selectedTemplate.content_template && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Nội dung mẫu:</h4>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {selectedTemplate.content_template}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setShowPreview(false);
                  handleUseTemplate(selectedTemplate);
                }}
              >
                Sử dụng mẫu này
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TemplateListPage;
