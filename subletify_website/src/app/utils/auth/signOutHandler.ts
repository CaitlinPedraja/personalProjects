// src/app/utils/signOutHandler.ts
import { signOut } from 'next-auth/react';

export const handleSignOut = () => {
  const confirmation = confirm("Are you sure you want to log out?");
  if (confirmation) {
    signOut();
  }
};
