import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/212678956717";

export default function Support() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-8 sm:p-12 text-center space-y-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <MessageCircle className="h-7 w-7 text-blue-500" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-support-title">
              Nous sommes ravis de vous accompagner
            </h1>

            <p className="text-slate-600 leading-relaxed max-w-md mx-auto" data-testid="text-support-message">
              Un problème technique sur ClinicFlow ? Une idée d'amélioration ou une fonctionnalité à nous proposer ?
              {" "}Contactez-nous directement sur{" "}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 font-medium underline underline-offset-2 hover:text-blue-600"
                data-testid="link-whatsapp"
              >
                WhatsApp
              </a>
              , notre équipe est à votre écoute.
            </p>

            <div className="pt-2">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 rounded-xl px-8"
                  data-testid="button-whatsapp-cta"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Contactez nous sur WhatsApp
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
