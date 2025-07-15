import React from "react";
import { NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const TabNavigation = () => {
  return (
    <div className="tab-navigation mb-4">
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
        <li className="nav-item">
          <NavLink
            to="/friends"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Friends
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
      `}</style>
    </div>
  );
};

export default TabNavigation;
