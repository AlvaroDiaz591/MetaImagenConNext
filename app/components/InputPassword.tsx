import React from "react";
import IconoContrasena from "./IconoContrasena";


interface Props {
  valor: string;
  alCambiar: (valor: string) => void;
}

const InputPassword = ({ valor, alCambiar }: Props) => (
  <div className="campo-input">
    <input
      type="password"
      placeholder="Contraseña"
      value={valor}
      onChange={e => alCambiar(e.target.value)}
      className="input-login"
      required
    />
    <span className="icono-input contrasena">
      <IconoContrasena />
    </span>
  </div>
);

export default InputPassword;
