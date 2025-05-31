// src/pages/account/change-password.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { changePassword as changePasswordApi, ChangePasswordData } from '@/utils/api';
import { useAuth, removeAuthToken } from '@/utils/auth'; // useAuth untuk melindungi halaman
import Link from 'next/link';

export default function ChangePasswordPage() {
  const { getAuthToken } = useAuth(); // Memastikan user sudah login
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ChangePasswordData>({
    oldPassword: '',
    newPassword: '',
  });
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.newPassword !== confirmNewPassword) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (formData.newPassword.length < 6) {
      toast({ title: 'Validation Error', description: 'New password must be at least 6 characters long.', variant: 'destructive' });
      return;
    }
    if (formData.oldPassword === formData.newPassword) {
      toast({ title: 'Validation Error', description: 'New password cannot be the same as the old password.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await changePasswordApi(formData);
      toast({
        title: 'Success',
        description: response.message + " Please log in again with your new password.",
      });
      // Logout user setelah ganti password berhasil agar login ulang
      removeAuthToken();
      localStorage.removeItem('user');
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Change password error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Jika token tidak ada (misalnya dari useAuth), bisa redirect atau tampilkan pesan
  if (!getAuthToken()) {
     // useAuth hook seharusnya sudah menangani redirect, ini hanya fallback
     if (typeof window !== 'undefined') router.push('/auth/login');
     return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Change Password</CardTitle>
          <CardDescription>Enter your old password and set a new one.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Old Password</Label>
              <Input
                id="oldPassword"
                name="oldPassword"
                type="password"
                value={formData.oldPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
             <p className="text-sm text-center">
              <Link href="/" className="font-medium text-primary hover:underline">
                Back to Home
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}