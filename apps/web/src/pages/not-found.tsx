import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-5xl font-bold">404</p>
      <p className="text-muted-foreground">No encontramos esta página.</p>
      <Link to="/" className={cn(buttonVariants())}>
        Volver al inicio
      </Link>
    </div>
  );
}
