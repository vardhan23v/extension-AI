import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
    <p className="font-mono text-sm text-muted">404</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
    <p className="mt-2 text-sm text-muted">The page you are looking for doesn’t exist or was moved.</p>
    <Link to="/" className="mt-6 inline-flex h-9 items-center rounded bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary/90">
      Go home
    </Link>
  </div>
);

export default NotFoundPage;
