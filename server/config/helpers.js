const isMember = (project, userId) => {
  return (
    project.userId.toString() === userId ||
    project.members.some((m) => m.userId.toString() === userId)
  );
};

const isAdmin = (project, userId) => {
  return (
    project.userId.toString() === userId ||
    project.members.some(
      (m) => m.userId.toString() === userId && m.role === "admin"
    )
  );
};

const getAvatarUrl = (name) => {
  const encoded = encodeURIComponent(name || "user");
  return `https://ui-avatars.com/api/?name=${encoded}&background=6366F1&color=FFFFFF&rounded=true&size=128`;
};

module.exports = { isMember, isAdmin, getAvatarUrl };
