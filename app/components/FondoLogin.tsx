import React from "react";

interface Props {
  children: React.ReactNode;
}

const FondoLogin = ({ children }: Props) => {
  return (
    <div className="fondo-login">
      {children}
    </div>
  );
};

export default FondoLogin;
