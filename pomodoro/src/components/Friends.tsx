import React, { useState, useEffect, useCallback } from "react";
import { friendService } from "../services/api";
import { Friend } from "../types";
import Avatar from "boring-avatars";
import { useAuth } from "../contexts/AuthContext";
import { usePomodoroStore } from "../store/pomodoroStore";
import { useFriendRequests } from "../contexts/FriendRequestContext";
import tomatoGif from "../assets/000102401.gif";

const Friends: React.FC = () => {
  // State variables
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendUsername, setNewFriendUsername] = useState("");
  const [messages, setMessages] = useState({ error: "", success: "" });
  const [userCounts, setUserCounts] = useState({ daily: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Contexts
  const { user } = useAuth();
  const { isCompleted } = usePomodoroStore();
  const { refreshRequests } = useFriendRequests();

  // Friends by status
  const pendingRequests = friends.filter((f) => f.status === "pending");
  const acceptedFriends = friends.filter((f) => f.status === "accepted");

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages({ error: "", success: "" });
  }, []);

  const showMessage = useCallback(
    (type: "error" | "success", message: string, duration = 5000) => {
      clearMessages();
      setMessages((prev) => ({ ...prev, [type]: message }));
      setTimeout(clearMessages, duration);
    },
    [clearMessages]
  );

  // Load user counts
  const loadUserCounts = useCallback(async (userId: number) => {
    try {
      const response = await fetch(
        `http://localhost/POMODOROapp/backend/api/friend_actions.php?action=get_user_counts&user_id=${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch user counts");
      const data = await response.json();
      setUserCounts({
        daily: data.daily_pomodoros || 0,
        total: data.total_pomodoros || 0,
      });
    } catch (err) {
      console.error("Failed to load user counts:", err);
    }
  }, []);

  // Load friends list
  const loadFriends = useCallback(
    async (currentUserId: number) => {
      try {
        const friendsList = await friendService.getFriends(currentUserId);
        if (Array.isArray(friendsList)) {
          setFriends(friendsList);
        } else {
          console.error(
            "API did not return an array for friends list:",
            friendsList
          );
          setFriends([]);
          showMessage("error", "Unexpected data from server.");
        }
      } catch (err) {
        console.error("Failed to load friends:", err);
        showMessage("error", "Failed to load friends");
        setFriends([]);
      }
    },
    [showMessage]
  );

  // Add friend
  const handleAddFriend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearMessages();

      if (!user) {
        showMessage("error", "You must be logged in to add friends.");
        return;
      }

      const username = newFriendUsername.trim();
      if (!username) {
        showMessage("error", "Please enter username.");
        return;
      }

      // Check if trying to add yourself
      if (username.toLowerCase() === user.username.toLowerCase()) {
        showMessage("error", "You cannot add yourself as a friend.");
        return;
      }

      // Check if already friends or request pending
      const existingFriend = friends.find(
        (f) => f.username?.toLowerCase() === username.toLowerCase()
      );

      if (existingFriend) {
        const message =
          existingFriend.status === "accepted"
            ? `You are already friends with ${username}.`
            : `Friend request with ${username} is already pending approval.`;
        showMessage("error", message);
        return;
      }

      setIsLoading(true);

      try {
        const userId = parseInt(user.id.toString());
        await friendService.addFriend(userId, username);

        showMessage("success", `Friend request sent to ${username}!`);
        setNewFriendUsername("");

        await Promise.all([loadFriends(userId), refreshRequests()]);
      } catch (err) {
        console.error("Add friend error:", err);

        if (err instanceof Error) {
          const errorMessage = err.message.toLowerCase();
          let message = err.message;

          if (
            errorMessage.includes("user not found") ||
            errorMessage.includes("does not exist")
          ) {
            message = `User "${username}" does not exist. Please check the username and try again.`;
          } else if (errorMessage.includes("already friends")) {
            message = `You are already friends with ${username}.`;
          } else if (
            errorMessage.includes("pending") ||
            errorMessage.includes("request already sent")
          ) {
            message = `Friend request to ${username} is already pending approval.`;
          } else if (errorMessage.includes("cannot add yourself")) {
            message = "You cannot add yourself as a friend.";
          }

          showMessage("error", message, 8000);
        } else {
          showMessage(
            "error",
            "Failed to send friend request. Please check your connection and try again.",
            8000
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      user,
      newFriendUsername,
      friends,
      showMessage,
      clearMessages,
      loadFriends,
      refreshRequests,
    ]
  );

  // Remove friend
  const handleRemoveFriend = useCallback(
    async (friendshipId: number) => {
      if (!user) return;

      try {
        const userId = parseInt(user.id.toString());
        await friendService.removeFriend(userId, friendshipId);
        showMessage("success", "Friend request rejected");

        await Promise.all([loadFriends(userId), refreshRequests()]);
      } catch (err) {
        console.error("Failed to remove friend:", err);
        showMessage("error", "Failed to reject friend request");
      }
    },
    [user, loadFriends, refreshRequests, showMessage]
  );

  // Accept friend
  const handleAcceptFriend = useCallback(
    async (friendshipId: number) => {
      if (!user) return;

      try {
        const userId = parseInt(user.id.toString());
        await friendService.acceptFriend(userId, friendshipId);
        showMessage("success", "Friend request accepted");

        await Promise.all([loadFriends(userId), refreshRequests()]);
      } catch (err) {
        console.error("Failed to accept friend request:", err);
        showMessage("error", "Failed to accept friend request");
      }
    },
    [user, loadFriends, refreshRequests, showMessage]
  );

  // Load data when user changes
  useEffect(() => {
    if (user) {
      const userId = parseInt(user.id.toString());
      loadFriends(userId);
      loadUserCounts(userId);
    } else {
      setFriends([]);
      setUserCounts({ daily: 0, total: 0 });
    }
  }, [user, loadFriends, loadUserCounts]);

  // Update data when pomodoro is completed
  useEffect(() => {
    if (user && isCompleted) {
      const userId = parseInt(user.id.toString());
      loadUserCounts(userId);
      loadFriends(userId);
    }
  }, [isCompleted, user, loadUserCounts, loadFriends]);

  // Automatic friends list refresh (every 30 seconds)
  useEffect(() => {
    if (!user) return;

    const userId = parseInt(user.id.toString());
    const interval = setInterval(() => loadFriends(userId), 30000);
    return () => clearInterval(interval);
  }, [user, loadFriends]);

  return (
    <div className="friends">
      <h2 className="mb-4">Friends Board</h2>

      {/* User information */}
      {user && (
        <div className="glass-item mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Avatar
                size={40}
                name={user?.username || user?.id?.toString() || ""}
                variant="beam"
                colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
              />
              <span className="ms-3 fs-5">{user.username || "You"}</span>
            </div>
            <div className="d-flex align-items-center gap-4">
              <div className="text-center">
                <div className="fw-bold">
                  Today
                  <img
                    src={tomatoGif}
                    alt="Tomato"
                    className="ms-1"
                    style={{ width: "30px", height: "30px" }}
                  />
                </div>
                <div>{userCounts.daily}</div>
              </div>
              <div className="text-center">
                <div className="fw-bold">
                  Total
                  <img
                    src={tomatoGif}
                    alt="Tomato"
                    className="ms-1"
                    style={{ width: "30px", height: "30px" }}
                  />
                </div>
                <div>{userCounts.total}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="friends-list">
        {/* Add friend form */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Friends</h3>
          <form
            onSubmit={handleAddFriend}
            className="add-friend-form d-flex gap-2"
          >
            <div className="input-group">
              <input
                type="text"
                value={newFriendUsername}
                onChange={(e) => setNewFriendUsername(e.target.value)}
                placeholder="Username"
                className="form-control"
                required
                disabled={isLoading}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "wheat",
                  opacity: isLoading ? 0.6 : 1,
                }}
              />
              <style>
                {`.form-control::placeholder { color: white; opacity: 0.7; }`}
              </style>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{
                  backgroundColor: isLoading ? "#ccc" : "wheat",
                  borderColor: "black",
                  color: "black",
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Adding...
                  </>
                ) : (
                  "Add Friend"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Messages */}
        {messages.error && (
          <div className="error-message alert alert-danger">
            {messages.error}
          </div>
        )}
        {messages.success && (
          <div className="success-message alert alert-success">
            {messages.success}
          </div>
        )}

        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-4">
            <h4 className="text-wheat mb-3">Friend Requests</h4>
            <div className="list-group">
              {pendingRequests.map((friend) => (
                <div key={friend.id} className="list-group-item glass-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <Avatar
                        size={40}
                        name={friend?.username || friend?.id?.toString() || ""}
                        variant="beam"
                        colors={[
                          "#92A1C6",
                          "#146A7C",
                          "#F0AB3D",
                          "#C271B4",
                          "#C20D90",
                        ]}
                      />
                      <span className="ms-3">{friend.username}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        onClick={() => handleAcceptFriend(friend.id)}
                        className="btn btn-primary btn-sm"
                        style={{
                          backgroundColor: "wheat",
                          borderColor: "black",
                          color: "black",
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="btn btn-danger btn-sm"
                        style={{
                          backgroundColor: "rgba(255, 0, 0, 0.2)",
                          borderColor: "rgba(255, 0, 0, 0.3)",
                          color: "wheat",
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted friends */}
        <div>
          <h4 className="text-wheat mb-3">Friends List</h4>
          <div className="list-group">
            {acceptedFriends.length > 0 ? (
              acceptedFriends.map((friend) => (
                <div key={friend.id} className="list-group-item glass-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <Avatar
                        size={40}
                        name={friend?.username || friend?.id?.toString() || ""}
                        variant="beam"
                        colors={[
                          "#92A1C6",
                          "#146A7C",
                          "#F0AB3D",
                          "#C271B4",
                          "#C20D90",
                        ]}
                      />
                      <span className="ms-3">{friend.username}</span>
                    </div>
                    <div className="d-flex align-items-center gap-4">
                      <div className="text-center">
                        <div className="fw-bold">
                          Today{" "}
                          <img
                            src={tomatoGif}
                            alt="Tomato"
                            className="ms-1"
                            style={{ width: "30px", height: "30px" }}
                          />
                        </div>
                        <div>{friend.daily_pomodoros ?? 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="fw-bold">
                          Total
                          <img
                            src={tomatoGif}
                            alt="Tomato"
                            className="ms-1"
                            style={{ width: "30px", height: "30px" }}
                          />
                        </div>
                        <div>{friend.total_pomodoros ?? 0}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="btn btn-danger btn-sm"
                        style={{
                          backgroundColor: "rgba(255, 0, 0, 0.2)",
                          borderColor: "rgba(255, 0, 0, 0.3)",
                          color: "wheat",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No friends added</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;
