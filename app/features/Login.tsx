import React from "react";
import FormularioLogin from "../components/FormularioLogin";
import FondoLogin from "../components/FondoLogin";

const Login = () => {
  return (
    <FondoLogin>
      <div className="contenedor-login">
        <h2 className="titulo-login">Bienvenido a Meta Imagen</h2>
        <FormularioLogin />
      </div>
    </FondoLogin>
  );
};

export default Login;
