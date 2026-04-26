import LoginFormShared from "./LoginFormShared";

const LoginPageKaprodi = ({ onLogin }) => {
  return (
    <LoginFormShared
      requiredRole="kaprodi"
      userType="Kaprodi"
      registerPath="/kaprodi/register"
      onLoginSuccess={onLogin}
    />
  );
};

export default LoginPageKaprodi;
