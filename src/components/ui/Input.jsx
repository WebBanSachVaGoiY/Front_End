import { forwardRef } from 'react';
import './Input.css';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon,
    iconRight,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  return (
    <div className={`input-group ${containerClassName}`}>
      {label && (
        <label className="input-label" htmlFor={props.id}>
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <span className="input-icon input-icon-left">{icon}</span>}
        <input
          ref={ref}
          className={`form-input ${icon ? 'has-icon-left' : ''} ${
            iconRight ? 'has-icon-right' : ''
          } ${error ? 'error' : ''} ${className}`}
          {...props}
        />
        {iconRight && (
          <span className="input-icon input-icon-right">{iconRight}</span>
        )}
      </div>
      {error && <span className="input-error">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
});

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={props.id}>
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}
      <textarea
        className={`form-input form-textarea ${error ? 'error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
