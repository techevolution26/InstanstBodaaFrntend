// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Page() {
  // we would want to check auth we could do that here,
  // but for now we always send them to /auth/login
  redirect('/auth/login');
}
