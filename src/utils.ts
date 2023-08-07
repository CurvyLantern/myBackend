export const socketEvents = {
  join: "join-room",
  joined: "joined-room",
  friendJoined: "friend-joined-room",
  receive: "create-receive-peer",
  sendSignal: "send-signal-to-friend",
  receiveSignal: "receive-signal-from-friend",
  logggingOut: "logging-out",
  friendLogout: "friend-logged-out",
  askPermission: "asking-permission",
  permissionGranted: "permission-granted",
  permissionRejected: "permission-rejected",
  grantPermission: "permission-granted",
} as const;
