import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function Support() {
  const whatsappUrl = "https://wa.me/212678956717";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Nous sommes ravis de vous accompagner
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Un problème technique sur ClinicFlow ? Une idée d’amélioration ou une fonctionnalité à nous proposer ?
            Contactez-nous directement sur WhatsApp, notre équipe est à votre écoute.
          </p>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <div className="bg-green-100 p-4 rounded-full mb-6">
              <MessageCircle className="h-12 w-12 text-green-600" />
            </div>
            
            <p className="text-slate-500 mb-8">
              Cliquez sur le bouton ci-dessous pour ouvrir une conversation WhatsApp avec notre support technique.
            </p>

            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 h-14 text-lg font-medium shadow-lg shadow-green-500/20 w-full"
              >
                <MessageCircle className="w-6 h-6 mr-3" />
                Contacter nous sur WhatsApp
              </Button>
            </a>

            <div className="mt-8 text-sm text-slate-400">
              Ou contactez-nous directement au <a href={whatsappUrl} className="text-primary hover:underline font-mono">+212678956717</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
