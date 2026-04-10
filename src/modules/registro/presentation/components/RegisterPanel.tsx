"use client";

import React, { useMemo, useState } from "react";
import { getPasswordStrength, sanitizePhoneDigits } from "@/src/shared/utils/validators";
import { RegisterUseCase } from "../../application/usecases/RegisterUseCase";
import { RegisterApiAdapter } from "../../infrastructure/api/RegisterApiAdapter";
import RegisterForm from "./RegisterForm";

type RegisterPanelProps = {
  onCambiarModo: () => void;
};

const RegisterPanel = ({ onCambiarModo }: RegisterPanelProps) => {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [numeroContacto, setNumeroContacto] = useState("");
  const [correoElectronico, setCorreoElectronico] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const registerUseCase = useMemo(() => {
    return new RegisterUseCase(new RegisterApiAdapter());
  }, []);

  const passwordStrength = useMemo(() => getPasswordStrength(contrasena), [contrasena]);

  const manejarEnvio = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (passwordStrength.level !== "buena") {
      setError("La contraseña debe cumplir todos los requisitos de seguridad.");
      return;
    }

    setCargando(true);

    try {
      const response = await registerUseCase.execute({
        nombreCompleto,
        apellidoPaterno,
        apellidoMaterno,
        numeroContacto,
        correoElectronico,
        contrasena,
        confirmarContrasena,
      });

      alert(`Cuenta creada para ${response.nombreVisible}`);
      onCambiarModo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar la cuenta.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <RegisterForm
      nombreCompleto={nombreCompleto}
      apellidoPaterno={apellidoPaterno}
      apellidoMaterno={apellidoMaterno}
      numeroContacto={numeroContacto}
      correoElectronico={correoElectronico}
      contrasena={contrasena}
      confirmarContrasena={confirmarContrasena}
      passwordStrength={passwordStrength}
      onNombreCompletoChange={setNombreCompleto}
      onApellidoPaternoChange={setApellidoPaterno}
      onApellidoMaternoChange={setApellidoMaterno}
      onNumeroContactoChange={(value) => setNumeroContacto(sanitizePhoneDigits(value))}
      onCorreoElectronicoChange={setCorreoElectronico}
      onContrasenaChange={setContrasena}
      onConfirmarContrasenaChange={setConfirmarContrasena}
      onSubmit={manejarEnvio}
      onCambiarModo={onCambiarModo}
      cargando={cargando}
      error={error}
    />
  );
};

export default RegisterPanel;
