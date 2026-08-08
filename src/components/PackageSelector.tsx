import { useState } from 'react';
import { PackagePlus, X } from 'lucide-react';
import type { PackageSize } from '../types/calculator';
import { formatNumber } from '../lib/unitConversions';

type Props = { packages: PackageSize[]; onChange: (items: PackageSize[]) => void };

export function PackageSelector({ packages, onChange }: Props) {
  const [newSize, setNewSize] = useState('');
  const add = () => {
    const grams = Number(newSize);
    if (grams <= 0) return;
    onChange([...packages, { id: `package-custom-${Date.now()}`, grams, enabled: true }]);
    setNewSize('');
  };
  return (
    <details className="card settings-card package-card">
      <summary><span><PackagePlus size={18} /> Available package sizes</span><small>{packages.filter((item) => item.enabled).length} enabled</small></summary>
      <div className="package-settings">
        <p>Enable only the sizes available in your setting. The recommendation covers the calculated requirement using the enabled packages.</p>
        <div className="package-list">
          {packages.map((item) => (
            <div className="package-row" key={item.id}>
              <label><input type="checkbox" checked={item.enabled} onChange={(event) => onChange(packages.map((entry) => entry.id === item.id ? { ...entry, enabled: event.target.checked } : entry))} /><span>{formatNumber(item.grams, 1)} g</span></label>
              <div><button aria-label={`Remove ${item.grams} gram package`} onClick={() => onChange(packages.filter((entry) => entry.id !== item.id))}><X size={16} /></button></div>
            </div>
          ))}
        </div>
        <div className="add-package"><div className="unit-input"><input type="number" min="0.1" step="0.5" placeholder="New size" value={newSize} onChange={(event) => setNewSize(event.target.value)} /><span>g</span></div><button className="secondary-button" onClick={add}>Add size</button></div>
      </div>
    </details>
  );
}
