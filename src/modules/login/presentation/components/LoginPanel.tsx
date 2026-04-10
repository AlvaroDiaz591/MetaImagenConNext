"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginUseCase } from "../../application/usecases/LoginUseCase";
import { LoginApiAdapter } from "../../infrastructure/api/LoginApiAdapter";
import LoginForm from "./LoginForm";

type LoginPanelProps = {
  onCambiarModo: () => void;
};

const LoginPanel = ({ onCambiarModo }: LoginPanelProps) => {
  const router = useRouter();
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
      if (response.token) {
        const role = response.rol.toLowerCase();
        if (role === "administrador" || role === "admin" || role === "superadmin") {
          router.replace("/dashboard/administrador");
          return;
        }

        if (role === "paciente" || role === "patient" || role === "usuario") {
          router.replace("/dashboard/paciente");
          return;
        }

        setError("Tu cuenta no tiene permisos para acceder a esta plataforma.");
        window.localStorage.removeItem("meta_imagen_token");
        window.sessionStorage.removeItem("meta_imagen_token");
        return;
      }
      setError("No se pudo iniciar sesion.");
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
