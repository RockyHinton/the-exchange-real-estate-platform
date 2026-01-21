import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-lg bg-white border-slate-200 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">
            The Exchange
          </p>
          <CardTitle className="text-2xl font-serif">Access Denied</CardTitle>
          <CardDescription className="text-base mt-2">
            Your email address is not registered in our system.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 text-center">
          <p className="text-slate-600 mb-6">
            To access The Exchange, your estate agent must first add your email address to your property listing. 
            Please contact your agent to request access.
          </p>
          
          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full" data-testid="button-back-login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
