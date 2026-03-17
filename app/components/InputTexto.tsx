import React from "react";
import IconoUsuario from "./IconoUsuario";

interface Props {
  valor: string;
  alCambiar: (valor: string) => void;
}

const InputTexto = ({ valor, alCambiar }: Props) => (
  <div className="campo-input">
    <input
      type="text"
      placeholder="Usuario"
      value={valor}
      onChange={e => alCambiar(e.target.value)}
      className="input-login"
      required
    />
    <span className="icono-input usuario">
      <IconoUsuario />
    </span>
  </div>
);

export default InputTexto;
