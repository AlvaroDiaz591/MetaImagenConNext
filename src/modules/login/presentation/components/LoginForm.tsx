import React, { useState } from "react";
import AuthButton from "@/src/shared/ui/AuthButton";
import AuthInput from "@/src/shared/ui/AuthInput";
import { EyeClosedIcon, EyeOpenIcon, LockIcon, MailIcon } from "@/src/shared/ui/AuthIcons";

type LoginFormProps = {
  correoElectronico: string;
  contrasena: string;
  recordar: boolean;
  onCorreoElectronicoChange: (value: string) => void;
  onContrasenaChange: (value: string) => void;
  onRecordarChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCambiarModo: () => void;
  cargando: boolean;
  error: string;
};

const LoginForm = ({
  correoElectronico,
  contrasena,
  recordar,
  onCorreoElectronicoChange,
  onContrasenaChange,
  onRecordarChange,
  onSubmit,
  onCambiarModo,
  cargando,
  error,
}: LoginFormProps) => {
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  return (
    <form onSubmit={onSubmit} className="auth-form" aria-label="Formulario de inicio de sesion">
      <h2 className="auth-title auth-title-login">Bienvenido a Meta Imagen</h2>

      <AuthInput
        id="login-correo"
        label="Correo Electronico"
        type="email"
        value={correoElectronico}
        onChange={onCorreoElectronicoChange}
        placeholder="tu@correo.com"
        required
        autoComplete="email"
        icon={<MailIcon className="auth-icon" />}
      />

      <AuthInput
        id="login-contrasena"
        label="Contraseña"
        type={mostrarContrasena ? "text" : "password"}
        value={contrasena}
        onChange={onContrasenaChange}
        placeholder="Contraseña"
        required
        autoComplete="current-password"
        trailing={
          <button
            type="button"
            className="auth-visibility-btn"
            onClick={() => setMostrarContrasena((current) => !current)}
            aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {mostrarContrasena ? (
              <EyeClosedIcon className="auth-icon" />
            ) : (
              <EyeOpenIcon className="auth-icon" />
            )}
          </button>
        }
        icon={<LockIcon className="auth-icon" />}
      />

      <div className="auth-row">
        <label className="auth-check">
          <input
            type="checkbox"
            checked={recordar}
            onChange={(event) => onRecordarChange(event.target.checked)}
          />
          Recordarme
        </label>
      </div>

      {error ? <p className="auth-error">{error}</p> : null}

      <AuthButton type="submit" variant="primary" disabled={cargando}>
        {cargando ? "Iniciando..." : "Iniciar sesion"}
      </AuthButton>

      <p className="auth-switch-text">
        No tienes cuenta?{" "}
        <button type="button" className="auth-link" onClick={onCambiarModo}>
          Registrate aqui
        </button>
      </p>
    </form>
  );
};

export default LoginForm;
