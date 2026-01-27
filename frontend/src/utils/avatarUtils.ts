// 生成默认头像URL（基于用户名首字母的占位图）
export const getDefaultAvatarUrl = (username: string): string => {
  const firstLetter = username ? username.charAt(0).toUpperCase() : 'U';
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#FFC107', '#FF9800', '#FF5722', '#795548'
  ];
  
  // 基于用户名生成一致的颜色索引
  const colorIndex = username
    ? username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <rect width="40" height="40" fill="${colors[colorIndex]}"/>
      <text x="20" y="28" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">
        ${firstLetter}
      </text>
    </svg>
  `)}`;
};

// 获取用户头像URL（优先使用用户自定义头像，没有则返回默认头像）
export const getUserAvatarUrl = (avatar?: string, username?: string): string => {
  return avatar ? avatar : getDefaultAvatarUrl(username || '');
};

// 获取头像缩略图URL（如果存储服务支持缩略图功能，可以在这里实现）
export const getThumbnailUrl = (avatarUrl?: string, username?: string): string => {
  // 目前直接返回头像URL，未来可以根据存储服务调整为缩略图URL
  return getUserAvatarUrl(avatarUrl, username);
};