'use client';

import React from 'react';

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface AddressFormProps {
  address: Address;
  onChange: (address: Address) => void;
  errors?: Partial<Record<keyof Address, string>>;
  title?: string;
  showCountry?: boolean;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export default function AddressForm({
  address,
  onChange,
  errors = {},
  title,
  showCountry = false,
}: AddressFormProps) {
  const handleChange = (field: keyof Address, value: string) => {
    onChange({ ...address, [field]: value });
  };

  return (
    <div className="address-form">
      {title && <h3 className="address-form-title">{title}</h3>}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Full Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            className={`form-input ${errors.name ? 'error' : ''}`}
            value={address.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="John Doe"
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="line1" className="form-label">
            Address Line 1 <span className="required">*</span>
          </label>
          <input
            type="text"
            id="line1"
            className={`form-input ${errors.line1 ? 'error' : ''}`}
            value={address.line1}
            onChange={(e) => handleChange('line1', e.target.value)}
            placeholder="123 Main St"
          />
          {errors.line1 && <span className="form-error">{errors.line1}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="line2" className="form-label">
            Address Line 2
          </label>
          <input
            type="text"
            id="line2"
            className="form-input"
            value={address.line2 || ''}
            onChange={(e) => handleChange('line2', e.target.value)}
            placeholder="Apt 4B (optional)"
          />
        </div>
      </div>

      <div className="form-row-split">
        <div className="form-group">
          <label htmlFor="city" className="form-label">
            City <span className="required">*</span>
          </label>
          <input
            type="text"
            id="city"
            className={`form-input ${errors.city ? 'error' : ''}`}
            value={address.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="New York"
          />
          {errors.city && <span className="form-error">{errors.city}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="state" className="form-label">
            State <span className="required">*</span>
          </label>
          <select
            id="state"
            className={`form-select ${errors.state ? 'error' : ''}`}
            value={address.state}
            onChange={(e) => handleChange('state', e.target.value)}
          >
            <option value="">Select State</option>
            {US_STATES.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
          {errors.state && <span className="form-error">{errors.state}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="zip" className="form-label">
            ZIP Code <span className="required">*</span>
          </label>
          <input
            type="text"
            id="zip"
            className={`form-input ${errors.zip ? 'error' : ''}`}
            value={address.zip}
            onChange={(e) => handleChange('zip', e.target.value)}
            placeholder="10001"
            maxLength={10}
          />
          {errors.zip && <span className="form-error">{errors.zip}</span>}
        </div>
      </div>

      {showCountry && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="country" className="form-label">
              Country <span className="required">*</span>
            </label>
            <select
              id="country"
              className={`form-select ${errors.country ? 'error' : ''}`}
              value={address.country}
              onChange={(e) => handleChange('country', e.target.value)}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
            </select>
            {errors.country && <span className="form-error">{errors.country}</span>}
          </div>
        </div>
      )}

      <style jsx>{`
        .address-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .address-form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 0.5rem;
        }

        .form-row,
        .form-row-split {
          display: grid;
          gap: 1rem;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .form-row-split {
          grid-template-columns: 2fr 1fr 1fr;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
          font-weight: 500;
        }

        .required {
          color: var(--accent-2);
        }

        .form-input,
        .form-select {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          padding: 0.75rem 1rem;
          background: var(--bg);
          border: 1px solid var(--divider);
          border-radius: 2px;
          color: var(--text);
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1);
        }

        .form-input::placeholder {
          color: var(--text-dim);
          opacity: 0.6;
        }

        .form-input.error,
        .form-select.error {
          border-color: #c0392b;
        }

        .form-error {
          font-family: 'Lato', sans-serif;
          font-size: 0.75rem;
          color: #c0392b;
          margin-top: -0.25rem;
        }

        @media (max-width: 768px) {
          .form-row-split {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
