import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Disable traditional registration and redirect to login (Google Auth)
  redirect('/auth/login');
}
