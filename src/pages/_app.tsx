// pages/_app.tsx
import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { useRouter } from "next/router";
import { getAuthToken } from "@/utils/auth";
import { AppProps } from "next/app";
import "../styles/globals.css";

interface MyAppProps extends AppProps {
  Component: React.ComponentType<{
    isAuthenticated?: boolean;
  }> & { auth?: boolean };
}

function MyApp({ Component, pageProps }: MyAppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    setIsAuthenticated(!!token);
  }, []);

  return (
    <>
      <Component {...pageProps} isAuthenticated={isAuthenticated} />
      <Toaster />
    </>
  );
}

export default MyApp;
