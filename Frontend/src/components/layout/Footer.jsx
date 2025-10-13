const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>© {currentYear} Social Auto Post. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-blue-600 transition-colors">Trợ giúp</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Liên hệ</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Chính sách</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
