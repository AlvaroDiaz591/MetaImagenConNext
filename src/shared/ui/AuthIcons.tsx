import React from "react";

type IconProps = {
  className?: string;
};

export const UserIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"
      fill="currentColor"
    />
  </svg>
);

export const LockIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      d="M17 8h-1V6c0-2.76-2.24-5-5-5S6 3.24 6 6v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1S15.1 4.29 15.1 6v2z"
      fill="currentColor"
    />
  </svg>
);

export const MailIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
      fill="currentColor"
    />
  </svg>
);

export const IdCardIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM8 8c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm8 8H5.5v-.5c0-1.66 3.34-2.5 5-2.5s5 .84 5 2.5V16zm3-6h-5V8h5v2zm0 4h-4v-2h4v2z"
      fill="currentColor"
    />
  </svg>
);

export const EyeOpenIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
      fill="currentColor"
    />
  </svg>
);

export const EyeClosedIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      d="m3.5 4.9 1.4-1.4 15.2 15.2-1.4 1.4-2.3-2.3A11.3 11.3 0 0 1 12 19c-7 0-10-7-10-7 1.2-2.1 2.6-3.8 4.2-5.1L3.5 4.9zm5.6 5.6a4 4 0 0 0 5.5 5.5l-5.5-5.5zM12 5c7 0 10 7 10 7a18.6 18.6 0 0 1-3.8 4.7l-1.5-1.5A16 16 0 0 0 19.8 12c-.8-1.3-3.2-5-7.8-5-.9 0-1.8.1-2.6.3L7.8 5.7c1.3-.5 2.7-.7 4.2-.7z"
      fill="currentColor"
    />
  </svg>
);

export const PhoneIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2c1.1.4 2.2.6 3.4.6a1 1 0 0 1 1 1V21a1 1 0 0 1-1 1C10.4 22 2 13.6 2 3a1 1 0 0 1 1-1h3.8a1 1 0 0 1 1 1c0 1.2.2 2.3.6 3.4a1 1 0 0 1-.2 1l-1.6 1.6z"
      fill="currentColor"
    />
  </svg>
);
