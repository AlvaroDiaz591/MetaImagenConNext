import React from "react";

type AuthButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
};

const AuthButton = ({
  children,
  type = "button",
  onClick,
  variant = "primary",
  disabled,
}: AuthButtonProps) => {
  const className =
    variant === "primary" ? "auth-button auth-button-primary" : "auth-button auth-button-ghost";

  return (
    <button type={type} onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
};

export default AuthButton;
