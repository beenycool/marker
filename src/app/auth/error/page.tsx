import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">
              Authentication Error
            </CardTitle>
            <CardDescription>
              Something went wrong with your authentication request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              This could happen if the authentication link has expired or is
              invalid.
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/auth/sign-in">
                <Button className="w-full">Try signing in again</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="outline" className="w-full">
                  Create a new account
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  Go back home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
