import './Spinner.css';

export function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`spinner spinner-${size} ${className}`} role="status" aria-label="Đang tải" />
  );
}

export function PageSpinner() {
  return (
    <div className="page-spinner">
      <Spinner size="lg" />
      <span className="page-spinner-text">Đang tải...</span>
    </div>
  );
}
