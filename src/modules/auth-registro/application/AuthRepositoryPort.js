export const createAuthRepositoryPort = (repository) => ({
  loginWithEmail: repository.loginWithEmail,
  loginWithGoogle: repository.loginWithGoogle,
  linkPasswordToGoogleUser: repository.linkPasswordToGoogleUser,
  getUserById: repository.getUserById,
  saveUser: repository.saveUser,
});
