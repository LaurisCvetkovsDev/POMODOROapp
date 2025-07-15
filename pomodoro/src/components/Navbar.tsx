import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Comp1Gif from "../assets/Comp 1.gif";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="glass-navbar">
      <div className="row w-100">
        <div className="col-md-4">
          <Link to="/" className="navbar-brand">
            <img src={Comp1Gif} alt="Logo" className="navbar-gif" />
          </Link>
        </div>
        <div className="col-md-4 text-center"></div>
        <div className="col-md-4 text-end">
          {user ? (
            <div className="d-flex align-items-center justify-content-end">
              <span className="me-3" style={{ color: "wheat" }}>
                Greetings, {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline-light"
                style={{
                  backgroundColor: "wheat",
                  borderColor: "black",
                  color: "black",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="d-flex flex-column align-items-end">
              <div className="d-flex gap-2 mb-1">
                <Link
                  to="/login"
                  className="btn btn-outline-light"
                  style={{
                    backgroundColor: "wheat",
                    borderColor: "black",
                    color: "black",
                  }}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn btn-outline-light"
                  style={{
                    backgroundColor: "wheat",
                    borderColor: "black",
                    color: "black",
                  }}
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
