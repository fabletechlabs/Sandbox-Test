import { STATUSES, getStatusLabel } from '../constants';

interface StatusSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (status: string) => void;
  disabled?: boolean;
}

/**
 * Labelled status <select>. If the current value isn't one of the known
 * STATUSES (seed data can contain values like 'blocked'), it's kept as the
 * first option so the select doesn't silently jump to a different status.
 */
function StatusSelect({ id, label, value, onChange, disabled = false }: StatusSelectProps) {
  const isKnown = (STATUSES as readonly string[]).includes(value);
  const options: readonly string[] = isKnown || !value ? STATUSES : [value, ...STATUSES];

  return (
    <div className="field field-inline field-status-select">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((status) => (
          <option key={status} value={status}>
            {getStatusLabel(status)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default StatusSelect;
