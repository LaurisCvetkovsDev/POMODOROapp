import React from "react";
import { NavLink } from "react-router-dom";
import { useFriendRequests } from "../contexts/FriendRequestContext";
import "bootstrap/dist/css/bootstrap.min.css";

const TopNavigation = () => {
  const { pendingCount, showNotification, dismissNotification } =
    useFriendRequests();

  const handleFriendsClick = () => {
    if (showNotification) {
      dismissNotification();
    }
  };

  return (
    <div className="tab-navigation">
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            end
          >
            Daily Goal
          </NavLink>
        </li>
        <li className="nav-item position-relative">
          <NavLink
            to="/friends"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={handleFriendsClick}
          >
            Friends
            {pendingCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger friend-request-badge">
                {pendingCount}
                <span className="visually-hidden">friend requests</span>
              </span>
            )}
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/stats"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Statistics
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/about"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            About
          </NavLink>
        </li>
      </ul>

      <style>{`
        .tab-navigation .nav-tabs {
          flex-wrap: nowrap !important;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .tab-navigation .nav-tabs::-webkit-scrollbar {
          display: none;
        }

        .tab-navigation .nav-item {
          flex: 1 1 auto;
          min-width: 0;
          text-align: center;
        }

        .tab-navigation .nav-link {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 60px;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        @media (max-width: 768px) {
          .tab-navigation .nav-link {
            padding: 0.5rem 0.5rem;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 576px) {
          .tab-navigation .nav-link {
            padding: 0.4rem 0.3rem;
            font-size: 0.75rem;
          }
        }

        @media (max-width: 400px) {
          .tab-navigation .nav-link {
            padding: 0.3rem 0.2rem;
            font-size: 0.7rem;
          }
        }
        
        .friend-request-badge {
          font-size: 0.7rem;
          min-width: 1.2rem;
          height: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default TopNavigation;
