import { useEffect, useState } from 'react';

const getUserInitial = (name) => name?.charAt(0)?.toUpperCase() || '?';

const Avatar = ({
  name,
  avatarUrl,
  alt,
  className = '',
  style = {},
  imageClassName = '',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  const showImage = Boolean(avatarUrl) && !hasError;

  return (
    <div
      className={`overflow-hidden flex items-center justify-center shrink-0 font-bold ${className}`}
      style={style}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={alt || `${name || 'User'} avatar`}
          className={`w-full h-full object-cover ${imageClassName}`}
          onError={() => setHasError(true)}
        />
      ) : (
        getUserInitial(name)
      )}
    </div>
  );
};

export default Avatar;
