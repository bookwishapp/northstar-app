'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { CartWithItems } from '@/lib/cart';
import AddressForm, { type Address } from './AddressForm';
import ShippingSelector, { type ShippingMethod } from './ShippingSelector';
import { useRouter } from 'next/navigation';

interface CheckoutFormProps {
  cart: CartWithItems;
  sessionId: string;
}

const emailSchema = z.string().email('Please enter a valid email address');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

const addressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  line1: z.string().min(3, 'Street address is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
});

type Step = 'customer' | 'shipping-address' | 'billing-address' | 'shipping-method' | 'review';

export default function CheckoutForm({ cart, sessionId }: CheckoutFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('customer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [shippingAddress, setShippingAddress] = useState<Address>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  const [billingAddress, setBillingAddress] = useState<Address>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);

  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [shippingErrors, setShippingErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [billingErrors, setBillingErrors] = useState<Partial<Record<keyof Address, string>>>({});

  const hasPhysicalItems = cart.items.some((item) => item.deliveryType === 'physical');

  const steps: { id: Step; label: string; required: boolean }[] = [
    { id: 'customer', label: 'Contact', required: true },
    { id: 'shipping-address', label: 'Shipping', required: hasPhysicalItems },
    { id: 'billing-address', label: 'Billing', required: true },
    { id: 'shipping-method', label: 'Delivery', required: hasPhysicalItems },
    { id: 'review', label: 'Payment', required: true },
  ].filter((step) => step.required);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const validateCustomer = (): boolean => {
    let isValid = true;
    setEmailError('');
    setNameError('');

    const emailResult = emailSchema.safeParse(customerEmail);
    if (!emailResult.success) {
      setEmailError(emailResult.error.errors[0].message);
      isValid = false;
    }

    const nameResult = nameSchema.safeParse(customerName);
    if (!nameResult.success) {
      setNameError(nameResult.error.errors[0].message);
      isValid = false;
    }

    return isValid;
  };

  const validateAddress = (
    address: Address,
    setErrors: (errors: Partial<Record<keyof Address, string>>) => void
  ): boolean => {
    const result = addressSchema.safeParse(address);
    if (!result.success) {
      const errors: Partial<Record<keyof Address, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof Address;
        errors[field] = err.message;
      });
      setErrors(errors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    setError(null);

    if (currentStep === 'customer') {
      if (!validateCustomer()) return;
      if (hasPhysicalItems) {
        setShippingAddress((prev) => ({ ...prev, name: customerName }));
        setCurrentStep('shipping-address');
      } else {
        setBillingAddress((prev) => ({ ...prev, name: customerName }));
        setCurrentStep('billing-address');
      }
    } else if (currentStep === 'shipping-address') {
      if (!validateAddress(shippingAddress, setShippingErrors)) return;
      if (useSameAddress) {
        setBillingAddress(shippingAddress);
      } else {
        setBillingAddress((prev) => ({ ...prev, name: customerName }));
      }
      setCurrentStep('billing-address');
    } else if (currentStep === 'billing-address') {
      if (!validateAddress(billingAddress, setBillingErrors)) return;
      if (hasPhysicalItems) {
        setCurrentStep('shipping-method');
      } else {
        setCurrentStep('review');
      }
    } else if (currentStep === 'shipping-method') {
      if (hasPhysicalItems && !shippingMethod) {
        setError('Please select a shipping method');
        return;
      }
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify({
          customerEmail,
          customerName,
          shippingAddress: hasPhysicalItems ? shippingAddress : null,
          billingAddress,
          shippingMethod: hasPhysicalItems ? shippingMethod : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <div className="checkout-form">
      <div className="progress-bar">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`progress-step ${index <= currentStepIndex ? 'active' : ''} ${
              index < currentStepIndex ? 'completed' : ''
            }`}
          >
            <div className="step-number">
              {index < currentStepIndex ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="error-banner">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="form-content">
        {currentStep === 'customer' && (
          <div className="form-section">
            <h2 className="section-title">Contact Information</h2>
            <p className="section-subtitle">
              We'll use this to send your order confirmation and updates
            </p>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                className={`form-input ${emailError ? 'error' : ''}`}
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {emailError && <span className="form-error">{emailError}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                className={`form-input ${nameError ? 'error' : ''}`}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                autoComplete="name"
              />
              {nameError && <span className="form-error">{nameError}</span>}
            </div>
          </div>
        )}

        {currentStep === 'shipping-address' && hasPhysicalItems && (
          <div className="form-section">
            <h2 className="section-title">Shipping Address</h2>
            <p className="section-subtitle">
              Where should we send your physical items?
            </p>
            <AddressForm
              address={shippingAddress}
              onChange={setShippingAddress}
              errors={shippingErrors}
            />
          </div>
        )}

        {currentStep === 'billing-address' && (
          <div className="form-section">
            <h2 className="section-title">Billing Address</h2>
            <p className="section-subtitle">
              This address will be used for tax calculation
            </p>

            {hasPhysicalItems && (
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={useSameAddress}
                    onChange={(e) => {
                      setUseSameAddress(e.target.checked);
                      if (e.target.checked) {
                        setBillingAddress(shippingAddress);
                      }
                    }}
                  />
                  <span>Same as shipping address</span>
                </label>
              </div>
            )}

            {(!useSameAddress || !hasPhysicalItems) && (
              <AddressForm
                address={billingAddress}
                onChange={setBillingAddress}
                errors={billingErrors}
              />
            )}
          </div>
        )}

        {currentStep === 'shipping-method' && hasPhysicalItems && (
          <div className="form-section">
            <ShippingSelector
              selected={shippingMethod}
              onSelect={setShippingMethod}
              itemCount={
                cart.items
                  .filter((item) => item.deliveryType === 'physical')
                  .reduce((sum, item) => sum + item.quantity, 0)
              }
            />
          </div>
        )}

        {currentStep === 'review' && (
          <div className="form-section">
            <h2 className="section-title">Review & Pay</h2>
            <p className="section-subtitle">
              Review your order details before proceeding to payment
            </p>

            <div className="review-section">
              <h3 className="review-heading">Contact Information</h3>
              <div className="review-content">
                <p>{customerName}</p>
                <p>{customerEmail}</p>
              </div>
            </div>

            {hasPhysicalItems && (
              <div className="review-section">
                <h3 className="review-heading">Shipping Address</h3>
                <div className="review-content">
                  <p>{shippingAddress.name}</p>
                  <p>{shippingAddress.line1}</p>
                  {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                  <p>
                    {shippingAddress.city}, {shippingAddress.state}{' '}
                    {shippingAddress.zip}
                  </p>
                  <p>{shippingAddress.country}</p>
                </div>
              </div>
            )}

            <div className="review-section">
              <h3 className="review-heading">Billing Address</h3>
              <div className="review-content">
                <p>{billingAddress.name}</p>
                <p>{billingAddress.line1}</p>
                {billingAddress.line2 && <p>{billingAddress.line2}</p>}
                <p>
                  {billingAddress.city}, {billingAddress.state} {billingAddress.zip}
                </p>
                <p>{billingAddress.country}</p>
              </div>
            </div>

            <div className="payment-note">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <span>
                You'll be redirected to Stripe's secure checkout to complete your
                payment
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        {currentStepIndex > 0 && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleBack}
            disabled={isProcessing}
          >
            Back
          </button>
        )}
        {currentStep !== 'review' ? (
          <button
            type="button"
            className="btn-primary"
            onClick={handleNext}
            disabled={isProcessing}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="spinner" />
                <span>Processing...</span>
              </>
            ) : (
              'Proceed to Payment'
            )}
          </button>
        )}
      </div>

      <style jsx>{`
        .checkout-form {
          width: 100%;
        }

        .progress-bar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3rem;
          position: relative;
        }

        .progress-bar::before {
          content: '';
          position: absolute;
          top: 16px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--divider);
          z-index: 0;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 2px solid var(--divider);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          color: var(--text-dim);
          transition: all 0.3s;
        }

        .progress-step.active .step-number {
          border-color: var(--gold);
          color: var(--gold);
        }

        .progress-step.completed .step-number {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--bg);
        }

        .step-label {
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-dim);
          text-align: center;
        }

        .progress-step.active .step-label {
          color: var(--gold);
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: rgba(192, 57, 43, 0.1);
          border: 1px solid rgba(192, 57, 43, 0.3);
          border-radius: 4px;
          color: #e74c3c;
          margin-bottom: 2rem;
        }

        .form-content {
          margin-bottom: 2rem;
        }

        .form-section {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.75rem;
          font-weight: 500;
          color: var(--text);
          margin: 0 0 0.5rem;
        }

        .section-subtitle {
          font-size: 0.95rem;
          color: var(--text-dim);
          margin: 0 0 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
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

        .form-input {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          padding: 0.75rem 1rem;
          background: var(--bg);
          border: 1px solid var(--divider);
          border-radius: 2px;
          color: var(--text);
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1);
        }

        .form-input.error {
          border-color: #c0392b;
        }

        .form-input::placeholder {
          color: var(--text-dim);
          opacity: 0.6;
        }

        .form-error {
          font-family: 'Lato', sans-serif;
          font-size: 0.75rem;
          color: #c0392b;
          margin-top: -0.25rem;
        }

        .checkbox-group {
          margin-bottom: 1.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.95rem;
          color: var(--text);
        }

        .checkbox-label input[type='checkbox'] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .review-section {
          padding: 1.25rem;
          background: var(--bg-card);
          border: 1px solid var(--divider);
          border-radius: 4px;
          margin-bottom: 1.25rem;
        }

        .review-heading {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 0.75rem;
          font-weight: 500;
        }

        .review-content {
          font-size: 0.95rem;
          color: var(--text);
          line-height: 1.6;
        }

        .review-content p {
          margin: 0.25rem 0;
        }

        .payment-note {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: rgba(201, 168, 76, 0.1);
          border: 1px solid var(--divider);
          border-radius: 4px;
          font-size: 0.9rem;
          color: var(--text-dim);
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding-top: 2rem;
          border-top: 1px solid var(--divider);
        }

        .btn-secondary,
        .btn-primary {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 1rem 2rem;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.25s;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid var(--divider);
          color: var(--text-dim);
        }

        .btn-secondary:hover:not(:disabled) {
          border-color: var(--gold);
          color: var(--gold);
        }

        .btn-primary {
          background: var(--accent);
          color: #fff;
          flex: 1;
          max-width: 300px;
          margin-left: auto;
        }

        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.15);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px var(--accent-glow);
        }

        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .progress-bar {
            margin-bottom: 2rem;
          }

          .step-label {
            font-size: 0.6rem;
          }

          .step-number {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
          }

          .section-title {
            font-size: 1.5rem;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .btn-primary {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
