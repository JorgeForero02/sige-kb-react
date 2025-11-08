export function Icon({ name, size = 'md', className = '' }) {
  const sizeClass = {
    sm: 'bi-lg',
    md: '',
    lg: 'bi-xl',
    '2x': 'bi-2x'
  }[size];

  return <i className={`bi bi-${name} ${sizeClass} ${className}`}></i>;
}