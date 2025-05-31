import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { verifyOtp, resendOtp } from "@/utils/api";
import { setAuthToken, setUserData, useGuest } from "@/utils/auth";
import { VerifyOtpData, ResendOtpData } from "@/types";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export default function VerifyOtpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [otp, setOtp] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  useGuest();

  useEffect(() => {
    if (router.isReady) {
      const queryEmail = router.query.email as string;
      if (queryEmail) {
        setEmail(decodeURIComponent(queryEmail));
      } else {
        toast({
          title: "Error",
          description: "Email not provided for OTP verification.",
          variant: "destructive",
        });
        router.push("/auth/login");
      }
    }
  }, [router.isReady, router.query, toast, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || otp.length !== 6) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const otpData: VerifyOtpData = { email, otp };

    try {
      const response = await verifyOtp(otpData);
      if (response.data && response.data.token) {
        setAuthToken(response.data.token);
        setUserData({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phoneNumber: response.data.phoneNumber,
          isVerified: response.data.isVerified,
        });
        toast({
          title: "Verification Successful",
          description: response.message || "Your account has been verified.",
        });
        router.push("/");
      } else {
        throw new Error(response.error || "Verification failed.");
      }
    } catch (error: any) {
      console.error("OTP Verification error:", error);
      toast({
        title: "Verification Failed",
        description:
          error?.response?.data?.error || error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || countdown > 0) return;

    setResendLoading(true);
    const resendData: ResendOtpData = { email, type: "VERIFICATION" };

    try {
      const response = await resendOtp(resendData);
      toast({
        title: "OTP Resent",
        description:
          response.message || "A new OTP has been sent to your email.",
      });
      setCountdown(60);
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Failed to Resend OTP",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            An OTP has been sent to <strong>{email}</strong>. Please enter it
            below.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col items-center justify-center space-y-6">
            <div className="text-center">
              <Label htmlFor="otp" className="text-lg font-semibold mb-4 block">
                One-Time Password (OTP)
              </Label>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                pattern={REGEXP_ONLY_DIGITS}
                disabled={loading}
                className="justify-center"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 mt-8 w-full">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={handleResendOtp}
              disabled={resendLoading || countdown > 0}
              className="w-full text-center"
            >
              {resendLoading
                ? "Sending..."
                : countdown > 0
                ? `Resend OTP in ${countdown}s`
                : "Resend OTP"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
