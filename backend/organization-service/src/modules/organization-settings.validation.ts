import { ValidateBy, type ValidationOptions } from 'class-validator';

export function IsSupportedTimeZone(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isSupportedTimeZone',
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || !value || /^[+-]/.test(value))
            return false;
          try {
            new Intl.DateTimeFormat('en', { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage: () => 'timezone must be a supported IANA time zone',
      },
    },
    options,
  );
}

const currencies = new Set(Intl.supportedValuesOf('currency'));
export function IsSupportedCurrency() {
  return ValidateBy({
    name: 'isSupportedCurrency',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' && currencies.has(value),
      defaultMessage: () =>
        'defaultCurrency must be a supported uppercase currency code',
    },
  });
}
