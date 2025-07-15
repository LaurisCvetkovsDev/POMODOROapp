import React, { useState } from "react";
import { useFriendRequests } from "../contexts/FriendRequestContext";
import Avatar from "boring-avatars";

const FriendRequestNotification: React.FC = () => {
  const {
    pendingRequests,
    pendingCount,
    showNotification,
    dismissNotification,
    acceptRequest,
    declineRequest,
  } = useFriendRequests();

  const [processingRequests, setProcessingRequests] = useState<Set<number>>(
    new Set()
  );

  if (!showNotification || pendingCount === 0) {
    return null;
  }

  const handleAccept = async (friendId: number) => {
    setProcessingRequests((prev) => new Set(prev).add(friendId));
    try {
      await acceptRequest(friendId);
    } catch (error) {
      console.error("Failed to accept request:", error);
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  const handleDecline = async (friendId: number) => {
    setProcessingRequests((prev) => new Set(prev).add(friendId));
    try {
      await declineRequest(friendId);
    } catch (error) {
      console.error("Failed to decline request:", error);
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  return (
    <div className="friend-request-notification">
      <div className="notification-overlay" onClick={dismissNotification}></div>
      <div className="notification-popup">
        <div className="notification-header">
          <h4>Friend Requests ({pendingCount})</h4>
          <button
            className="btn-close"
            onClick={dismissNotification}
            aria-label="Close"
          ></button>
        </div>

        <div className="notification-body">
          {pendingRequests.map((request) => (
            <div key={request.id} className="friend-request-item">
              <div className="request-info">
                <Avatar
                  size={40}
                  name={request.username || request.id?.toString() || ""}
                  variant="beam"
                  colors={[
                    "#92A1C6",
                    "#146A7C",
                    "#F0AB3D",
                    "#C271B4",
                    "#C20D90",
                  ]}
                />
                <div className="request-details">
                  <span className="username">{request.username}</span>
                  <span className="request-text">wants to be your friend</span>
                </div>
              </div>

              <div className="request-actions">
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleAccept(request.id)}
                  disabled={processingRequests.has(request.id)}
                >
                  {processingRequests.has(request.id) ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    ></span>
                  ) : (
                    "✓"
                  )}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDecline(request.id)}
                  disabled={processingRequests.has(request.id)}
                >
                  {processingRequests.has(request.id) ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    ></span>
                  ) : (
                    "✗"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="notification-footer">
          <button
            className="btn btn-outline-light btn-sm"
            onClick={dismissNotification}
          >
            View all in friends tab
          </button>
        </div>
      </div>

      <style>{`
        .friend-request-notification {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .notification-popup {
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          padding: 0;
          max-width: 400px;
          width: 90%;
          max-height: 500px;
          color: wheat;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .notification-header {
          display: flex;
          justify-content: between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .notification-header h4 {
          margin: 0;
          color: wheat;
          font-size: 1.1rem;
          flex: 1;
        }

        .btn-close {
          background: none;
          border: none;
          color: wheat;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .btn-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-close::before {
          content: "×";
          font-size: 18px;
          line-height: 1;
        }

        .notification-body {
          padding: 15px 20px;
          max-height: 300px;
          overflow-y: auto;
        }

        .friend-request-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .friend-request-item:last-child {
          border-bottom: none;
        }

        .request-info {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .request-details {
          margin-left: 12px;
          display: flex;
          flex-direction: column;
        }

        .username {
          font-weight: bold;
          color: wheat;
          font-size: 0.95rem;
        }

        .request-text {
          font-size: 0.8rem;
          color: rgba(245, 222, 179, 0.8);
        }

        .request-actions {
          display: flex;
          gap: 8px;
        }

        .request-actions .btn {
          width: 32px;
          height: 32px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: bold;
        }

        .btn-success {
          background-color: #28a745;
          border-color: #28a745;
        }

        .btn-success:hover {
          background-color: #218838;
          border-color: #1e7e34;
        }

        .btn-danger {
          background-color: #dc3545;
          border-color: #dc3545;
        }

        .btn-danger:hover {
          background-color: #c82333;
          border-color: #bd2130;
        }

        .notification-footer {
          padding: 15px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .btn-outline-light {
          border-color: rgba(255, 255, 255, 0.3);
          color: wheat;
        }

        .btn-outline-light:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.5);
          color: wheat;
        }

        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
        }
      `}</style>
    </div>
  );
};

export default FriendRequestNotification;
