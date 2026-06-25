import { Bot, User } from 'lucide-react';

interface AvatarProps {
  sender: 'user' | 'ai';
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ sender, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-[30px] h-[30px]',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 18,
  };

  return (
    <div className={`message-avatar ${sender} ${sizeClasses[size]}`}>
      {sender === 'user' ? (
        <User size={iconSizes[size]} />
      ) : (
        <Bot size={iconSizes[size]} />
      )}
    </div>
  );
};
