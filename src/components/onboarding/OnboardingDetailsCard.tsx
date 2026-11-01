import React from 'react';
import { Card, Field, SelectField } from '../ui';
import { CalendarIcon } from '../icons';
import { OCCASIONS } from './types';
import type { EventSetup } from '../../types/plan';

export interface OnboardingDetailsCardProps {
  setup: EventSetup;
  onFieldChange: (field: keyof EventSetup, value: EventSetup[keyof EventSetup]) => void;
}

const DetailsHeader: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
    <div
      style={{
        background: '#172339',
        color: '#38bdf8',
        width: 32,
        height: 32,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <CalendarIcon size={16} color="#38bdf8" />
    </div>
    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
      Event details
    </h3>
  </div>
);

export const OnboardingDetailsCard: React.FC<OnboardingDetailsCardProps> = ({
  setup,
  onFieldChange,
}) => {
  return (
    <Card>
      <DetailsHeader />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <SelectField
            id="occasion"
            label="Occasion *"
            value={setup.occasion}
            onChange={(e) => onFieldChange('occasion', e.target.value)}
            required
          >
            <option value="">Select occasion…</option>
            {OCCASIONS.filter(Boolean).map((o) => (
              <option key={o} value={o}>
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </option>
            ))}
          </SelectField>

          <Field
            id="event-date"
            label="Event date *"
            type="date"
            value={setup.date}
            onChange={(e) => onFieldChange('date', e.target.value)}
            required
          />

          <Field
            id="total-budget"
            label="Total budget (₹) *"
            type="number"
            min={1}
            value={setup.budget}
            onChange={(e) => onFieldChange('budget', e.target.value)}
            placeholder="e.g. 2500000"
            required
          />

          <Field
            id="guest-count"
            label="Number of guests *"
            type="number"
            min={1}
            value={setup.guestCount}
            onChange={(e) => onFieldChange('guestCount', e.target.value)}
            placeholder="e.g. 200"
            required
          />
        </div>

        <div style={{ maxWidth: 300 }}>
          <Field
            id="city"
            label="City"
            type="text"
            value={setup.city}
            onChange={(e) => onFieldChange('city', e.target.value)}
            placeholder="e.g. Mumbai"
          />
        </div>
      </div>
    </Card>
  );
};
