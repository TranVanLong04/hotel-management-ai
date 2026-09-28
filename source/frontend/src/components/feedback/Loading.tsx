import { Loader2 } from 'lucide-react';

type LoadingSize = 'sm' | 'md' | 'lg';

interface LoadingProps {
  fullScreen?: boolean;
  size?: LoadingSize;
}

/** Kích thước spinner */
const sizeClasses: Record<LoadingSize, string> = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * Loading spinner — dùng fullScreen cho page loading, inline cho component loading
 */
export function Loading({ fullScreen = false, size = 'md' }: LoadingProps) {
  const spinner = (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-500`} />
  );

  if (fullScreen) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {spinner}
    </div>
  );
}
