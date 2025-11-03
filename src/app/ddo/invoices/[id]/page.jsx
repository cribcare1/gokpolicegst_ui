import InvoiceDetailClient from './InvoiceDetailClient';

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return placeholder ID for static export compatibility
  // With static export, we need at least one param to satisfy build requirements
  // Actual invoice IDs are handled client-side via useParams() in the client component
  return [{ id: 'placeholder' }];
}

export default function InvoiceDetailPage() {
  return <InvoiceDetailClient />;
}

