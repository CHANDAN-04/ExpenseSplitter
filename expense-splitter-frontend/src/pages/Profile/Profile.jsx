import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

function Profile() {
  const user = useSelector((state) => state.auth.user);

  if (user?.username) {
    return <Navigate to={`/profile/${user.username}`} replace />;
  }

  return (
    <Navigate to="/dashboard" replace />
  );
}

export default Profile;
