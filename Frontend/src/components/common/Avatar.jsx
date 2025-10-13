const Avatar = ({ 
  src, 
  alt = 'Avatar', 
  size = 'md',
  fallback,
  className = '' 
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${sizes[size]} rounded-full overflow-hidden bg-gray-200 ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="font-medium text-gray-600">
          {fallback ? getInitials(fallback) : '?'}
        </span>
      )}
    </div>
  );
};

export default Avatar;
