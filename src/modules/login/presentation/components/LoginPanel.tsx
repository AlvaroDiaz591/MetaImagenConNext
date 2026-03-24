"use client";

import React, { useMemo, useState } from "react";
import { LoginUseCase } from "../../application/usecases/LoginUseCase";
import { LoginApiAdapter } from "../../infrastructure/api/LoginApiAdapter";
import LoginForm from "./LoginForm";

type LoginPanelProps = {
  onCambiarModo: () => void;
};

const LoginPanel = ({ onCambiarModo }: LoginPanelProps) => {
  const [correoElectronico, setCorreoElectronico] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const loginUseCase = useMemo(() => {
    return new LoginUseCase(new LoginApiAdapter());
  }, []);

  const manejarEnvio = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setCargando(true);

    try {
      const response = await loginUseCase.execute({ correoElectronico, contrasena, recordar });
      alert(`Sesion iniciada: ${response.nombreVisible}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <LoginForm
      correoElectronico={correoElectronico}
      contrasena={contrasena}
      recordar={recordar}
      onCorreoElectronicoChange={setCorreoElectronico}
      onContrasenaChange={setContrasena}
      onRecordarChange={setRecordar}
      onSubmit={manejarEnvio}
      onCambiarModo={onCambiarModo}
      cargando={cargando}
      error={error}
    />
  );
};

export default LoginPanel;
