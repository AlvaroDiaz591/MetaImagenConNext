export type RegisterData = {
  nombreCompleto: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  numeroContacto: string;
  correoElectronico: string;
  contrasena: string;
  confirmarContrasena: string;
};

export type RegisteredUser = {
  id: string;
  nombreVisible: string;
};
