// src/pages/auth/reset-password.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { resetPassword as resetPasswordApi, ResetPasswordData, resendOtp } from '@/utils/api';
import { useGuest } from '@/utils/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ResetPasswordData>({
    email: '',
    otp: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);


  useGuest();

  useEffect(() => {
    if (router.isReady && router.query.email) {
      setFormData((prev) => ({ ...prev, email: router.query.email as string }));
    }
  }, [router.isReady, router.query.email]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Hanya angka
    if (value.length <= 6) {
      setFormData((prev) => ({ ...prev, otp: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.newPassword.length < 6) {
      toast({ title: 'Validation Error', description: 'New password must be at least 6 characters long.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const response = await resetPasswordApi(formData);
      toast({
        title: 'Success',
        description: response.message,
      });
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!formData.email || countdown > 0) return;
    setResendLoading(true);
    try {
      await resendOtp({ email: formData.email, type: 'PASSWORD_RESET' });
      toast({ title: 'OTP Resent', description: 'A new password reset OTP has been sent to your email.' });
      setCountdown(60);
    } catch (error: any) {
      toast({ title: 'Error Resending OTP', description: error.response?.data?.error || 'Could not resend OTP.', variant: 'destructive' });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Enter your email, the OTP you received, and your new password.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading || !!router.query.email} // Disable if email from query
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                value={formData.otp}
                onChange={handleOtpChange}
                maxLength={6}
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
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-8">
            <Button type="submit" className="w-full" disabled={loading || formData.otp.length !== 6}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={handleResendOtp}
              disabled={resendLoading || countdown > 0 || !formData.email}
              className="w-full"
            >
              {resendLoading ? 'Sending...' : countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </Button>
             <p className="text-sm text-center">
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Back to Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}