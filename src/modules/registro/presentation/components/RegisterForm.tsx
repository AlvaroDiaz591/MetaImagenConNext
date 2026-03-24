import React, { useMemo, useState } from "react";
import AuthButton from "@/src/shared/ui/AuthButton";
import AuthInput from "@/src/shared/ui/AuthInput";
import type { PasswordStrength } from "@/src/shared/utils/validators";
import {
  EyeClosedIcon,
  EyeOpenIcon,
  IdCardIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
} from "@/src/shared/ui/AuthIcons";

type RegisterFormProps = {
  nombreCompleto: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  numeroContacto: string;
  correoElectronico: string;
  contrasena: string;
  confirmarContrasena: string;
  passwordStrength: PasswordStrength;
  onNombreCompletoChange: (value: string) => void;
  onApellidoPaternoChange: (value: string) => void;
  onApellidoMaternoChange: (value: string) => void;
  onNumeroContactoChange: (value: string) => void;
  onCorreoElectronicoChange: (value: string) => void;
  onContrasenaChange: (value: string) => void;
  onConfirmarContrasenaChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCambiarModo: () => void;
  cargando: boolean;
  error: string;
};

const RegisterForm = ({
  nombreCompleto,
  apellidoPaterno,
  apellidoMaterno,
  numeroContacto,
  correoElectronico,
  contrasena,
  confirmarContrasena,
  passwordStrength,
  onNombreCompletoChange,
  onApellidoPaternoChange,
  onApellidoMaternoChange,
  onNumeroContactoChange,
  onCorreoElectronicoChange,
  onContrasenaChange,
  onConfirmarContrasenaChange,
  onSubmit,
  onCambiarModo,
  cargando,
  error,
}: RegisterFormProps) => {
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const strengthText = useMemo(() => {
    if (passwordStrength.level === "mala") {
      return "Mala";
    }
    if (passwordStrength.level === "intermedia") {
      return "Intermedia";
    }
    return "Buena";
  }, [passwordStrength.level]);

  return (
    <form onSubmit={onSubmit} className="auth-form auth-form-register" aria-label="Formulario de registro">
      <h2 className="auth-title">Crear cuenta</h2>

      <AuthInput
        id="register-nombre"
        label="Nombre Completo"
        value={nombreCompleto}
        onChange={onNombreCompletoChange}
        placeholder="Nombre completo"
        required
        autoComplete="name"
        icon={<IdCardIcon className="auth-icon" />}
      />

      <AuthInput
        id="register-apellido-paterno"
        label="Apellido Paterno"
        value={apellidoPaterno}
        onChange={onApellidoPaternoChange}
        placeholder="Apellido paterno"
        autoComplete="family-name"
        icon={<IdCardIcon className="auth-icon" />}
      />

      <AuthInput
        id="register-apellido-materno"
        label="Apellido Materno"
        value={apellidoMaterno}
        onChange={onApellidoMaternoChange}
        placeholder="Apellido materno"
        autoComplete="additional-name"
        icon={<IdCardIcon className="auth-icon" />}
      />

      <AuthInput
        id="register-contacto"
        label="Número de contacto"
        value={numeroContacto}
        onChange={onNumeroContactoChange}
        placeholder="71234567"
        required
        inputMode="numeric"
        maxLength={8}
        prefix="+591"
        icon={<PhoneIcon className="auth-icon" />}
      />

      <AuthInput
        id="register-email"
        label="Correo Electrónico"
        type="email"
        value={correoElectronico}
        onChange={onCorreoElectronicoChange}
        placeholder="tu@correo.com"
        required
        autoComplete="email"
        icon={<MailIcon className="auth-icon" />}
      />

      <AuthInput
        id="register-contrasena"
        label="Contraseña"
        type={mostrarContrasena ? "text" : "password"}
        value={contrasena}
        onChange={onContrasenaChange}
        placeholder="Mínimo 8 caracteres"
        required
        autoComplete="new-password"
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

      <div className="auth-strength">
        <div className="auth-strength-bar" aria-hidden="true">
          <span
            className={`auth-strength-fill auth-strength-${passwordStrength.level}`}
            style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
          />
        </div>
        <p className="auth-strength-label">
          Fortaleza de contraseña: <strong>{strengthText}</strong>
        </p>
        <ul className="auth-strength-list">
          {passwordStrength.requirements.map((item) => (
            <li key={item.label} className={item.met ? "auth-strength-ok" : "auth-strength-pending"}>
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <AuthInput
        id="register-confirmar"
        label="Confirmar contraseña"
        type={mostrarConfirmacion ? "text" : "password"}
        value={confirmarContrasena}
        onChange={onConfirmarContrasenaChange}
        placeholder="Repite la contrasena"
        required
        autoComplete="new-password"
        trailing={
          <button
            type="button"
            className="auth-visibility-btn"
            onClick={() => setMostrarConfirmacion((current) => !current)}
            aria-label={mostrarConfirmacion ? "Ocultar contrasena" : "Mostrar contrasena"}
          >
            {mostrarConfirmacion ? (
              <EyeClosedIcon className="auth-icon" />
            ) : (
              <EyeOpenIcon className="auth-icon" />
            )}
          </button>
        }
        icon={<LockIcon className="auth-icon" />}
      />

      {error ? <p className="auth-error">{error}</p> : null}

      <AuthButton type="submit" variant="primary" disabled={cargando}>
        {cargando ? "Creando..." : "Crear cuenta"}
      </AuthButton>

      <p className="auth-switch-text">
        Ya tienes cuenta?{" "}
        <button type="button" className="auth-link" onClick={onCambiarModo}>
          Volver a iniciar sesion
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;
