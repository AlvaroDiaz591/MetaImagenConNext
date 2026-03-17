"use client";
import React, { useState } from "react";
import InputTexto from "./InputTexto";
import InputPassword from "./InputPassword";
import BotonLogin from "./BotonLogin";
import RecordarOlvido from "./RecordarOlvido";

const FormularioLogin = () => {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Usuario: ${usuario}\nContraseña: ${contrasena}`);
  };

  return (
    <form className="formulario-login" onSubmit={manejarEnvio}>
      <InputTexto valor={usuario} alCambiar={setUsuario} />
      <InputPassword valor={contrasena} alCambiar={setContrasena} />
      <BotonLogin />
      <RecordarOlvido />
    </form>
  );
};

export default FormularioLogin;
