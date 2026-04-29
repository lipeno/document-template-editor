// Back-office app components — small, cosmetic recreations.
// Loaded globally via window for cross-script sharing.

const Icon = ({ name, size = 14, color }) => (
  <i className={`fa-regular fa-${name}`} style={{ fontSize: size, color, width: size + 2, textAlign: 'center' }} />
);

const Avatar = ({ initials, color = '#623AA3', size = 32 }) => (
  <div style={{
    width: size, height: size, minWidth: size, borderRadius: '50%', background: color, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    font: `400 ${size/2.5}px/1 var(--font-body)`
  }}>{initials}</div>
);

const Badge = ({ children, variant = 'draft' }) => {
  const map = {
    draft:    { bg: '#fff',    c: '#131314', b: '#D6D9DB' },
    reserved: { bg: '#136DEB', c: '#fff',    b: '#136DEB' },
    started:  { bg: '#FFB442', c: '#131314', b: '#FFB442' },
    stopped:  { bg: '#62DA7C', c: '#131314', b: '#62DA7C' },
    overdue:  { bg: '#E51C2C', c: '#fff',    b: '#E51C2C' },
    paid:     { bg: '#62DA7C', c: '#131314', b: '#62DA7C' },
    due:      { bg: '#FFB442', c: '#131314', b: '#FFB442' },
    partial:  { bg: '#136DEB', c: '#fff',    b: '#136DEB' },
    info:     { bg: '#EDF5FF', c: '#2466C3', b: '#BBDBFA' },
    success:  { bg: '#E8FFEB', c: '#1F772C', b: '#B1FCC1' },
    warning:  { bg: '#FFF2DE', c: '#A34C00', b: '#FFDAA1' },
    danger:   { bg: '#FFEDEF', c: '#C1000F', b: '#FFB7B7' },
  };
  const s = map[variant] || map.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 10px',
      background: s.bg, color: s.c, border: `1px solid ${s.b}`, borderRadius: 26,
      font: '400 11px/1 var(--font-body)', textTransform: 'uppercase', letterSpacing: '.02em',
      whiteSpace: 'nowrap'
    }}>{children}</span>
  );
};

const Button = ({ children, variant = 'primary', icon, size = 'md', onClick, disabled, style }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid transparent',
    borderRadius: 6, cursor: disabled ? 'default' : 'pointer', outline: 'none',
    font: '500 14px/1 var(--font-body)', transition: 'background 200ms, color 200ms',
    opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto',
    height: size === 'sm' ? 38 : size === 'xs' ? 26 : size === 'lg' ? 48 : 42,
    padding: size === 'sm' ? '0 12px' : size === 'xs' ? '0 10px' : size === 'lg' ? '0 20px' : '0 16px',
    fontSize: size === 'xs' || size === 'sm' ? 12 : size === 'lg' ? 16 : 14,
  };
  const variants = {
    primary:   { background: '#136DEB', color: '#fff', borderColor: '#136DEB' },
    secondary: { background: '#fff', color: '#131314', border: '1px solid #D6D9DB' },
    danger:    { background: '#E51C2C', color: '#fff', borderColor: '#E51C2C' },
    success:   { background: '#62DA7C', color: '#131314', borderColor: '#62DA7C' },
    ghost:     { background: 'transparent', color: '#136DEB', borderColor: 'transparent' },
  };
  return (
    <button style={{ ...base, ...variants[variant], ...style }} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} />}{children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, icon, error, type = 'text', width = '100%' }) => (
  <div style={{ position: 'relative', width }}>
    {icon && (
      <span style={{ position: 'absolute', left: 0, top: 0, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#546972', pointerEvents: 'none' }}>
        <Icon name={icon} size={14} />
      </span>
    )}
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange && onChange(e.target.value)}
      style={{
        height: 42, width: '100%', boxSizing: 'border-box',
        padding: icon ? '0 12px 0 42px' : '0 12px',
        border: `1px solid ${error ? '#C1000F' : '#D6D9DB'}`, borderRadius: 6,
        font: '400 14px/1 var(--font-body)', color: '#131314', background: '#fff', outline: 'none'
      }}
    />
  </div>
);

const Field = ({ label, hint, error, children }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', font: '600 12px/1.2 var(--font-body)', color: '#131314', marginBottom: 4 }}>{label}</label>}
    {children}
    {(hint || error) && <div style={{ font: '400 12px/1.33 var(--font-body)', color: error ? '#C1000F' : '#546972', letterSpacing: '.02em', marginTop: 4 }}>{error || hint}</div>}
  </div>
);

const Card = ({ children, padding = 16, style }) => (
  <div style={{
    background: '#fff', border: '1px solid #D6D9DB', borderRadius: 8, padding, ...style
  }}>{children}</div>
);

const VCard = ({ avatar, thumbIcon, thumbColor = '#EDF1F5', thumbFg = '#546972', title, meta, right, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#fff', border: '1px solid #D6D9DB', borderRadius: 8, padding: 14,
      display: 'flex', gap: 12, alignItems: 'center', cursor: onClick ? 'pointer' : 'default',
    }}
  >
    {avatar}
    {thumbIcon && (
      <div style={{ width: 40, height: 40, borderRadius: 6, background: thumbColor, color: thumbFg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={thumbIcon} size={16} />
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ font: '600 14px/1.2 var(--font-body)', color: '#131314', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
      {meta && <div style={{ font: '400 12px/1.4 var(--font-body)', color: '#546972', letterSpacing: '.02em', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</div>}
    </div>
    {right && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{right}</div>}
  </div>
);

Object.assign(window, { Icon, Avatar, Badge, Button, Input, Field, Card, VCard });
