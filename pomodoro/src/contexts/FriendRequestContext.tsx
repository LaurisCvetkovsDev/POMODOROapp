import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Friend } from "../types";
import { friendService } from "../services/api";
import { useAuth } from "./AuthContext";

interface FriendRequestContextType {
  pendingRequests: Friend[];
  pendingCount: number;
  showNotification: boolean;
  refreshRequests: () => Promise<void>;
  dismissNotification: () => void;
  acceptRequest: (friendId: number) => Promise<void>;
  declineRequest: (friendId: number) => Promise<void>;
}

const FriendRequestContext = createContext<
  FriendRequestContextType | undefined
>(undefined);

export const useFriendRequests = () => {
  const context = useContext(FriendRequestContext);
  if (!context) {
    throw new Error(
      "useFriendRequests must be used within a FriendRequestProvider"
    );
  }
  return context;
};

interface FriendRequestProviderProps {
  children: ReactNode;
}

export const FriendRequestProvider: React.FC<FriendRequestProviderProps> = ({
  children,
}) => {
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);

  const { user } = useAuth();

  const refreshRequests = async () => {
    if (!user) {
      console.log("🚫 No user logged in, clearing friend requests");
      setPendingRequests([]);
      setPendingCount(0);
      return;
    }

    try {
      console.log(
        "🔄 FriendRequestContext: Refreshing requests for user:",
        user.id,
        "username:",
        user.username
      );
      const friendsList = await friendService.getFriends(user.id);
      console.log("📋 FriendRequestContext: Raw friends data:", friendsList);

      if (Array.isArray(friendsList)) {
        console.log(
          "📊 FriendRequestContext: Processing",
          friendsList.length,
          "friend relationships"
        );

        // Log each friend relationship for debugging
        friendsList.forEach((friend, index) => {
          console.log(`🔍 Friend ${index + 1}:`, {
            id: friend.id,
            user_id: friend.user_id,
            friend_id: friend.friend_id,
            username: friend.username,
            status: friend.status,
            isIncomingRequest:
              friend.status === "pending" && friend.friend_id === user.id,
            isOutgoingRequest:
              friend.status === "pending" && friend.user_id === user.id,
            currentUserId: user.id,
          });
        });

        // Filter for incoming friend requests (requests sent TO the current user)
        const incoming = friendsList.filter(
          (friend) =>
            friend.status === "pending" && friend.friend_id === user.id
        );

        console.log(
          "📥 FriendRequestContext: Incoming requests found:",
          incoming.length
        );
        console.log("📥 FriendRequestContext: Incoming requests:", incoming);

        setPendingRequests(incoming);
        setPendingCount(incoming.length);

        // Show notification if there are new requests
        if (incoming.length > previousCount && previousCount >= 0) {
          console.log(
            "🔔 FriendRequestContext: Showing notification for new requests"
          );
          setShowNotification(true);
        }

        setPreviousCount(incoming.length);
      } else {
        console.error(
          "❌ FriendRequestContext: API did not return an array:",
          friendsList
        );
      }
    } catch (error) {
      console.error(
        "❌ FriendRequestContext: Failed to refresh friend requests:",
        error
      );
    }
  };

  const dismissNotification = () => {
    setShowNotification(false);
  };

  const acceptRequest = async (friendId: number) => {
    if (!user) return;

    try {
      await friendService.acceptFriend(user.id, friendId);
      await refreshRequests(); // Refresh the list after accepting
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      throw error;
    }
  };

  const declineRequest = async (friendId: number) => {
    if (!user) return;

    try {
      await friendService.removeFriend(user.id, friendId);
      await refreshRequests(); // Refresh the list after declining
    } catch (error) {
      console.error("Failed to decline friend request:", error);
      throw error;
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return;

    refreshRequests(); // Initial load

    const interval = setInterval(refreshRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const value: FriendRequestContextType = {
    pendingRequests,
    pendingCount,
    showNotification,
    refreshRequests,
    dismissNotification,
    acceptRequest,
    declineRequest,
  };

  return (
    <FriendRequestContext.Provider value={value}>
      {children}
    </FriendRequestContext.Provider>
  );
};
