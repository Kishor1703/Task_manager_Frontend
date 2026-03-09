declare function AuthPanel(props: {
  onAuthenticated: (user: {
    token: string;
    name: string;
    email: string;
    role: string;
  }) => void;
}): JSX.Element;

export default AuthPanel;
