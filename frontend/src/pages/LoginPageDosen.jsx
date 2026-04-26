import LoginFormShared from "./LoginFormShared";

const LoginPageDosen = ({ onLogin }) => {
  return (
    <LoginFormShared
      requiredRole="dosen_wali"
      userType="Dosen Wali"
      registerPath="/dosen/register"
      onLoginSuccess={onLogin}
    />
  );
};

export default LoginPageDosen;
