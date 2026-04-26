import LoginFormShared from "./LoginFormShared";

const LoginPageMahasiswa = ({ onLogin }) => {
  return (
    <LoginFormShared
      requiredRole="mahasiswa"
      userType="mahasiswa"
      registerPath="/mahasiswa/register"
      onLoginSuccess={onLogin}
    />
  );
};

export default LoginPageMahasiswa;
