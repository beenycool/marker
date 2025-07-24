import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SubscriptionManager } from '@/components/subscription/subscription-manager';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  User,
  Shield,
  Palette,
  Globe,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { getDashboardData } from '@/lib/data/get-dashboard-data';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Get usage data directly from database
  const dashboardData = await getDashboardData(user.id);
  const usage = dashboardData.usage;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-gray-300">
            Manage your account, subscription, and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Your profile and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Email</p>
                    <p className="text-white font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Role</p>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Member Since</p>
                    <p className="text-white font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Last Updated</p>
                    <p className="text-white font-medium">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Account (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Preferences
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Theme</p>
                    <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                      Dark Mode
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Language</p>
                    <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                      English (UK)
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        Email Notifications
                      </p>
                      <p className="text-gray-400 text-sm">
                        Receive updates about new features
                      </p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Enabled
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Usage Reminders</p>
                      <p className="text-gray-400 text-sm">
                        Daily limit notifications
                      </p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Enabled
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Security */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Your data and privacy controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Data Collection</p>
                      <p className="text-gray-400 text-sm">
                        Analytics and performance data
                      </p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      Minimal
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        Submission History
                      </p>
                      <p className="text-gray-400 text-sm">
                        Your answers and feedback
                      </p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Encrypted
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Privacy Policy
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Data Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Sidebar */}
          <div className="lg:col-span-1">
            <SubscriptionManager
              subscription={null}
              usage={usage || { used: 0, limit: 20, percentage: 0 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
